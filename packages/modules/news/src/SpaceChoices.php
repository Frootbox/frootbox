<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Plugin\PluginSpaces;
use Frootbox\News\Article\ArticleStore;

/**
 * @implements Query<list<array{value: string, label: string}>>
 */
#[AsQuery('frootbox/news/space.choices', 'The spaces of the news as choices for a block, "All" first; empty with only one space', permission: 'frootbox/news/article.list')]
final readonly class SpaceChoices implements Query
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public function handle(PluginSpaces $spaces): array
    {
        return $spaces->choices(ArticleStore::TYPE);
    }
}
