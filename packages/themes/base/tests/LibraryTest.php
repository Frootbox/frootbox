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
use Frootbox\Core\Design\DesignPage;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PageHandler;
use Frootbox\Core\Page\PageOutline;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Preview\PreviewAccess;
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
 * and headings pass blocks:check, its start state renders as valid HTML
 * at the three places, in the main area, in one of two columns and in a
 * narrow column of a third, and its examples on the design page in every
 * view (decision 0209). The small sample website renders as well.
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
    private const array MAIN_AREA_ONLY = ['Hero', 'JumpBar', 'PageHeader', 'Section'];

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

        self::assertSame(0, $console->run(new ArrayInput(['command' => 'seed', 'file' => self::THEME . ':demo/site.yaml']), $output), $output->fetch());

        foreach (['/', '/ueber-uns', '/kaffee', '/aktion', '/impressum'] as $path) {
            $html = $this->page($path);
            self::assertSame([], self::htmlErrors($html), $path);

            if ('/' === $path) {
                self::assertMatchesRegularExpression('#<p class="base-footer__heading" id="base-footer-1">Rösterei</p>\s*<ul aria-labelledby="base-footer-1">\s*<li><a href="/ueber-uns">Über uns</a></li>#', $html, 'An entry with entries below is a column (decision 0195).');
                self::assertMatchesRegularExpression('#</div>\s*<ul class="base-nav__list">\s*<li><a href="/impressum">Impressum</a></li>\s*</ul>\s*</nav>#', $html, 'The others stay a row below the columns.');
                self::assertStringContainsString('<a href="tel:+4940123456" dir="ltr">+49 40 123456</a>', $html, 'Phone numbers keep their order in right-to-left languages.');
                self::assertStringContainsString('--radius-button:999px;', $html, 'Buttons have round ends unless the theme says otherwise (decision 0197).');
            }

            if ('/kaffee' === $path) {
                self::assertMatchesRegularExpression('#<base-jump-bar class="base-jump-bar base-full">\s*<nav aria-label="Auf dieser Seite">\s*<ul class="base-jump-bar__list">\s*<li><a href="\#roesterei">Rösterei</a></li>\s*<li><a href="\#sorten-und-abos">Sorten und Abos</a></li>\s*<li><a href="\#fuer-firmen">Für Firmen</a></li>#', $html, 'The bar fills itself from the jump marks below it (decision 0196).');
                self::assertStringContainsString('<section id="fuer-firmen" class="base-section', $html);
                self::assertStringNotContainsString('base-jump-bar__hint', $html, 'The hint is for editors only.');
            }
        }
    }

    public function testShowsEveryBlockOnTheDesignPage(): void
    {
        // Decision 0209: the design page in each view stands in for the
        // pages of the old sample website, one per block.
        $html = $this->design('');
        self::assertSame([], self::htmlErrors($html));
        self::assertStringNotContainsString('<ul class="fb-design-missing">', $html, 'Every block has an example.');
        self::assertStringNotContainsString('This block cannot be shown', $html);

        self::assertStringContainsString('<div class="base-table__scroll" tabindex="0" role="group" aria-label="Öffnungszeiten">', $html);
        self::assertStringContainsString('<thead><tr><th scope="col">Tag</th><th scope="col">Laden</th><th scope="col">Café</th></tr></thead><tbody><tr><th scope="row">Montag bis Freitag</th><td>8–18 Uhr</td>', $html);
        self::assertStringContainsString('<td>10–16 Uhr<br>nur bei Sonne</td>', $html);
        self::assertMatchesRegularExpression('#<p class="base-hero__eyebrow">Rösterei am Hafen</p>\s*<h4 class="base-hero__title"#', $html, 'The eyebrow stands above the heading (decision 0188).');
        self::assertMatchesRegularExpression('#<div class="base-features__head base-head">\s*<p class="base-head__eyebrow">Rösterei am Hafen</p>\s*<h4 class="base-features__title"[^>]*>Warum wir</h4>\s*<p class="base-head__intro">Vier Gründe, warum unser Kaffee anders schmeckt\.</p>\s*</div>#', $html, 'Eyebrow, heading and introduction (decision 0192).');
        self::assertStringContainsString('<a href="/assets/frootbox/theme-base/assets/examples/price-list.pdf" type="application/pdf">price-list <small>PDF, 1 KB</small></a>', $html, 'Without a title the name of the file.');
        self::assertStringContainsString('type="text/csv">Unsere Sorten als Tabelle <small>CSV, 1 KB</small></a>', $html);
        self::assertStringContainsString('<a href="tel:+4940123456" dir="ltr">+49 40 123456</a>', $html, 'Phone numbers keep their order in right-to-left languages, also in the contact block.');
        self::assertMatchesRegularExpression('#<base-jump-bar [^>]*class="base-jump-bar base-full">\s*<nav aria-label="Auf dieser Seite">\s*<ul class="base-jump-bar__list">\s*<li><a href="\#fb-design-tokens">Tokens</a></li>\s*<li><a href="\#fb-design-elements">Basic elements</a></li>\s*<li><a href="\#fb-design-richtext">Rich text</a></li>\s*<li><a href="\#fb-design-blocks">Blocks</a></li>#', $html, 'The jump bar leads to the sections of the design page (decision 0213), in English without the translations of the backend.');
        self::assertStringNotContainsString('base-jump-bar__hint', $html);

        foreach (['place=column' => null, 'place=narrow' => null, 'surface=surface' => 'surface', 'surface=primary' => 'primary', 'surface=dark' => 'dark'] as $view => $surface) {
            $html = $this->design('?' . $view);
            self::assertSame([], self::htmlErrors($html), $view);
            self::assertStringNotContainsString('This block cannot be shown', $html, $view);
            preg_match_all('#<ul class="fb-design-missing">(.*?)</ul>#s', $html, $lists);
            preg_match_all('#<li>([^<]+)</li>#', implode('', $lists[1]), $elsewhere);
            self::assertSame(['Hero', 'Seitenkopf', 'Sprungleiste', 'Abschnitt'], $elsewhere[1], $view . ': only these stand in the main area alone.');

            if (null !== $surface) {
                $blocks = substr_count(substr($html, (int) strpos($html, 'fb-design-blocks-title')), 'fb-design-caption') - 1;
                self::assertGreaterThan(30, $blocks);
                self::assertSame($blocks, substr_count($html, 'base-section--' . $surface), $view . ': every block stands on the surface (decisions 0191, 0198).');
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
     * A published page as a guest sees it.
     */
    private function page(string $path): string
    {
        // Each request starts afresh, as in its own process.
        $this->get(Urls::class)->clear();
        $this->get(PageOutline::class)->clear();
        $response = $this->get(PageHandler::class)->handle(new ServerRequest('GET', 'https://example.org' . $path));
        self::assertSame(200, $response->getStatusCode(), $path);

        return (string) $response->getBody();
    }

    /**
     * A view of the design page, as the agency sees it with a preview link.
     */
    private function design(string $view): string
    {
        $this->get(PageOutline::class)->clear();
        $request = new ServerRequest('GET', 'https://example.org/_design' . $view)
            ->withAttribute(PreviewAccess::class, new PreviewAccess('01JPREVIEW0000000000000000', new DateTimeImmutable('+1 day')));
        parse_str(ltrim($view, '?'), $query);
        $response = $this->get(DesignPage::class)->handle($request->withQueryParams($query));
        self::assertSame(200, $response->getStatusCode(), $view);

        return (string) $response->getBody();
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
