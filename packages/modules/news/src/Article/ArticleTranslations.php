<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Database\Repository;

/**
 * @extends Repository<ArticleTranslation>
 */
final class ArticleTranslations extends Repository
{
    public const string TABLE = 'frootbox_news_article_translations';

    /**
     * @return array<string, ArticleTranslation> by language
     */
    public function of(string $articleId): array
    {
        $translations = [];

        foreach ($this->fetch(['where' => ['articleId' => $articleId]]) as $translation) {
            $translations[$translation->language] = $translation;
        }

        return $translations;
    }

    protected function table(): string
    {
        return self::TABLE;
    }

    protected function entity(): string
    {
        return ArticleTranslation::class;
    }
}
