<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Tests;

use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PageHandler;
use Frootbox\Core\Tests\Support\FixtureSite;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Frootbox\People\Location\CreateLocation;
use Frootbox\People\Location\PublishLocation;
use Frootbox\People\Person\CreatePerson;
use Frootbox\People\Person\PublishPeople;
use Nyholm\Psr7\ServerRequest;

/**
 * A website of the core fixtures with people and locations installed.
 */
abstract class PeopleTestCase extends NotesTestCase
{
    public const string ROOT = __DIR__ . '/..';

    public static function package(): ExtensionPackage
    {
        return ExtensionPackage::fromManifest('frootbox/people', (string) realpath(self::ROOT), psr4: ['Frootbox\People\\' => ['src/'], 'Frootbox\People\Migrations\\' => ['migrations/']]);
    }

    protected function environment(): Environment
    {
        return Environment::Production;
    }

    protected function extensions(): Extensions
    {
        return new Extensions([...FixtureSite::extensions('base', 'site')->packages, self::package()], 'people');
    }

    protected function config(): array
    {
        return ['app' => ['name' => 'Testsite', 'url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }

    /**
     * The café by the harbour, published.
     */
    protected function harbour(bool $publish = true): string
    {
        $id = $this->runner()->run(new CreateLocation(
            ['de' => ['name' => 'Café am Hafen', 'hours' => "Mo–Fr 8–18 Uhr\n\nSa 9–14 Uhr"], 'en' => ['name' => 'Café by the harbour']],
            street: 'Hafenstraße 12',
            postalCode: '20457',
            city: 'Hamburg',
            phone: '+49 40 123456',
            email: 'hafen@example.org',
            coordinates: '53.5444,9.9663',
        ))->id;

        if ($publish) {
            $this->runner()->run(new PublishLocation($id));
        }

        return $id;
    }

    /**
     * A person, published.
     *
     * @param list<string> $locations
     */
    protected function person(string $given, string $family, string $role = '', array $locations = [], int $order = 0, bool $publish = true): string
    {
        $id = $this->runner()->run(new CreatePerson(givenName: $given, familyName: $family, phone: '+49 (40) 123 45-6', email: strtolower($given) . '@example.org', locations: $locations, order: $order, translations: '' === $role ? [] : ['de' => ['role' => $role]]))->id;

        if ($publish) {
            $this->runner()->run(new PublishPeople([$id]));
        }

        return $id;
    }

    /**
     * A published page with the given blocks in its main area.
     *
     * @param list<array<string, mixed>> $blocks
     */
    protected function page(string $title, array $blocks = []): string
    {
        $content = ['fields' => ['heading' => $title], 'areas' => ['main' => $blocks]];

        return $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => $content]]))->id;
    }

    protected function html(string $path): string
    {
        return (string) $this->get(PageHandler::class)->handle(new ServerRequest('GET', 'https://example.org' . $path))->getBody();
    }
}
