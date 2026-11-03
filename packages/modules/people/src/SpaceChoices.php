<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Plugin\PluginSpaces;
use Frootbox\People\Person\PersonStore;

/**
 * @implements Query<list<array{value: string, label: string}>>
 */
#[AsQuery('frootbox/people/space.choices', 'The spaces of the people as choices for a block, "All" first; empty with only one space', permission: 'frootbox/people/person.list')]
final readonly class SpaceChoices implements Query
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public function handle(PluginSpaces $spaces): array
    {
        return $spaces->choices(PersonStore::TYPE);
    }
}
