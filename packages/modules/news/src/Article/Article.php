<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Frootbox\Database\Entity;

/**
 * A published article; its draft and versions live in revisions.
 */
final readonly class Article extends Entity
{
    /**
     * @param array<mixed>|null $image The value of an image field: {"media": "01J…", "alt": "…"}
     */
    public function __construct(
        public string $id,
        public DateTimeImmutable $date,
        public ?array $image,
        public DateTimeImmutable $createdAt,
        public ?DateTimeImmutable $updatedAt,
    ) {}
}
