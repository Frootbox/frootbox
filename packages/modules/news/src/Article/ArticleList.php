<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

/**
 * A page of the list of articles.
 */
final readonly class ArticleList
{
    /**
     * @param list<ArticleSummary> $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $page,
        public int $pages,
    ) {}
}
