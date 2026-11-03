<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Tests;

use Frootbox\Collections\Entry\PublishEntries;
use Frootbox\Collections\Entry\UpdateEntry;
use Frootbox\Collections\Field\CollectionField;
use Frootbox\Collections\Field\CreateField;
use Frootbox\Collections\Field\DeleteField;
use Frootbox\Collections\Field\FieldEditor;
use Frootbox\Collections\Field\FieldKind;
use Frootbox\Collections\Field\FieldSource;
use Frootbox\Collections\Field\FieldSummary;
use Frootbox\Collections\Field\ListFields;
use Frootbox\Collections\Field\MoveField;
use Frootbox\Collections\Field\UpdateField;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\ObjectField\ShowObjectFields;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Plugin\Space;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(FieldEditor::class)]
#[CoversClass(FieldSource::class)]
#[CoversClass(CollectionField::class)]
#[CoversClass(CreateField::class)]
#[CoversClass(UpdateField::class)]
#[CoversClass(MoveField::class)]
#[CoversClass(DeleteField::class)]
#[CoversClass(ListFields::class)]
final class FieldsTest extends CollectionsTestCase
{
    public function testAdminsAddFieldsTheEntriesFillIn(): void
    {
        $area = $this->field(FieldKind::Number, ['de' => 'Wohnfläche', 'en' => 'Living space'], unit: 'm²', decimals: 1);
        self::assertSame(['wohnflaeche', FieldKind::Number, 'm²', 1, 0], [$area->name, $area->kind, $area->unit, $area->decimals, $area->position]);
        $this->field(FieldKind::Date, ['de' => 'Fertig']);
        $this->field(FieldKind::Choice, ['de' => 'Bauweise'], options: ['de' => ['Holz', 'Stein', 'Holz'], 'en' => ['Wood', 'Stone']]);
        $this->field(FieldKind::Boolean, ['de' => 'Ausgezeichnet']);
        $this->field(FieldKind::LongText, ['de' => 'Besonderheiten']);
        self::assertSame('wohnflaeche2', $this->field(FieldKind::Text, ['de' => 'Wohnfläche'])->name, 'A name stays unique.');

        $fields = $this->runner()->ask(new ListFields());
        self::assertSame(['wohnflaeche', 'fertig', 'bauweise', 'ausgezeichnet', 'besonderheiten', 'wohnflaeche2'], array_map(static fn(FieldSummary $field): string => $field->name, $fields));
        self::assertSame([['key' => 'holz', 'labels' => ['de' => 'Holz', 'en' => 'Wood']], ['key' => 'stein', 'labels' => ['de' => 'Stein', 'en' => 'Stone']]], $fields[2]->options, 'The same line once.');

        $described = $this->runner()->ask(new ShowObjectFields('frootbox/collections/entry', Space::DEFAULT));
        self::assertSame(['wohnflaeche', 'number', ['de' => 'Wohnfläche', 'en' => 'Living space'], ['type' => 'number']], [$described[0]['name'], $described[0]['type'], $described[0]['labels'], $described[0]['value']]);
        self::assertTrue($described[4]['translatable'], 'A text per language.');
        self::assertSame([], $this->runner()->ask(new ShowObjectFields('frootbox/collections/entry')), 'Only with the collection.');

        $id = $this->entry(['de' => ['title' => 'Haus am See']], publish: false);
        $this->runner()->run(new UpdateEntry($id, fields: ['wohnflaeche' => 142.5, 'fertig' => '2025-09-30', 'bauweise' => 'holz', 'ausgezeichnet' => true, 'besonderheiten' => ['de' => "Lärche\nGlas"]]));
        self::assertSame(['wohnflaeche' => 1, 'fertig' => 1, 'bauweise' => 1, 'ausgezeichnet' => 1, 'besonderheiten' => 1], $this->get(FieldEditor::class)->used(Space::DEFAULT));
        self::assertSame(1, $this->runner()->ask(new ListFields())[0]->used);

        self::assertSame(['/fields/wohnflaeche'], $this->errors(fn() => $this->runner()->run(new UpdateEntry($id, fields: ['wohnflaeche' => 1.25]))), 'One decimal place.');
        self::assertSame(['/fields/bauweise'], $this->errors(fn() => $this->runner()->run(new UpdateEntry($id, fields: ['bauweise' => 'beton']))));
        self::assertSame(['/fields/fertig'], $this->errors(fn() => $this->runner()->run(new UpdateEntry($id, fields: ['fertig' => '30.09.2025']))));
    }

    public function testThePageOfAnEntryShowsTheFactSheet(): void
    {
        $start = $this->page(null, 'Start');
        $references = $this->collectionPage($start, 'Referenzen');
        $this->runner()->run(new PublishPages([$start, $references]));
        $this->field(FieldKind::Number, ['de' => 'Wohnfläche', 'en' => 'Living space'], unit: 'm²');
        $this->field(FieldKind::Choice, ['de' => 'Bauweise', 'en' => 'Construction'], options: ['de' => ['Holz'], 'en' => ['Wood']]);
        $this->field(FieldKind::Boolean, ['de' => 'Ausgezeichnet']);
        $this->field(FieldKind::Text, ['de' => 'Architekt']);
        $id = $this->entry(['de' => ['title' => 'Haus am See'], 'en' => ['title' => 'House by the lake']], publish: false);
        $this->runner()->run(new UpdateEntry($id, fields: ['wohnflaeche' => 1420, 'bauweise' => 'holz', 'ausgezeichnet' => false]));
        $this->runner()->run(new PublishEntries([$id]));

        $html = $this->html('/referenzen/haus-am-see');
        self::assertStringContainsString('<dl class="collection-facts">', $html);
        self::assertStringContainsString("<dt class=\"collection-facts__label\">Wohnfläche</dt><dd class=\"collection-facts__value\">1.420\u{00A0}m²</dd>", $html);
        self::assertStringContainsString('<dt class="collection-facts__label">Bauweise</dt><dd class="collection-facts__value">Holz</dd>', $html);
        self::assertStringContainsString('<dt class="collection-facts__label">Ausgezeichnet</dt><dd class="collection-facts__value">Nein</dd>', $html, 'A switch that was set.');
        self::assertStringNotContainsString('Architekt', $html, 'Empty fields are left out.');

        // The page has no English version, so the entry and its facts stay German (decision 0170).
        $english = $this->html('/en/referenzen/house-by-the-lake');
        self::assertStringContainsString("<dt class=\"collection-facts__label\">Wohnfläche</dt><dd class=\"collection-facts__value\">1.420\u{00A0}m²</dd>", $english);
        self::assertStringContainsString('<dd class="collection-facts__value">Nein</dd>', $english, 'Yes and no in the language of the content.');

        $this->entry(['de' => ['title' => 'Brücke']]);
        self::assertStringNotContainsString('collection-facts', $this->html('/referenzen/bruecke'), 'Without values no fact sheet.');
    }

    public function testOptionsKeepTheirValues(): void
    {
        $this->field(FieldKind::Choice, ['de' => 'Bauweise'], options: ['de' => ['Holz', 'Stein']]);
        $options = fn(): array => $this->runner()->ask(new ListFields())[0]->options;

        $this->runner()->run(new UpdateField(Space::DEFAULT, 'bauweise', options: ['de' => ['Holzbau', 'Stein']]));
        self::assertSame(['holz', 'stein'], array_column($options(), 'key'), 'With as many lines a changed line is the option renamed.');
        self::assertSame('Holzbau', $options()[0]['labels']['de']);

        $this->runner()->run(new UpdateField(Space::DEFAULT, 'bauweise', options: ['de' => ['Beton', 'Stein', 'Holzbau']]));
        self::assertSame(['beton', 'stein', 'holz'], array_column($options(), 'key'), 'The same text keeps its key.');

        $this->runner()->run(new UpdateField(Space::DEFAULT, 'bauweise', options: ['en' => ['Concrete', 'Stone']]));
        self::assertSame([['de' => 'Beton', 'en' => 'Concrete'], ['de' => 'Stein', 'en' => 'Stone'], ['de' => 'Holzbau']], array_column($options(), 'labels'), 'Other languages by position.');

        self::assertSame(['/options/en'], $this->errors(fn() => $this->runner()->run(new UpdateField(Space::DEFAULT, 'bauweise', options: ['en' => ['A', 'B', 'C', 'D']]))));
        self::assertSame(['/options/de'], $this->errors(fn() => $this->runner()->run(new UpdateField(Space::DEFAULT, 'bauweise', options: ['de' => []]))));
        self::assertSame(['/options'], $this->errors(fn() => $this->runner()->run(new CreateField(FieldKind::Choice, ['de' => 'Dach']))));
    }

    public function testFieldsMoveAndGoWithoutLosingValues(): void
    {
        $this->field(FieldKind::Text, ['de' => 'Architekt']);
        $this->field(FieldKind::Number, ['de' => 'Jahr']);
        $this->field(FieldKind::Text, ['de' => 'Ort']);
        $this->runner()->run(new MoveField(Space::DEFAULT, 'ort', 0));
        $names = fn(): array => array_map(static fn(FieldSummary $field): string => $field->name, $this->runner()->ask(new ListFields()));
        self::assertSame(['ort', 'architekt', 'jahr'], $names());

        $id = $this->entry(['de' => ['title' => 'Haus am See']], publish: false);
        $this->runner()->run(new UpdateEntry($id, fields: ['jahr' => 2025]));
        $this->runner()->run(new DeleteField(Space::DEFAULT, 'jahr'));
        self::assertSame(['ort', 'architekt'], $names());
        self::assertSame(['/fields/jahr'], $this->errors(fn() => $this->runner()->run(new UpdateEntry($id, fields: ['jahr' => 2026]))), 'Gone from the form.');
        self::assertSame(['jahr' => 1], $this->get(FieldEditor::class)->used(Space::DEFAULT), 'The value stays.');

        $this->field(FieldKind::Number, ['de' => 'Jahr']);
        self::assertSame(1, $this->runner()->ask(new ListFields())[2]->used, 'And comes back.');

        $this->runner()->run(new UpdateField(Space::DEFAULT, 'jahr', labels: ['de' => 'Baujahr', 'en' => 'Year built'], unit: ''));
        self::assertSame(['de' => 'Baujahr', 'en' => 'Year built'], $this->runner()->ask(new ListFields())[2]->labels);
        self::assertSame(['/labels/de'], $this->errors(fn() => $this->runner()->run(new UpdateField(Space::DEFAULT, 'jahr', labels: ['de' => '']))));
    }

    public function testEachCollectionHasItsOwnFields(): void
    {
        $projects = $this->runner()->run(new CreateSpace('frootbox/collections/entry', 'Projekte'))->id;
        $this->field(FieldKind::Number, ['de' => 'Fläche']);
        $this->field(FieldKind::Text, ['de' => 'Bauherr'], $projects);
        self::assertSame(['bauherr'], array_map(static fn(FieldSummary $field): string => $field->name, $this->runner()->ask(new ListFields($projects))));

        $id = $this->entry(['de' => ['title' => 'Brücke']], publish: false, space: $projects);
        self::assertSame(['/fields/flaeche'], $this->errors(fn() => $this->runner()->run(new UpdateEntry($id, fields: ['flaeche' => 3]))));
        $this->runner()->run(new UpdateEntry($id, fields: ['flaeche' => 3], space: Space::DEFAULT));
        self::assertSame(['flaeche' => 1], $this->get(FieldEditor::class)->used(Space::DEFAULT), 'Moved with the fields of the new collection.');
        self::assertSame(['/space'], $this->errors(fn() => $this->runner()->run(new CreateField(FieldKind::Text, ['de' => 'X'], 'nowhere'))));
    }

    /**
     * @param array<string, string>       $labels
     * @param array<string, list<string>> $options
     */
    private function field(FieldKind $kind, array $labels, string $space = Space::DEFAULT, ?array $options = null, ?string $unit = null, ?int $decimals = null): FieldSummary
    {
        return $this->runner()->run(new CreateField($kind, $labels, $space, $options, $unit, $decimals));
    }

    /**
     * @return list<string>
     */
    private function errors(callable $run): array
    {
        try {
            $run();

            return [];
        } catch (InvalidInputException $exception) {
            return array_map(strval(...), array_keys($exception->errors));
        }
    }
}
