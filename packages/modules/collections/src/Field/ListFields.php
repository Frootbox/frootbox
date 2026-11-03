<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;

/**
 * @implements Query<list<FieldSummary>>
 */
#[AsQuery('frootbox/collections/field.list', 'The fields an admin added to a collection, in their order, with labels, settings and how many entries have a value; object.fields with the space gives the JSON schema of the values', permission: 'frootbox/collections/entry.list')]
final readonly class ListFields implements Query, Scoped
{
    public function __construct(
        #[Length(1, 64)]
        #[Description('The collection, e.g. "default"')]
        public string $space = Space::DEFAULT,
    ) {}

    /**
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [SpaceScopes::space(EntryStore::TYPE, $this->space)];
    }

    /**
     * @return list<FieldSummary>
     */
    public function handle(CollectionFields $fields, FieldEditor $editor): array
    {
        $used = $editor->used($this->space);

        return array_map(static fn(CollectionField $field): FieldSummary => FieldSummary::of($field, $used[$field->name] ?? 0), $fields->ofSpace($this->space));
    }
}
