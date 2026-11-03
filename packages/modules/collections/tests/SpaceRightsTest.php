<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Tests;

use Frootbox\Collections\Entry\CreateEntry;
use Frootbox\Collections\Entry\DeleteEntry;
use Frootbox\Collections\Entry\DiscardEntry;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\EntrySummary;
use Frootbox\Collections\Entry\ListEntries;
use Frootbox\Collections\Entry\PublishEntries;
use Frootbox\Collections\Entry\ScheduleEntry;
use Frootbox\Collections\Entry\ShowEntry;
use Frootbox\Collections\Entry\UnpublishEntry;
use Frootbox\Collections\Entry\UpdateEntry;
use Frootbox\Collections\EntryPlugin;
use Frootbox\Collections\EntrySource;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\Channel;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Undo\UndoAction;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Core\Search\Search;
use Frootbox\Core\User\AssignRole;
use Frootbox\Core\User\CreateUser;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * An editor with a role only within one collection (decision 0245).
 */
#[CoversClass(EntryPlugin::class)]
#[CoversClass(CreateEntry::class)]
#[CoversClass(UpdateEntry::class)]
#[CoversClass(PublishEntries::class)]
#[CoversClass(ListEntries::class)]
#[CoversClass(EntrySource::class)]
final class SpaceRightsTest extends CollectionsTestCase
{
    private string $projects;

    private string $house;

    private string $bridge;

    private Context $editor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->projects = $this->runner()->run(new CreateSpace(EntryStore::TYPE, 'Projekte'))->id;
        $this->house = $this->entry(['de' => ['title' => 'Haus am See', 'teaser' => 'Ein Steg zum Hafen.']]);
        $this->bridge = $this->entry(['de' => ['title' => 'Brücke', 'teaser' => 'Eine Brücke über den Hafen.']], space: $this->projects);

        $user = $this->runner()->run(new CreateUser('jane@example.org', 'Jane', 'kaffeebohne42'))->user;
        $this->runner()->run(new AssignRole($user->id, 'editor', 'space:' . SpaceScopes::id(EntryStore::TYPE, $this->projects)));
        $this->editor = new Context(Actor::user($user->id, $user->name), Channel::Api);
    }

    public function testWorksOnlyOnTheEntriesOfTheCollection(): void
    {
        $new = $this->allowed(new CreateEntry(['de' => ['title' => 'Steg']], space: $this->projects))->id;
        $this->denied(new CreateEntry(['de' => ['title' => 'Halle']]), 'Not in the default space.');

        $this->allowed(new UpdateEntry($this->bridge, ['de' => ['teaser' => 'Aus Stahl.']]));
        $this->denied(new UpdateEntry($this->house, ['de' => ['teaser' => 'Neu.']]));

        $this->allowed(new PublishEntries([$this->bridge, $new]));
        $this->denied(new PublishEntries([$this->bridge, $this->house]), 'Every entry counts.');
        $this->allowed(new ScheduleEntry($this->bridge));
        $this->allowed(new UnpublishEntry($this->bridge));
        $this->denied(new UnpublishEntry($this->house));
        $this->allowed(new UpdateEntry($new, ['de' => ['teaser' => 'Bald.']]));
        $this->allowed(new DiscardEntry($new));
        $this->denied(new DeleteEntry($this->house));

        self::assertSame($this->bridge, $this->runner()->ask(new ShowEntry($this->bridge), $this->editor)->id);
        $this->deniedQuery(new ShowEntry($this->house));

        // What the editor did, the editor may undo.
        $this->runner()->run(new UpdateEntry($this->bridge, ['de' => ['teaser' => 'Rückgängig.']]), $this->editor);
        $this->allowed(new UndoAction($this->lastEntry()->id));
    }

    public function testMovesOnlyBetweenCollectionsWithTheRole(): void
    {
        $this->denied(new UpdateEntry($this->bridge, space: Space::DEFAULT), 'The target needs the role too.');
        $this->denied(new UpdateEntry($this->house, space: $this->projects), 'So does the source.');

        $archive = $this->runner()->run(new CreateSpace(EntryStore::TYPE, 'Archiv'))->id;
        $this->runner()->run(new AssignRole($this->editor->actor->id ?? 0, 'editor', 'space:' . SpaceScopes::id(EntryStore::TYPE, $archive)));
        $this->allowed(new UpdateEntry($this->bridge, space: $archive));
        self::assertSame($archive, $this->get(EntryPlugin::class)->space($this->bridge), 'The draft decides.');
    }

    public function testListsAndFindsOnlyTheEntriesOfTheCollection(): void
    {
        self::assertSame(['Brücke'], self::titles($this->runner()->ask(new ListEntries(), $this->editor)->items));
        self::assertSame([], self::titles($this->runner()->ask(new ListEntries(space: Space::DEFAULT), $this->editor)->items));
        self::assertSame(['Brücke', 'Haus am See'], self::titles($this->runner()->ask(new ListEntries())->items), 'A role everywhere sees all.');

        $found = array_map(static fn($hit): string => $hit->item, $this->runner()->ask(new Search('hafen'), $this->editor));
        self::assertSame([$this->bridge], array_values(array_unique($found)));
        self::assertCount(2, array_unique(array_map(static fn($hit): string => $hit->item, $this->runner()->ask(new Search('hafen')))));
    }

    /**
     * @param list<EntrySummary> $items
     *
     * @return list<string>
     */
    private static function titles(array $items): array
    {
        return array_map(static fn(EntrySummary $entry): string => $entry->title, $items);
    }

    /**
     * @template T
     *
     * @param Action<T> $action
     *
     * @return T
     */
    private function allowed(Action $action): mixed
    {
        return $this->runner()->run($action, $this->editor);
    }

    /**
     * @param Action<mixed> $action
     */
    private function denied(Action $action, string $message = ''): void
    {
        try {
            $this->runner()->run($action, $this->editor);
            self::fail(\sprintf('%s was allowed. %s', $action::class, $message));
        } catch (AccessDeniedException) {
            self::assertSame('denied', $this->lastEntry()->status->value, $message);
        }
    }

    /**
     * @param Query<mixed> $query
     */
    private function deniedQuery(Query $query): void
    {
        try {
            $this->runner()->ask($query, $this->editor);
            self::fail(\sprintf('%s was allowed.', $query::class));
        } catch (AccessDeniedException) {
            $this->addToAssertionCount(1);
        }
    }
}
