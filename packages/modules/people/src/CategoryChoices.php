<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Language\Languages;
use Frootbox\People\Person\PersonStore;

/**
 * The categories of the people as choices for a block (decision 0242):
 * "Any" first, then each in the order of the tree, indented by depth.
 * The value is the id, so the choice holds in every language.
 *
 * @implements Query<list<array{value: string, label: string}>>
 */
#[AsQuery('frootbox/people/category.choices', 'The categories of the people as choices for a block, "Any" first; empty without categories', permission: 'frootbox/people/person.list')]
final readonly class CategoryChoices implements Query
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public function handle(ObjectCategories $categories, Languages $languages, Translator $translator): array
    {
        $choices = [];

        foreach ($categories->tree(PersonStore::TYPE) as $item) {
            $title = null;

            foreach ($languages->contentLanguages($languages->default()->code) as $code) {
                $title ??= $item->title($code);
            }

            $choices[] = ['value' => $item->id, 'label' => str_repeat('– ', $item->depth) . ($title ?? $item->id)];
        }

        return [] === $choices ? [] : [['value' => '', 'label' => $translator->get('Any')], ...$choices];
    }
}
