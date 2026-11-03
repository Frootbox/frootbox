<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Tests;

use DateTimeImmutable;
use Frootbox\Collections\CategoryChoices;
use Frootbox\Collections\Entry\CreateEntry;
use Frootbox\Collections\Entry\DeleteEntry;
use Frootbox\Collections\Entry\DiscardEntry;
use Frootbox\Collections\Entry\EntryData;
use Frootbox\Collections\Entry\EntryEditor;
use Frootbox\Collections\Entry\EntryStatus;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\EntrySummary;
use Frootbox\Collections\Entry\ListEntries;
use Frootbox\Collections\Entry\PublishedEntry;
use Frootbox\Collections\Entry\PublishEntries;
use Frootbox\Collections\Entry\ScheduleEntry;
use Frootbox\Collections\Entry\ShowEntry;
use Frootbox\Collections\Entry\UnpublishEntry;
use Frootbox\Collections\Entry\UpdateEntry;
use Frootbox\Collections\EntryPlugin;
use Frootbox\Collections\EntrySource;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Category\CreateCategory;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\ObjectField\ObjectFields;
use Frootbox\Core\ObjectField\ObjectFieldSet;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Plugin\ListAllSpaces;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScope;
use Frootbox\Core\Plugin\UpdateSpace;
use Frootbox\Core\Schedule\Scheduler;
use Frootbox\Core\Search\Search;
use Frootbox\Core\Url\Urls;
use Frootbox\Core\User\Roles;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(EntryEditor::class)]
#[CoversClass(EntryStore::class)]
#[CoversClass(EntryData::class)]
#[CoversClass(CreateEntry::class)]
#[CoversClass(UpdateEntry::class)]
#[CoversClass(ListEntries::class)]
#[CoversClass(EntrySource::class)]
#[CoversClass(EntryPlugin::class)]
#[CoversClass(CategoryChoices::class)]
final class EntriesTest extends CollectionsTestCase
{
    public function testCreatesADraftAndPublishesIt(): void
    {
        $details = $this->runner()->run(new CreateEntry(
            ['de' => ['title' => 'Haus am See', 'teaser' => 'Ein Holzhaus am Plöner See.', 'text' => self::text('Gebaut 2025.')]],
            ['media' => '01JQMEDXA00000000000000001', 'alt' => 'Das Haus'],
            order: 3,
        ));

        self::assertSame(EntryStatus::Draft, $details->status);
        $data = $details->current();
        self::assertSame('haus-am-see', $data->translations['de']->slug);
        self::assertSame([3, Space::DEFAULT, '01JQMEDXA00000000000000001'], [$data->order, $data->space, $data->media()]);

        $this->runner()->run(new PublishEntries([$details->id]));

        $shown = $this->runner()->ask(new ShowEntry($details->id));
        self::assertSame(EntryStatus::Published, $shown->status);
        self::assertSame([], $shown->urls, 'Without a page with the collection there is no address yet.');
    }

    public function testKeepsTheFurtherFieldsOfTheTheme(): void
    {
        $this->get(Registry::class)->add(ObjectFieldSet::class, new ObjectFieldSet(EntryStore::TYPE, ['client' => ['type' => 'text']]));
        $id = $this->runner()->run(new CreateEntry(['de' => ['title' => 'Haus am See']], fields: ['client' => ['de' => 'Familie Berg']]))->id;
        $this->runner()->run(new UpdateEntry($id, ['de' => ['teaser' => 'Am Wasser.']]));
        self::assertSame(['client' => ['de' => 'Familie Berg']], $this->runner()->ask(new ShowEntry($id))->draft?->fields, 'Left out, they stay.');

        $this->runner()->run(new PublishEntries([$id]));
        self::assertSame([$id => ['client' => ['de' => 'Familie Berg']]], $this->get(ObjectFields::class)->of(EntryStore::TYPE, [$id]));
        $this->runner()->run(new UnpublishEntry($id));
        self::assertSame([$id => []], $this->get(ObjectFields::class)->of(EntryStore::TYPE, [$id]));
    }

    public function testChecksWhatItTakesIn(): void
    {
        self::assertSame(['/space'], $this->errors(fn() => $this->runner()->run(new CreateEntry(['de' => ['title' => 'A']], space: '01JNOSPACE0000000000000000'))));
        self::assertSame(['/image'], $this->errors(fn() => $this->runner()->run(new CreateEntry(['de' => ['title' => 'A']], ['alt' => 'Ohne Bild']))));
        self::assertSame(['/order'], $this->errors(fn() => $this->runner()->run(new CreateEntry(['de' => ['title' => 'A']], order: 20000))));
        self::assertSame(['/translations/fr'], $this->errors(fn() => $this->runner()->run(new CreateEntry(['fr' => ['title' => 'Maison']]))));
    }

    public function testDraftsMayBeUnfinishedButPublishingChecksThem(): void
    {
        $id = $this->runner()->run(new CreateEntry(['de' => ['title' => '', 'slug' => '']]))->id;

        self::assertSame(['/ids/0/translations/de/title', '/ids/0/translations/de/slug'], $this->errors(fn() => $this->runner()->run(new PublishEntries([$id]))));
    }

    public function testSlugsAreUniqueInALanguage(): void
    {
        $this->entry(['de' => ['title' => 'Haus am See']]);
        $second = $this->entry(['de' => ['title' => 'Haus am See', 'slug' => 'haus-am-see-2']]);

        self::assertSame(['/translations/de/slug'], $this->errors(fn() => $this->runner()->run(new UpdateEntry($second, ['de' => ['slug' => 'haus-am-see']]))));
    }

    public function testUpdatesOnlyWhatIsGiven(): void
    {
        $id = $this->entry(['de' => ['title' => 'Haus am See', 'teaser' => 'Am Wasser.']], order: 2);
        $this->runner()->run(new UpdateEntry($id, image: ['media' => '01JQMEDXA00000000000000001']));

        $this->runner()->run(new UpdateEntry($id, order: 5));
        $data = $this->get(EntryStore::class)->current($id);
        self::assertSame([5, 'Am Wasser.', '01JQMEDXA00000000000000001'], [$data->order, $data->translations['de']->teaser, $data->media()]);

        $this->runner()->run(new UpdateEntry($id, image: []));
        self::assertNull($this->get(EntryStore::class)->current($id)->image, '{} removes the image.');
    }

    public function testOrdersByPositionAndElseTheNewestFirst(): void
    {
        $first = $this->entry(['de' => ['title' => 'Alt']]);
        $second = $this->entry(['de' => ['title' => 'Neu']]);
        $third = $this->entry(['de' => ['title' => 'Oben']], order: -1);
        $last = $this->entry(['de' => ['title' => 'Unten']], order: 1);

        self::assertSame([$third, $second, $first, $last], array_map(static fn(PublishedEntry $entry): string => $entry->id, $this->get(EntryStore::class)->allPublished()));
    }

    public function testTakesOfflineDiscardsAndDeletes(): void
    {
        $id = $this->entry(['de' => ['title' => 'Haus am See']]);

        $offline = $this->runner()->run(new UnpublishEntry($id));
        self::assertSame(EntryStatus::Draft, $offline->status);
        self::assertNull($this->get(EntryStore::class)->find($id));

        $this->runner()->run(new PublishEntries([$id]));
        $this->runner()->run(new UpdateEntry($id, ['de' => ['title' => 'Haus am Plöner See']]));
        $kept = $this->runner()->run(new DiscardEntry($id));
        self::assertSame('Haus am See', $kept?->current()->translations['de']->title);

        $this->runner()->run(new DeleteEntry($id));
        self::assertSame([], $this->get(EntryStore::class)->ids());
    }

    public function testListsEntriesByPositionAndTitle(): void
    {
        $this->entry(['de' => ['title' => 'Werkhalle']]);
        $this->entry(['de' => ['title' => 'Haus am See']], publish: false);
        $this->entry(['de' => ['title' => 'Zentrale']], order: -1);

        $list = $this->runner()->ask(new ListEntries());

        self::assertSame(['Zentrale', 'Haus am See', 'Werkhalle'], self::titles($list->items));
        self::assertSame([EntryStatus::Published, EntryStatus::Draft, EntryStatus::Published], array_map(static fn(EntrySummary $entry): EntryStatus => $entry->status, $list->items));
        self::assertSame(['Werkhalle'], self::titles($this->runner()->ask(new ListEntries(search: 'werk'))->items));
    }

    public function testTheSchedulerTakesAnEntryOffline(): void
    {
        $id = $this->entry(['de' => ['title' => 'Haus am See']]);
        $this->runner()->run(new ScheduleEntry($id, unpublishAt: new DateTimeImmutable('+1 hour')));
        self::assertNotNull($this->get(EntryStore::class)->find($id)?->until);

        $this->get(Scheduler::class)->run(new DateTimeImmutable('+2 hours'));

        self::assertNull($this->get(EntryStore::class)->find($id));
    }

    public function testTheFirstCollectionGetsItsName(): void
    {
        self::assertSame(['Sammlungen'], self::spaces($this->runner()->ask(new ListAllSpaces())));

        $this->runner()->run(new UpdateSpace(Space::DEFAULT, 'Referenzen', EntryStore::TYPE));

        self::assertSame(['Sammlungen · Referenzen'], self::spaces($this->runner()->ask(new ListAllSpaces())));
    }

    public function testOffersTheCategoriesForTheTeaser(): void
    {
        self::assertSame([], $this->runner()->ask(new CategoryChoices()), 'Without categories no choice.');

        $living = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Wohnbau']]))->id;
        $houses = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Häuser']], $living))->id;

        self::assertSame(
            [['value' => '', 'label' => 'Alle'], ['value' => $living, 'label' => 'Wohnbau'], ['value' => $houses, 'label' => '– Häuser']],
            $this->runner()->ask(new CategoryChoices()),
        );
    }

    public function testEntriesAreFoundAndEditorsMayChangeThem(): void
    {
        $page = $this->collectionPage(null, 'Start');
        $this->runner()->run(new PublishPages([$page]));
        $id = $this->entry(['de' => ['title' => 'Haus am See', 'teaser' => 'Lärche und Glas.']]);

        $hits = $this->runner()->ask(new Search('lärche'));
        self::assertSame(['frootbox/collections/entry'], array_values(array_unique(array_map(static fn($hit): string => $hit->source, $hits))));
        self::assertSame($id, $hits[0]->item);
        self::assertSame('/haus-am-see', $this->get(Urls::class)->path(EntryStore::target($id), 'de'));

        $published = iterator_to_array($this->get(EntrySource::class)->published([$id]), false);
        self::assertSame(['Haus am See', 'de', EntryStore::target($id)], [$published[0]->title, $published[0]->language, (string) $published[0]->target]);

        $editor = $this->get(Roles::class)->fetchOne(['where' => ['name' => 'editor']]);
        self::assertContains('frootbox/collections/*', $editor->permissions ?? []);
    }

    /**
     * The pointers of the errors of an action, empty if it runs.
     *
     * @return list<string>
     */
    private function errors(callable $run): array
    {
        try {
            $run();
        } catch (InvalidInputException $error) {
            return array_map(strval(...), array_keys($error->errors));
        }

        return [];
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
     * @param list<SpaceScope> $spaces
     *
     * @return list<string>
     */
    private static function spaces(array $spaces): array
    {
        return array_map(static fn(SpaceScope $space): string => $space->title, $spaces);
    }
}
