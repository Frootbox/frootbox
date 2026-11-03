<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Tests;

use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Tests\Support\FixtureSite;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Frootbox\GoogleFonts\Font\ImportedFonts;
use Frootbox\GoogleFonts\GoogleFontsApi;

/**
 * A website in German and Arabic with Google Fonts, whose servers answer
 * from here: nothing goes to the network.
 */
abstract class GoogleFontsTestCase extends NotesTestCase
{
    public const string ROOT = __DIR__ . '/..';

    protected FakeGoogle $google;

    protected function setUp(): void
    {
        parent::setUp();
        $this->google = new FakeGoogle();
        $this->container->set(GoogleFontsApi::class, $this->google->api());
    }

    public static function package(): ExtensionPackage
    {
        return ExtensionPackage::fromManifest('frootbox/google-fonts', (string) realpath(self::ROOT), psr4: ['Frootbox\GoogleFonts\\' => ['src/'], 'Frootbox\GoogleFonts\Migrations\\' => ['migrations/']]);
    }

    protected function extensions(): Extensions
    {
        return new Extensions([...FixtureSite::extensions('base', 'site')->packages, self::package()], 'google-fonts');
    }

    protected function config(): array
    {
        return ['app' => ['name' => 'Testsite', 'url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'ar' => ['title' => 'العربية']]];
    }

    protected function tables(): array
    {
        return [ImportedFonts::TABLE];
    }
}
