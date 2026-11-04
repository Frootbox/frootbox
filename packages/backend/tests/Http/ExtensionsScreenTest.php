<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Extensions\ExtensionsHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Frootbox;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PageReader;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * The installed extensions, read only, for superusers (decision 0274).
 */
#[CoversClass(ExtensionsHandler::class)]
final class ExtensionsScreenTest extends BackendTestCase
{
    public function testSuperusersSeeTheInstalledExtensions(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $session = $this->signIn('root@example.org');

        $html = $this->html($this->request('GET', '/cms/extensions', session: $session));
        self::assertStringContainsString('href="/cms/extensions" aria-current="page"', $html, 'In the menu under Administration.');
        self::assertStringContainsString('Kern ' . Frootbox::version(), $html, 'In the language of the backend.');
        self::assertStringContainsString('<code>frootbox/backend</code> · 9.9.9', $html);
        self::assertStringContainsString('<code>acme/base</code>', $html);
        self::assertMatchesRegularExpression('~<code>acme/base</code> · \d+ Blöcke · 1 Layout~', $html);
        self::assertSame(2, substr_count($html, 'Aktives Theme'), 'The theme and its parent.');
        self::assertStringContainsString('composer require frootbox/news', $html);
        self::assertStringNotContainsString('<fb-form', $html, 'Read only.');
    }

    public function testShowsThePagesOfAnExtensionAndWhatIsMissing(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $session = $this->signIn('root@example.org');
        $page = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Start', 'content' => ['areas' => ['main' => [['id' => 'teaser01', 'block' => 'acme/base/Teaser']]]]]]), Context::system());

        $html = $this->html($this->request('GET', '/cms/extensions', session: $session));
        self::assertMatchesRegularExpression('~<code>acme/base</code> · [^<]* · Auf 1 Seite~', $html);
        self::assertStringNotContainsString('Fehlende Blöcke und Layouts', $html);

        // As if the extension of a block was removed after it was put on the page (decision 0276).
        $draft = $this->get(PageReader::class)->draft($page->id);
        self::assertNotNull($draft);
        $content = ['areas' => ['main' => [['id' => 'teaser01', 'block' => 'acme/base/Teaser'], ['id' => 'orphan01', 'block' => 'acme/gone/Promo']]]];
        $data = $draft->with(translations: ['de' => $draft->translations['de']->withContent($content)])->toArray();
        $this->connection()->update('revisions', ['data' => json_encode($data, \JSON_THROW_ON_ERROR)], ['type' => PageReader::TYPE, 'entity_id' => $page->id]);

        $html = $this->html($this->request('GET', '/cms/extensions', session: $session));
        self::assertStringContainsString('Fehlende Blöcke und Layouts', $html);
        self::assertStringContainsString('<code>acme/gone/Promo</code>', $html);
        self::assertStringContainsString('Block · <a href="/cms/pages/' . $page->id . '">Start</a>', $html);
    }

    public function testAdminsDoNotSeeIt(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        self::assertStringNotContainsString('href="/cms/extensions"', $this->html($this->request('GET', '/cms/settings', session: $session)));
        self::assertSame(403, $this->request('GET', '/cms/extensions', session: $session)->getStatusCode());
    }

    protected function extensions(): Extensions
    {
        $backend = self::backend();

        return new Extensions([
            new ExtensionPackage($backend->name, $backend->path, $backend->title, $backend->description, $backend->extensionClass, version: '9.9.9'),
            ...FixtureSite::extensions('base', 'site')->packages,
        ], 'extensions-screen');
    }

    protected function config(): array
    {
        return ['theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }
}
