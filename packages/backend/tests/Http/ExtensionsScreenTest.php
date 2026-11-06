<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Http\Extensions\ExtensionsHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Backup\BackupManager;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Extension\OfficialModules;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\Frootbox;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PageReader;
use Frootbox\Core\Tests\Fixtures\Migrations\Version20261030000000;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Component\Yaml\Yaml;

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
        self::assertSame(1, substr_count($html, '<fb-form'), 'Read only, but for the cache.');
        self::assertStringContainsString('<fb-form action="system.cache-clear"', $html, 'For webspace without a console.');
        self::assertStringContainsString('Cache leeren', $html);
        self::assertMatchesRegularExpression('~<code>frootbox/backend</code> · 9\.9\.9 · \d+ Bildschirme \([^)]*Erweiterungen[^)]*\)~', $html, 'Screens by the package that added them.');
        self::assertStringContainsString('Weitere offizielle Module', $html);
        self::assertStringContainsString('<span class="fb-list__title">Personen und Standorte</span>', $html, 'Titles in the language of the backend.');
        self::assertStringContainsString('<code>composer require frootbox/people</code>', $html);
    }

    public function testEveryOfficialModuleHasGermanTexts(): void
    {
        $german = Yaml::parseFile(BackendExtension::ROOT . '/translations/de.yaml');
        self::assertIsArray($german);
        $missing = [];

        foreach (OfficialModules::load() as $module) {
            foreach ([$module->title, $module->description] as $text) {
                if (!\array_key_exists($text, $german)) {
                    $missing[] = $text;
                }
            }
        }

        self::assertNotSame([], OfficialModules::load());
        self::assertSame([], $missing, 'Add these texts of the catalog to translations/de.yaml.');
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

    public function testOffersToRunPendingMigrations(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $session = $this->signIn('root@example.org');

        $html = $this->html($this->request('GET', '/cms/extensions', session: $session));
        self::assertStringContainsString('Alle Migrationen des Kerns und der Erweiterungen sind gelaufen.', $html);
        self::assertStringNotContainsString('Migrationen stehen aus', $this->html($this->request('GET', '/cms', session: $session)));

        // As if a module with these migrations just came with Composer (decision 0277).
        $this->connection()->executeStatement('DROP TABLE ' . Version20261030000000::TABLE);

        foreach (['Version20261030000000', 'Version20261030000001'] as $version) {
            $this->connection()->delete('migrations', ['version' => 'Frootbox\Core\Tests\Fixtures\Migrations\\' . $version]);
        }

        $html = $this->html($this->request('GET', '/cms/extensions', session: $session));
        self::assertStringContainsString('2 ausstehend', $html);
        self::assertStringContainsString('Creates the test table test_items', $html);
        self::assertStringContainsString('<code>acme/fixtures</code> · <code>Version20261030000000</code>', $html);

        // SQLite in memory cannot be backed up; MySQL and MariaDB can with mysqldump.
        if ($this->get(BackupManager::class)->available()) {
            self::assertStringContainsString('<fb-form action="system.migrate"', $html);
            self::assertStringNotContainsString('Hier lässt sich vorher kein Backup anlegen', $html);
        } else {
            self::assertStringContainsString('Hier lässt sich vorher kein Backup anlegen', $html);
            self::assertStringContainsString('<input type="hidden" name="withoutBackup" value="true" data-type="boolean">', $html);
        }

        $dashboard = $this->html($this->request('GET', '/cms', session: $session));
        self::assertStringContainsString('2 Migrationen stehen aus', $dashboard);
        self::assertStringContainsString('href="/cms/extensions#extensions-database"', $dashboard);
    }

    public function testAdminsDoNotSeeIt(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');
        $this->connection()->delete('migrations', ['version' => 'Frootbox\Core\Tests\Fixtures\Migrations\\Version20261030000001']);
        self::assertStringNotContainsString('Migration steht aus', $this->html($this->request('GET', '/cms', session: $session)), 'Only for superusers.');

        self::assertStringNotContainsString('href="/cms/extensions"', $this->html($this->request('GET', '/cms/settings', session: $session)));
        self::assertSame(403, $this->request('GET', '/cms/extensions', session: $session)->getStatusCode());
    }

    protected function register(Registry $registry): void
    {
        $registry->migrations('Frootbox\Core\Tests\Fixtures\Migrations', \dirname(__DIR__, 3) . '/core/tests/Fixtures/Migrations', 'acme/fixtures');
    }

    protected function tables(): array
    {
        return [Version20261030000000::TABLE];
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
