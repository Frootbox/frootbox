<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Plugin\SpaceRights;
use Frootbox\Database\EntityNotFoundException;

/**
 * @implements Query<EntryList>
 */
#[AsQuery('frootbox/collections/entry.list', 'Lists the entries with drafts and published ones, by position and title')]
final readonly class ListEntries implements Query, Scoped
{
    public function __construct(
        #[Description('Language of the titles; left out for the first language of the website')]
        public ?string $language = null,
        #[Description('Only entries whose title holds this text')]
        #[Length(max: 100)]
        public ?string $search = null,
        #[Range(min: 1)]
        public int $page = 1,
        #[Range(min: 1, max: 200)]
        public int $perPage = 50,
        #[Description('Only the entries of this space; left out for all')]
        public ?string $space = null,
    ) {}

    /**
     * A role within a space is enough, the list shows only what lies within (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [];
    }

    public function handle(EntryStore $store, Languages $languages, SpaceRights $rights): EntryList
    {
        $language = null !== $this->language && $languages->has($this->language) ? $this->language : $languages->default()->code;
        $search = mb_strtolower(trim($this->search ?? ''));
        $items = [];
        // Only the spaces with a role there (decision 0245), null for all.
        $within = $rights->within(EntryStore::TYPE, 'frootbox/collections/entry.list');

        foreach ($store->ids() as $id) {
            try {
                $details = $store->details($id);
            } catch (EntityNotFoundException) {
                // Deleted by someone else since the ids were read.
                continue;
            }

            $data = $details->current();

            if (null !== $this->space && $data->space !== $this->space) {
                continue;
            }

            if (null !== $within && !\in_array($data->space, $within, true)) {
                continue;
            }

            $title = $data->text($language)->title ?? '';

            if ('' !== $search && !str_contains(mb_strtolower($title), $search)) {
                continue;
            }

            $items[] = new EntrySummary($id, $details->status, $title, $data->order, array_keys($data->translations), $details->publishAt, $details->unpublishAt);
        }

        usort($items, static fn(EntrySummary $a, EntrySummary $b): int => [$a->order, mb_strtolower($a->title), $a->id] <=> [$b->order, mb_strtolower($b->title), $b->id]);
        $pages = max(1, (int) ceil(\count($items) / $this->perPage));

        return new EntryList(\array_slice($items, ($this->page - 1) * $this->perPage, $this->perPage), \count($items), $this->page, $pages);
    }
}
