<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;

/**
 * @implements Query<list<array{value: string, label: string}>>
 */
#[AsQuery('frootbox/people/person.choices', 'The published people as choices for the block "Contact person"', permission: 'frootbox/people/person.list')]
final readonly class PersonChoices implements Query
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public function handle(PersonStore $store): array
    {
        $people = $store->allPublished();
        uasort($people, static fn(PersonData $a, PersonData $b): int => $a->sortKey() <=> $b->sortKey());

        return array_map(static fn(string $id, PersonData $person): array => ['value' => $id, 'label' => '' === $person->name() ? $id : $person->name()], array_keys($people), $people);
    }
}
