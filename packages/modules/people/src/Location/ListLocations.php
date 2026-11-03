<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Language\Languages;

/**
 * @implements Query<list<LocationSummary>>
 */
#[AsQuery('frootbox/people/location.list', 'Lists the locations by name, with drafts and published ones')]
final readonly class ListLocations implements Query
{
    public function __construct(
        #[Description('Language of the names; left out for the first language of the website')]
        public ?string $language = null,
    ) {}

    /**
     * @return list<LocationSummary>
     */
    public function handle(LocationStore $store, Languages $languages): array
    {
        $language = null !== $this->language && $languages->has($this->language) ? $this->language : $languages->default()->code;
        $items = [];

        foreach ($store->ids() as $id) {
            $details = $store->details($id);
            $data = $details->current();
            $items[] = new LocationSummary($id, $details->status, $data->text($language)->name, $data->city, array_keys($data->translations));
        }

        usort($items, static fn(LocationSummary $a, LocationSummary $b): int => [mb_strtolower($a->name), $a->id] <=> [mb_strtolower($b->name), $b->id]);

        return $items;
    }
}
