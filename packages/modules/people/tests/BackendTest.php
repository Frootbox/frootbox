<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Tests;

use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\People\Backend\ImagePreview;
use Frootbox\People\Backend\LocationHandler;
use Frootbox\People\Backend\LocationsHandler;
use Frootbox\People\Backend\PeopleHandler;
use Frootbox\People\Backend\PersonHandler;
use Frootbox\People\PeopleExtension;
use Frootbox\People\Person\PersonStore;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(PeopleHandler::class)]
#[CoversClass(PersonHandler::class)]
#[CoversClass(LocationsHandler::class)]
#[CoversClass(LocationHandler::class)]
#[CoversClass(ImagePreview::class)]
#[CoversClass(PeopleExtension::class)]
final class BackendTest extends BackendTestCase
{
    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), PeopleTestCase::package()], 'people-backend');
    }

    protected function config(): array
    {
        return ['languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }

    public function testEditorsKeepTheTeamAndTheLocations(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $list = $this->html($this->request('GET', '/cms/people', session: $session));
        self::assertStringContainsString('href="/cms/people" aria-current="page"', $list, 'The sidebar has the screen.');
        self::assertStringContainsString('Noch keine Personen', $list);
        self::assertStringContainsString('<fb-form action="frootbox/people/location.create" next="/cms/people/locations/{id}"', $this->html($this->request('GET', '/cms/people/locations/new', session: $session)));
        self::assertStringContainsString('<fb-form action="frootbox/people/person.create" next="/cms/people/{id}"', $this->html($this->request('GET', '/cms/people/new', session: $session)));

        $location = $this->id($this->action('frootbox/people/location.create', ['translations' => ['de' => ['name' => 'Café am Hafen']], 'city' => 'Hamburg'], $session));
        $this->action('frootbox/people/location.publish', ['id' => $location], $session);
        $person = $this->id($this->action('frootbox/people/person.create', ['givenName' => 'Maria', 'familyName' => 'Rossi', 'translations' => ['de' => ['role' => 'Röstmeisterin']]], $session));
        $this->action('frootbox/people/person.update', ['id' => $person, 'locations' => [$location]], $session);

        $show = $this->html($this->request('GET', '/cms/people/' . $person, session: $session));
        self::assertStringContainsString('<h1 class="fb-heading-1" tabindex="-1" data-fb-focus>Maria Rossi</h1>', $show);
        self::assertStringContainsString('value="Röstmeisterin"', $show);
        self::assertMatchesRegularExpression('#name="locations\[\]"[^>]*value="' . $location . '"[^>]*checked#', $show);
        self::assertStringContainsString('<fb-form action="frootbox/people/person.publish"', $show);

        self::assertStringContainsString('value="maria-rossi" id="person-slug" name="slug"', $show, 'The address of the profile from the name.');
        self::assertStringNotContainsString('person.unpublish', $show, 'Only published people go offline.');

        $this->action('frootbox/people/person.publish', ['ids' => [$person]], $session);
        self::assertStringContainsString('<fb-form action="frootbox/people/person.unpublish"', $this->html($this->request('GET', '/cms/people/' . $person, session: $session)));
        $list = $this->html($this->request('GET', '/cms/people', session: $session));
        self::assertStringNotContainsString('aria-label="Verwaltungen"', $list, 'One space, no tabs.');
        self::assertStringContainsString('href="/cms/people/' . $person . '">Maria Rossi</a>', $list);
        self::assertStringContainsString('Röstmeisterin', $list);

        $locations = $this->html($this->request('GET', '/cms/people/locations', session: $session));
        self::assertStringContainsString('href="/cms/people/locations/' . $location . '">Café am Hafen</a>', $locations);

        // With a second space a tab for each, new people go into the chosen one (decision 0242).
        $doctors = $this->runner()->run(new CreateSpace(PersonStore::TYPE, 'Ärzte'), Context::system())->id;
        $list = $this->html($this->request('GET', '/cms/people?space=' . $doctors, session: $session));
        self::assertStringContainsString('aria-label="Verwaltungen"', $list);
        self::assertStringContainsString('href="/cms/people/new?space=' . $doctors . '"', $list);
        self::assertStringNotContainsString('Maria Rossi', $list);
        self::assertStringContainsString('<input type="hidden" name="space" value="' . $doctors . '">', $this->html($this->request('GET', '/cms/people/new?space=' . $doctors, session: $session)));

        $english = $this->html($this->request('GET', '/cms/people/locations/' . $location . '?language=en', session: $session));
        self::assertStringContainsString('name="translations.en.name" value="Café am Hafen"', $english, 'The English version starts from the first.');
    }

    /**
     * @param array<mixed> $answer
     */
    private function id(array $answer): string
    {
        self::assertIsArray($answer['data'] ?? null);
        $id = $answer['data']['id'] ?? null;
        self::assertIsString($id);

        return $id;
    }
}
