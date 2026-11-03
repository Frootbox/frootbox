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
use Frootbox\Core\Plugin\SpaceScopes;

/**
 * @implements Action<FieldSummary>
 */
#[AsAction('frootbox/collections/field.update', 'Changes the label, the options of a choice or unit and decimals of a number of a field of a collection; name and kind stay')]
final readonly class UpdateField implements Action, Scoped
{
    /**
     * @param array<mixed>|null $labels
     * @param array<mixed>|null $options
     */
    public function __construct(
        #[Length(1, 64)]
        #[Description('The collection, e.g. "default"')]
        public string $space,
        #[Pattern(FieldEditor::NAME_PATTERN)]
        #[Description('The name of the field, see frootbox/collections/field.list')]
        public string $name,
        #[Description('Labels by language, e.g. {"en": "Altitude"}; left out stay, empty removes one')]
        public ?array $labels = null,
        #[Description('For a choice: the options by language. The lines of the default language make the options: the same text keeps its value in the entries, with as many lines as before a changed line is renamed; the other languages give the texts by position')]
        public ?array $options = null,
        #[Length(0, 20)]
        public ?string $unit = null,
        #[Range(min: 0, max: 6)]
        public ?int $decimals = null,
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
        $field = $editor->update('frootbox/collections/field.update', $this->space, $this->name, $this->labels, $this->options, $this->unit, $this->decimals);

        return FieldSummary::of($field, $editor->used($this->space)[$field->name] ?? 0);
    }
}
