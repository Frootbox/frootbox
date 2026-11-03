<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Core\Revision\Revisions;
use Frootbox\Core\Search\AsSearchSource;
use Frootbox\Core\Search\SearchEntry;
use Frootbox\Core\Search\SearchSource;
use Frootbox\Database\EntityNotFoundException;
use Frootbox\People\Location\LocationStore;

/**
 * Locations in the search of the backend, as editors see them: drafts first.
 */
#[AsSearchSource(LocationStore::TYPE, 'Locations')]
final readonly class LocationSource implements SearchSource
{
    public function __construct(private LocationStore $store) {}

    public function changed(string $table, array $row): array
    {
        $id = Revisions::TABLE === $table && LocationStore::TYPE === ($row['type'] ?? null) ? $row['entity_id'] ?? null : null;

        return \is_string($id) ? [$id] : [];
    }

    public function items(): iterable
    {
        yield from $this->store->ids();
    }

    public function entries(array $items): iterable
    {
        foreach ($items as $id) {
            try {
                $data = $this->store->details($id)->current();
            } catch (EntityNotFoundException) {
                continue;
            }

            foreach ($data->translations as $language => $text) {
                yield new SearchEntry(
                    item: $id,
                    title: '' === $text->name ? $id : $text->name,
                    text: implode("\n", [...$data->address(), $text->text]),
                    permission: 'frootbox/people/location.show',
                    language: $language,
                );
            }
        }
    }
}
