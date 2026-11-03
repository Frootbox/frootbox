<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Plugin\PluginSpaces;

/**
 * @implements Query<list<array{value: string, label: string}>>
 */
#[AsQuery('frootbox/collections/space.choices', 'The collections as choices for a block, "All" first; empty with only one space', permission: 'frootbox/collections/entry.list')]
final readonly class SpaceChoices implements Query
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public function handle(PluginSpaces $spaces): array
    {
        return $spaces->choices(EntryStore::TYPE);
    }
}
