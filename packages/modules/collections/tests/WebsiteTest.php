<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Tests;

use Frootbox\Collections\Blocks\EntryList;
use Frootbox\Collections\Blocks\EntryTeaser;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\PublishEntries;
use Frootbox\Collections\Entry\UnpublishEntry;
use Frootbox\Collections\Entry\UpdateEntry;
use Frootbox\Collections\EntryPlugin;
use Frootbox\Collections\Website\EntryRendering;
use Frootbox\Core\Category\CreateCategory;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Plugin\AssignPlugin;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Forms\Form\AddField;
use Frootbox\Forms\Form\CreateForm;
use Frootbox\Forms\Form\FieldType;
use Frootbox\Forms\Form\PublishForm;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(EntryList::class)]
#[CoversClass(EntryTeaser::class)]
#[CoversClass(EntryPlugin::class)]
#[CoversClass(EntryRendering::class)]
final class WebsiteTest extends CollectionsTestCase
{
    private string $start;

    private string $references;

    protected function setUp(): void
    {
        parent::setUp();

        $this->start = $this->page(null, 'Start', [['block' => 'frootbox/collections/EntryTeaser', 'options' => ['count' => 2]]]);
        $this->references = $this->collectionPage($this->start, 'Referenzen');
        $this->runner()->run(new PublishPages([$this->start, $this->references]));
    }

    public function testListsTheEntriesByPositionAndElseTheNewestFirst(): void
    {
        $this->entry(['de' => ['title' => 'Werkhalle', 'teaser' => 'Stahl und Holz.']]);
        $this->entry(['de' => ['title' => 'Haus am See']]);
        $this->entry(['de' => ['title' => 'Zentrale']], order: 1);
        $this->entry(['en' => ['title' => 'Only English']]);

        $html = $this->html('/referenzen');

        self::assertMatchesRegularExpression('~Haus am See.*Werkhalle.*Zentrale~s', $html, 'The newest first, a higher position after.');
        self::assertStringContainsString('<a href="/referenzen/werkhalle">Werkhalle</a>', $html);
        self::assertStringContainsString('<p class="collection-card__text">Stahl und Holz.</p>', $html);
        self::assertStringNotContainsString('Only English', $html, 'Only entries in the language of the page.');
        self::assertStringNotContainsString('collection-filter', $html, 'Without categories or tags no filter.');
    }

    public function testFiltersByCategoryAndTagWithoutAScript(): void
    {
        $living = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Wohnbau']]))->id;
        $houses = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Häuser']], $living))->id;
        $business = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Gewerbe']]))->id;
        $this->entry(['de' => ['title' => 'Haus am See']], categories: [$houses], tags: ['Holzbau']);
        $this->entry(['de' => ['title' => 'Werkhalle']], categories: [$business], tags: ['Holzbau']);
        $this->entry(['de' => ['title' => 'Zentrale']], categories: [$business], tags: ['Glas']);

        $html = $this->html('/referenzen');
        self::assertStringContainsString('<nav class="collection-filter" aria-label="Kategorie">', $html);
        self::assertStringContainsString('<a class="collection-filter__link" href="/referenzen" aria-current="page">Alle</a>', $html);
        self::assertStringContainsString('<a class="collection-filter__link" href="/referenzen?category=haeuser">Häuser</a>', $html);
        self::assertStringContainsString('<a class="collection-filter__link" href="/referenzen?tag=holzbau">Holzbau</a>', $html);

        $html = $this->html('/referenzen?category=wohnbau');
        self::assertStringContainsString('Haus am See', $html, 'With the categories below.');
        self::assertStringNotContainsString('>Werkhalle<', $html);

        $html = $this->html('/referenzen?category=gewerbe&tag=holzbau');
        self::assertStringContainsString('>Werkhalle<', $html);
        self::assertStringNotContainsString('>Zentrale<', $html);
        self::assertStringContainsString('<a class="collection-filter__link" href="/referenzen?category=gewerbe&amp;tag=glas">Glas</a>', $html, 'The other filter keeps the category.');

        self::assertStringContainsString('Zentrale', $this->html('/referenzen?category=nothing'), 'An unknown filter shows all.');
        self::assertStringContainsString('Zu dieser Auswahl gibt es keine Einträge.', $this->html('/referenzen?category=haeuser&tag=glas'));
    }

    public function testCategoriesHavePagesOfTheirOwn(): void
    {
        $business = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Gewerbe', 'description' => 'Hallen und Büros.']]))->id;
        $living = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Wohnbau']]))->id;
        $this->entry(['de' => ['title' => 'Werkhalle']], categories: [$business]);
        $this->entry(['de' => ['title' => 'Haus am See']], categories: [$living]);
        $this->runner()->run(new AssignPlugin($this->references, EntryStore::TYPE, categories: true));
        $this->runner()->run(new PublishPages([$this->references]));

        $html = $this->html('/referenzen/gewerbe');
        self::assertStringContainsString('<h1 class="collection__title">Gewerbe</h1>', $html, 'The category owns the h1 (decision 0243).');
        self::assertStringContainsString('<p class="collection__intro">Hallen und Büros.</p>', $html);
        self::assertStringNotContainsString('Haus am See', $html);
        self::assertStringContainsString('<a class="collection-filter__link" href="/referenzen/wohnbau">Wohnbau</a>', $html);
    }

    public function testShowsAnEntryAtItsAddress(): void
    {
        $id = $this->entry(['de' => ['title' => 'Haus am See', 'teaser' => 'Ein Holzhaus am Plöner See.', 'text' => self::text('Gebaut 2025 aus Lärche.')]]);

        $html = $this->html('/referenzen/haus-am-see');

        self::assertStringContainsString('<title>Haus am See – Testsite</title>', $html);
        self::assertStringContainsString('<meta name="description" content="Ein Holzhaus am Plöner See.">', $html);
        self::assertStringContainsString('<h1 class="collection-entry__title">Haus am See</h1>', $html);
        self::assertStringContainsString('<p>Gebaut 2025 aus Lärche.</p>', $html);
        self::assertStringContainsString('<a href="/referenzen">Alle Einträge</a>', $html);
        self::assertStringNotContainsString('collection__items', $html, 'Not the list.');

        $this->runner()->run(new UnpublishEntry($id));
        self::assertSame(410, $this->statusOf('/referenzen/haus-am-see'));
    }

    public function testTheFormForRequestsKnowsTheEntry(): void
    {
        $form = $this->runner()->run(new CreateForm(['de' => ['title' => 'Anfrage']], ['team@example.org']))->id;
        $this->runner()->run(new AddField($form, FieldType::Text, ['de' => ['label' => 'Name']], true));
        $this->runner()->run(new PublishForm($form));
        $this->options($this->references, ['form' => $form]);
        $this->runner()->run(new PublishPages([$this->references]));
        $id = $this->entry(['de' => ['title' => 'Haus am See']]);

        $html = $this->html('/referenzen/haus-am-see');

        self::assertStringContainsString('<input type="hidden" name="_about" value="frootbox/collections/entry:' . $id . '">', $html);
        self::assertMatchesRegularExpression('~<h1 class="collection-entry__title">Haus am See</h1>.*<h2 class="forms__title">Anfrage</h2>~s', $html, 'The form sits one level below the entry.');
        self::assertStringNotContainsString('_about', $this->html('/referenzen'), 'The list shows no form.');
    }

    public function testTheTeaserShowsSomeEntries(): void
    {
        $this->entry(['de' => ['title' => 'Erste']]);
        $this->entry(['de' => ['title' => 'Zweite']]);
        $this->entry(['de' => ['title' => 'Dritte']]);

        $html = $this->html('/');

        self::assertMatchesRegularExpression('~Dritte.*Zweite~s', $html);
        self::assertStringNotContainsString('Erste', $html, 'Two of three.');
        self::assertStringContainsString('<a href="/referenzen">Alle Einträge</a>', $html);
    }

    public function testTheTeaserShowsOnlyACategoryWithTheOnesBelow(): void
    {
        $living = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Wohnbau']]))->id;
        $houses = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Häuser']], $living))->id;
        $business = $this->runner()->run(new CreateCategory(EntryStore::CATEGORIES, ['de' => ['title' => 'Gewerbe']]))->id;
        $this->entry(['de' => ['title' => 'Haus am See']], categories: [$houses]);
        $this->entry(['de' => ['title' => 'Werkhalle']], categories: [$business]);

        $teaser = $this->page($this->start, 'Wohnen', [['block' => 'frootbox/collections/EntryTeaser', 'options' => ['category' => $living]]]);
        $gone = $this->page($this->start, 'Leer', [['block' => 'frootbox/collections/EntryTeaser', 'options' => ['category' => '01JNOCATEGORY0000000000000']]]);
        $this->runner()->run(new PublishPages([$teaser, $gone]));

        $html = $this->html('/wohnen');
        self::assertStringContainsString('Haus am See', $html);
        self::assertStringNotContainsString('Werkhalle', $html);
        self::assertStringContainsString('Hier gibt es noch keine Einträge.', $this->html('/leer'), 'A category that is gone shows none.');
    }

    public function testACollectionHasItsEntriesBelowItsOwnPage(): void
    {
        $projects = $this->runner()->run(new CreateSpace(EntryStore::TYPE, 'Projekte'))->id;
        $page = $this->collectionPage($this->start, 'Projekte', space: $projects);
        $this->runner()->run(new PublishPages([$page]));
        $id = $this->entry(['de' => ['title' => 'Brücke']], space: $projects);
        $this->entry(['de' => ['title' => 'Haus am See']]);

        self::assertSame(200, $this->statusOf('/projekte/bruecke'));
        self::assertSame(404, $this->statusOf('/referenzen/bruecke'), 'Not below the page of another collection.');
        self::assertStringNotContainsString('Haus am See', $this->html('/projekte'), 'Only the entries of its collection.');

        $this->runner()->run(new UpdateEntry($id, space: 'default'));
        $this->runner()->run(new PublishEntries([$id]));
        $moved = $this->request('/projekte/bruecke');
        self::assertSame([301, '/referenzen/bruecke'], [$moved->getStatusCode(), $moved->getHeaderLine('Location')], 'Moved with publishing (decision 0244).');
    }
}
