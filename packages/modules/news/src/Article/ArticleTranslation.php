<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Frootbox\Database\Entity;

final readonly class ArticleTranslation extends Entity
{
    /**
     * @param array<mixed> $text Rich text as Tiptap JSON
     */
    public function __construct(
        public int $id,
        public string $articleId,
        public string $language,
        public string $title,
        public string $slug,
        public string $teaser,
        public array $text,
        public DateTimeImmutable $createdAt,
        public ?DateTimeImmutable $updatedAt,
    ) {}
}
