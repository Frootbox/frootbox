<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Frootbox\Core\Category\Category;
use Frootbox\Core\Tag\Tag;

/**
 * A published article in one language, for the website.
 */
final readonly class ArticleView
{
    /**
     * @param array<mixed>|null $image
     * @param array<mixed>      $text
     * @param list<Category>    $categories
     * @param list<Tag>         $tags
     */
    public function __construct(
        public string $id,
        public string $language,
        public DateTimeImmutable $date,
        public string $title,
        public string $slug,
        public string $teaser,
        public array $text,
        public ?array $image,
        public array $categories,
        public array $tags = [],
    ) {}
}
