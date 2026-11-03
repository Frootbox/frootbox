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
use Frootbox\People\Person\PersonStore;

/**
 * People in the search of the backend, as editors see them: drafts first.
 */
#[AsSearchSource(PersonStore::TYPE, 'People')]
final readonly class PersonSource implements SearchSource
{
    public function __construct(private PersonStore $store) {}

    public function changed(string $table, array $row): array
    {
        $id = Revisions::TABLE === $table && PersonStore::TYPE === ($row['type'] ?? null) ? $row['entity_id'] ?? null : null;

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

            foreach ([] === $data->translations ? ['' => null] : $data->translations as $language => $text) {
                yield new SearchEntry(
                    item: $id,
                    title: '' === $data->name() ? $id : $data->name(),
                    text: null === $text ? $data->email : implode("\n", [$text->role, $text->text, $data->email]),
                    permission: 'frootbox/people/person.show',
                    language: $language,
                );
            }
        }
    }
}
