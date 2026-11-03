<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;

/**
 * @implements Action<FieldSummary>
 */
#[AsAction('frootbox/collections/field.create', 'Adds a field to a collection, e.g. "Altitude" as a number in m; its entries take a value under "fields" and the default view shows it in the fact sheet')]
final readonly class CreateField implements Action, Scoped
{
    /**
     * @param array<mixed>      $labels
     * @param array<mixed>|null $options
     */
    public function __construct(
        public FieldKind $kind,
        #[Description('The label by language, the default language required: {"de": "Höhe", "en": "Altitude"}')]
        public array $labels,
        #[Length(1, 64)]
        #[Description('The collection: "default" for the first one; see space.list with type "frootbox/collections/entry"')]
        public string $space = Space::DEFAULT,
        #[Description('For a choice: the options by language, one text each, the default language required: {"de": ["Hell", "Dunkel"], "en": ["Light", "Dark"]}')]
        public ?array $options = null,
        #[Length(0, 20)]
        #[Description('For a number: the unit, e.g. "m" or "m²"')]
        public ?string $unit = null,
        #[Range(min: 0, max: 6)]
        #[Description('For a number: the decimal places, 0 for whole numbers')]
        public ?int $decimals = null,
        #[Pattern(FieldEditor::NAME_PATTERN)]
        #[Description('The name of the value in the entries, e.g. "altitude"; left out it comes from the label and stays')]
        public ?string $name = null,
    ) {}

    /**
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [SpaceScopes::space(EntryStore::TYPE, $this->space)];
    }

    public function handle(FieldEditor $editor): FieldSummary
    {
        return FieldSummary::of($editor->create('frootbox/collections/field.create', $this->space, $this->kind, $this->labels, $this->options, $this->unit, $this->decimals, $this->name), 0);
    }
}
