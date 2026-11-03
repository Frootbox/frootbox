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
#[AsAction('frootbox/collections/field.move', 'Moves a field of a collection to another place in the form and the fact sheet')]
final readonly class MoveField implements Action, Scoped
{
    public function __construct(
        #[Length(1, 64)]
        public string $space,
        #[Pattern(FieldEditor::NAME_PATTERN)]
        public string $name,
        #[Range(min: 0)]
        #[Description('The new place, from 0')]
        public int $position,
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
        $field = $editor->move('frootbox/collections/field.move', $this->space, $this->name, $this->position);

        return FieldSummary::of($field, $editor->used($this->space)[$field->name] ?? 0);
    }
}
