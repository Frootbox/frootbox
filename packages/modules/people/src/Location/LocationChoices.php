<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Language\Languages;

/**
 * @implements Query<list<array{value: string, label: string}>>
 */
#[AsQuery('frootbox/people/location.choices', 'The published locations as choices for the blocks', permission: 'frootbox/people/location.list')]
final readonly class LocationChoices implements Query
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public function handle(LocationStore $store, Languages $languages): array
    {
        $language = $languages->default()->code;
        $choices = [];

        foreach ($store->allPublished() as $id => $location) {
            $name = $location->text($language)->name;
            $choices[] = ['value' => $id, 'label' => '' === $name ? $id : $name];
        }

        usort($choices, static fn(array $a, array $b): int => mb_strtolower($a['label']) <=> mb_strtolower($b['label']));

        return $choices;
    }
}
