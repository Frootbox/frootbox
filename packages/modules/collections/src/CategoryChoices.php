<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Language\Languages;

/**
 * The categories of the entries as choices for a block (decision 0246),
 * "Any" first, in the order of the tree, the ones below indented.
 *
 * @implements Query<list<array{value: string, label: string}>>
 */
#[AsQuery('frootbox/collections/category.choices', 'The categories of the entries as choices for a block, "Any" first; empty without categories', permission: 'frootbox/collections/entry.list')]
final readonly class CategoryChoices implements Query
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public function handle(ObjectCategories $categories, Languages $languages, Translator $translator): array
    {
        $language = $languages->default()->code;
        $options = [];

        foreach ($categories->tree(EntryStore::TYPE, EntryStore::CATEGORIES) as $item) {
            $options[] = ['value' => $item->id, 'label' => str_repeat('– ', $item->depth) . ($item->title($language) ?? $item->id)];
        }

        return [] === $options ? [] : [['value' => '', 'label' => $translator->get('Any')], ...$options];
    }
}
