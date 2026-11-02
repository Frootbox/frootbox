<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\ThemeBase\Tests;

use DateTimeImmutable;
use Frootbox\Core\Auth\AccessToken;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Auth\Authentication;
use Frootbox\Core\Auth\TokenType;
use Frootbox\Core\Component\BlockSummary;
use Frootbox\Core\Component\ListBlocks;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PageHandler;
use Frootbox\Core\Page\PageOutline;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Frootbox\Core\Url\Urls;
use Frootbox\Core\User\AssignRole;
use Frootbox\Core\User\CreateUser;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\Attributes\CoversNothing;
use Symfony\Component\Console\Application as ConsoleApplication;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

/**
 * Every block of the base library (decision 0163): its manifest, previews
 * and headings pass blocks:check, and its start state renders as valid
 * HTML at the three places, in the main area, in one of two columns and
 * in a narrow column of a third.
 */
#[CoversNothing]
final class LibraryTest extends NotesTestCase
{
    private const string THEME = 'frootbox/theme-base';

    /** The places by the variant of the section around the block; in the main area only widgets need one. */
    private const array PLACES = [
        'in the main area' => 'Default',
        'in one of two columns' => 'Two',
        'in a narrow column' => 'OneTwo',
    ];

    /** Blocks that only stand in the main area, all others also go into the columns of a section. */
    private const array MAIN_AREA_ONLY = ['Hero', 'PageHeader', 'Section'];

    public function testPassesTheChecksOfTheBlocks(): void
    {
        $console = $this->get(ConsoleApplication::class);
        $console->setAutoExit(false);
        $output = new BufferedOutput();

        self::assertSame(0, $console->run(new ArrayInput(['command' => 'blocks:check']), $output));
        self::assertMatchesRegularExpression('/\[OK\] \d+ blocks and 3 layouts with \d+ templates are fine\./', $output->fetch(), 'Without hints, e.g. about previews or headings.');
    }

    public function testSeedsTheSampleWebsite(): void
    {
        $console = $this->get(ConsoleApplication::class);
        $console->setAutoExit(false);
        $output = new BufferedOutput();

        self::assertSame(0, $console->run(new ArrayInput(['command' => 'seed', 'file' => self::THEME . ':demo/library.yaml']), $output), $output->fetch());

        foreach (['/', '/heading', '/text', '/button', '/section', '/text-with-heading', '/quote', '/notice', '/divider', '/call-to-action', '/key-figures', '/hero', '/page-header', '/image-with-text', '/gallery', '/slider', '/video', '/cards', '/logos', '/link-list', '/accordion', '/steps', '/testimonials', '/prices', '/contact', '/features', '/downloads', '/aktion', '/impressum'] as $path) {
            $this->get(Urls::class)->clear();
            $this->get(PageOutline::class)->clear();
            $response = $this->get(PageHandler::class)->handle(new ServerRequest('GET', 'https://example.org' . $path));

            self::assertSame(200, $response->getStatusCode(), $path);
            self::assertSame([], self::htmlErrors((string) $response->getBody()), $path);

            if ('/downloads' === $path) {
                self::assertMatchesRegularExpression('#<a href="/media/[0-9A-Z]{26}/1/price-list-main-[0-9a-f]{16}\.pdf" type="application/pdf">Preisliste 2027 <small>PDF, 1 KB</small></a>#', (string) $response->getBody());
                self::assertStringContainsString('type="text/csv">Unsere Sorten als Tabelle <small>CSV, 1 KB</small></a>', (string) $response->getBody());
            }
        }
    }

    public function testRendersEveryBlockAtThreePlaces(): void
    {
        $start = $this->runner()->run(new CreatePage(self::THEME . '/Start', ['de' => ['title' => 'Start']]))->id;
        $this->runner()->run(new PublishPages([$start]));
        $admin = $this->runner()->run(new CreateUser('admin@example.org', 'Admin', 'kaffeebohne42'))->user;
        $this->runner()->run(new AssignRole($admin->id, 'admin'));
        $actor = Actor::user($admin->id, $admin->name);

        $blocks = array_filter($this->runner()->ask(new ListBlocks()), static fn(BlockSummary $block): bool => str_starts_with($block->name, self::THEME . '/'));
        self::assertNotEmpty($blocks);
        $rendered = 0;

        $columns = [];

        foreach ($blocks as $block) {
            if (self::THEME . '/Section' === $block->name) {
                $columns = array_map(static fn(string $name): string => basename($name), $block->areas[0]->allow ?? []);
            }
        }

        $outside = array_values(array_filter(array_map(static fn(BlockSummary $block): string => basename($block->name), $blocks), static fn(string $name): bool => !\in_array($name, $columns, true)));
        sort($outside);
        self::assertSame(self::MAIN_AREA_ONLY, $outside, 'Every block of the library also fits into a column (decision 0163).');

        foreach ($blocks as $block) {
            foreach ($block->variants as $variant) {
                foreach (self::PLACES as $place => $section) {
                    $content = ['block' => $block->name, 'variant' => $variant->name];

                    if ('Default' !== $section && !\in_array(basename($block->name), $columns, true)) {
                        continue;
                    }

                    if ($block->widget || 'Default' !== $section) {
                        $content = ['block' => self::THEME . '/Section', 'variant' => $section, 'areas' => ['first' => [$content]]];
                    }

                    $slug = strtolower(\sprintf('%s-%s-%d', basename($block->name), $variant->name, ++$rendered));
                    $this->runner()->run(new CreatePage(self::THEME . '/Page', ['de' => ['title' => $slug, 'slug' => $slug, 'content' => ['areas' => ['main' => [$content]]]]], $start));

                    $html = $this->html('/' . $slug, $actor);
                    $where = \sprintf('%s, variant %s, %s', $block->name, $variant->name, $place);
                    self::assertStringContainsString(\sprintf('data-fb-name="%s"', $block->name), $html, $where);
                    self::assertSame([], self::htmlErrors($html), $where);
                }
            }
        }

        self::assertGreaterThan(\count($blocks), $rendered);
    }

    protected function extensions(): Extensions
    {
        return new Extensions([ExtensionPackage::fromManifest(self::THEME, \dirname(__DIR__))], 'tests');
    }

    protected function config(): array
    {
        return [
            'app' => ['name' => 'Bibliothek', 'url' => 'https://example.org/'],
            'theme' => self::THEME,
            'languages' => ['de' => ['title' => 'Deutsch']],
        ];
    }

    /**
     * The draft in the editing mode, where empty fields show their placeholders.
     */
    private function html(string $path, Actor $actor): string
    {
        // Each request starts afresh, as in its own process.
        $this->get(Urls::class)->clear();
        $this->get(PageOutline::class)->clear();

        $token = new AccessToken(1, (int) $actor->id, TokenType::Session, null, null, null, new DateTimeImmutable());
        $request = new ServerRequest('GET', 'https://example.org' . $path)
            ->withCookieParams([EditMode::COOKIE => '1'])
            ->withAttribute(Authentication::class, new Authentication($actor, $token));
        $response = $this->get(PageHandler::class)->handle($request);
        self::assertSame(200, $response->getStatusCode(), $path);

        return (string) $response->getBody();
    }

    /**
     * Errors of the HTML parser, e.g. a tag closed twice.
     *
     * @return list<string>
     */
    private static function htmlErrors(string $html): array
    {
        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();
        \Dom\HTMLDocument::createFromString($html);
        $errors = array_map(static fn(\LibXMLError $error): string => trim($error->message), libxml_get_errors());
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        return $errors;
    }
}
