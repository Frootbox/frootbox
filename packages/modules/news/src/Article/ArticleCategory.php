<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Database\Entity;

/**
 * A category of a published article.
 */
final readonly class ArticleCategory extends Entity
{
    public function __construct(
        public int $id,
        public string $articleId,
        public string $categoryId,
    ) {}
}
