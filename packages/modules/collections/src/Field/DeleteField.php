<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;

/**
 * @implements Action<null>
 */
#[AsAction('frootbox/collections/field.delete', 'Removes a field from a collection; the values in the entries stay and come back with a new field of the same name')]
final readonly class DeleteField implements Action, Scoped
{
    public function __construct(
        #[Length(1, 64)]
        public string $space,
        #[Pattern(FieldEditor::NAME_PATTERN)]
        public string $name,
    ) {}

    /**
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [SpaceScopes::space(EntryStore::TYPE, $this->space)];
    }

    public function handle(FieldEditor $editor): null
    {
        $editor->delete('frootbox/collections/field.delete', $this->space, $this->name);

        return null;
    }
}
