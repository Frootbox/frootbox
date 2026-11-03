<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Tests;

use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Tests\Support\FixtureSite;
use Frootbox\GoogleFonts\Backend\FontsHandler;
use Frootbox\GoogleFonts\Font\ImportedFonts;
use Frootbox\GoogleFonts\GoogleFontsApi;
use Frootbox\GoogleFonts\GoogleFontsExtension;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(FontsHandler::class)]
#[CoversClass(GoogleFontsExtension::class)]
final class BackendTest extends BackendTestCase
{
    private FakeGoogle $google;

    protected function setUp(): void
    {
        parent::setUp();
        $this->google = new FakeGoogle();
        $this->container->set(GoogleFontsApi::class, $this->google->api());
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site'))), GoogleFontsTestCase::package()], 'google-fonts-backend');
    }

    protected function config(): array
    {
        return ['app' => ['name' => 'Testsite', 'url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    protected function tables(): array
    {
        return [ImportedFonts::TABLE];
    }

    public function testAdminsSearchImportAndRemoveFonts(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $html = $this->html($this->request('GET', '/cms/google-fonts', session: $session));
        self::assertStringContainsString('href="/cms/google-fonts" aria-current="page"', $html, 'The sidebar has the screen.');
        self::assertStringContainsString('Noch keine Schriften', $html);
        self::assertStringContainsString('Der Server fragt Google Fonts erst, wenn Du suchst', $html);
        self::assertSame([], $this->google->requests, 'Google only after a search.');

        $html = $this->html($this->request('GET', '/cms/google-fonts?search=1&q=in&category=sans-serif', session: $session));
        self::assertStringContainsString('<span class="fb-list__title">Inter</span>', $html);
        self::assertStringContainsString('Serifenlos · variabel · cyrillic, latin, latin-ext, vietnamese', $html);
        self::assertStringContainsString('Mit Kursiv', $html);
        self::assertStringContainsString('aria-label="Inter importieren"', $html);
        self::assertStringNotContainsString('Lora', $html);

        $font = $this->action('frootbox/google-fonts/font.import', ['family' => 'Inter', 'italic' => false], $session);
        self::assertSame('google-inter', \is_array($font['data'] ?? null) ? $font['data']['key'] ?? null : null);

        $html = $this->html($this->request('GET', '/cms/google-fonts?search=1&q=inter', session: $session));
        self::assertStringContainsString('<span class="fb-list__title" style="font-family: &quot;Inter&quot;, Arial, Helvetica, sans-serif">Inter</span>', $html, 'A sample in the own file.');
        self::assertStringContainsString('Importiert', $html);
        self::assertStringContainsString('Inter entfernen?', $html);

        $this->action('frootbox/google-fonts/font.delete', ['key' => 'google-inter'], $session);
        self::assertStringContainsString('Noch keine Schriften', $this->html($this->request('GET', '/cms/google-fonts', session: $session)));
    }

    public function testGoogleOutOfReachIsExplained(): void
    {
        $this->google->down = true;
        $this->createUser('admin@example.org', ['admin']);

        $html = $this->html($this->request('GET', '/cms/google-fonts?search=1', session: $this->signIn('admin@example.org')));

        self::assertStringContainsString('Google Fonts ist nicht erreichbar. Versuch es später noch einmal.', $html);
    }

    public function testEditorsDoNotSeeTheScreen(): void
    {
        $this->createUser('editor@example.org', ['editor']);

        self::assertSame(403, $this->request('GET', '/cms/google-fonts', session: $this->signIn('editor@example.org'))->getStatusCode());
    }
}
