<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Database\Repository;

/**
 * @extends Repository<Article>
 */
final class Articles extends Repository
{
    public const string TABLE = 'frootbox_news_articles';

    protected function table(): string
    {
        return self::TABLE;
    }

    protected function entity(): string
    {
        return Article::class;
    }
}
