<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Category;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;

#[AsQuery('frootbox/news/category.list', 'Lists the categories of the news in their order', public: true)]
final readonly class ListCategories implements Query
{
    /**
     * @return list<Category>
     */
    public function handle(Categories $categories): array
    {
        return $categories->all();
    }
}
