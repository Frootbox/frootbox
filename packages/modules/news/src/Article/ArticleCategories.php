<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Database\Repository;

/**
 * @extends Repository<ArticleCategory>
 */
final class ArticleCategories extends Repository
{
    public const string TABLE = 'frootbox_news_article_categories';

    /**
     * @return list<string> The ids of the categories of an article
     */
    public function of(string $articleId): array
    {
        return array_map(static fn(ArticleCategory $category): string => $category->categoryId, $this->fetch(['where' => ['articleId' => $articleId], 'order' => 'id'])->all());
    }

    protected function table(): string
    {
        return self::TABLE;
    }

    protected function entity(): string
    {
        return ArticleCategory::class;
    }
}
