<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Tests;

use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Database\EntityNotFoundException;
use Frootbox\People\Details;
use Frootbox\People\Input;
use Frootbox\People\Location\DeleteLocation;
use Frootbox\People\Location\LocationChoices;
use Frootbox\People\Location\LocationData;
use Frootbox\People\Location\LocationEditor;
use Frootbox\People\Location\LocationStore;
use Frootbox\People\Location\PublishLocation;
use Frootbox\People\Location\ShowLocation;
use Frootbox\People\Location\UpdateLocation;
use Frootbox\People\Person\CreatePerson;
use Frootbox\People\Person\DiscardPerson;
use Frootbox\People\Person\ListPeople;
use Frootbox\People\Person\PersonChoices;
use Frootbox\People\Person\PersonData;
use Frootbox\People\Person\PersonEditor;
use Frootbox\People\Person\PersonStore;
use Frootbox\People\Person\PersonSummary;
use Frootbox\People\Person\PublishPeople;
use Frootbox\People\Person\ShowPerson;
use Frootbox\People\Person\UpdatePerson;
use Frootbox\People\Status;
use Frootbox\People\Store;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * People and locations with drafts (decision 0226).
 */
#[CoversClass(Store::class)]
#[CoversClass(Details::class)]
#[CoversClass(Input::class)]
#[CoversClass(PersonEditor::class)]
#[CoversClass(PersonData::class)]
#[CoversClass(PersonStore::class)]
#[CoversClass(LocationEditor::class)]
#[CoversClass(LocationData::class)]
#[CoversClass(LocationStore::class)]
final class PeopleTest extends PeopleTestCase
{
    public function testDraftsArePublishedOnlyWhenComplete(): void
    {
        $id = $this->runner()->run(new CreatePerson(translations: ['de' => ['role' => 'Röstmeisterin']]))->id;
        self::assertSame(Status::Draft, $this->runner()->ask(new ShowPerson($id))->status);

        try {
            $this->runner()->run(new PublishPeople([$id]));
            self::fail('A person without a name is not published.');
        } catch (InvalidInputException $exception) {
            self::assertArrayHasKey('/ids/0/familyName', $exception->errors);
        }

        $this->runner()->run(new UpdatePerson($id, givenName: '  Maria ', familyName: 'Rossi', prefix: 'Dr.'));
        $details = $this->runner()->run(new PublishPeople([$id]))[0];
        self::assertSame(Status::Published, $details->status);
        self::assertSame('Dr. Maria Rossi', $details->current()->name());
        self::assertSame('Röstmeisterin', $details->current()->text('en')->role, 'Other languages fall back to the first.');

        $this->runner()->run(new UpdatePerson($id, translations: ['de' => ['role' => 'Inhaberin']]));
        self::assertSame(Status::Changed, $this->runner()->ask(new ShowPerson($id))->status);
        self::assertSame('Röstmeisterin', $this->get(PersonStore::class)->published($id)?->text('de')->role, 'The website keeps the published version.');

        $this->runner()->run(new DiscardPerson($id));
        self::assertSame(Status::Published, $this->runner()->ask(new ShowPerson($id))->status);
    }

    public function testChecksWhatComesIn(): void
    {
        try {
            $this->runner()->run(new CreatePerson(familyName: 'Rossi', email: 'no address', phone: 'call me', locations: ['01JAAAAAAAAAAAAAAAAAAAAAAA'], translations: ['fr' => ['role' => 'Chef']]));
            self::fail('Wrong input is refused.');
        } catch (InvalidInputException $exception) {
            self::assertSame(['/translations/fr', '/email', '/phone', '/locations/0'], array_keys($exception->errors), 'All at once.');
        }

        $harbour = $this->harbour();
        self::assertSame('53.5444, 9.9663', $this->runner()->ask(new ShowLocation($harbour))->current()->coordinates, 'Coordinates are written the same way.');

        try {
            $this->runner()->run(new UpdateLocation($harbour, coordinates: '95, 10', image: ['media' => 'nope']));
            self::fail('Wrong coordinates are refused.');
        } catch (InvalidInputException $exception) {
            self::assertSame(['/coordinates', '/image'], array_keys($exception->errors));
        }

        try {
            $this->runner()->run(new UpdateLocation($harbour, translations: ['de' => ['name' => '']]));
            $this->runner()->run(new PublishLocation($harbour));
            self::fail('A location needs a name.');
        } catch (InvalidInputException $exception) {
            self::assertArrayHasKey('/translations/de/name', $exception->errors);
        }
    }

    public function testListsTheTeamInItsOrder(): void
    {
        $harbour = $this->harbour();
        $this->person('Zoe', 'Abel', order: 5);
        $this->person('Ben', 'Berg', locations: [$harbour]);
        $this->person('Ada', 'Chef');
        $draft = $this->person('Dora', 'Draft', publish: false);

        self::assertSame(['Ben Berg', 'Ada Chef', 'Dora Draft', 'Zoe Abel'], array_map(static fn(PersonSummary $person): string => $person->name, $this->runner()->ask(new ListPeople())), 'By order, then by family name; drafts too.');
        self::assertSame(['Ben Berg', 'Ada Chef', 'Zoe Abel'], array_column($this->runner()->ask(new PersonChoices()), 'label'), 'Only published people can be chosen.');
        self::assertSame([['value' => $harbour, 'label' => 'Café am Hafen']], $this->runner()->ask(new LocationChoices()));
        self::assertNotContains($draft, array_column($this->runner()->ask(new PersonChoices()), 'value'));

        $this->runner()->run(new DeleteLocation($harbour));
        self::assertSame([], $this->runner()->ask(new LocationChoices()));
        $this->expectException(EntityNotFoundException::class);
        $this->runner()->ask(new ShowLocation($harbour));
    }
}
