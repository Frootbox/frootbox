<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Category;

use DateTimeImmutable;
use Frootbox\Database\Entity;

/**
 * A category of the news, without a draft (decision 0219).
 */
final readonly class Category extends Entity
{
    /**
     * @param array<mixed> $translations {"de": {"title": "Kaffee", "slug": "kaffee"}}
     */
    public function __construct(
        public string $id,
        public int $position,
        public array $translations,
        public DateTimeImmutable $createdAt,
        public ?DateTimeImmutable $updatedAt,
    ) {}

    public function title(string $language): ?string
    {
        $translation = $this->translations[$language] ?? null;
        $title = \is_array($translation) ? $translation['title'] ?? null : null;

        return \is_string($title) ? $title : null;
    }

    public function slug(string $language): ?string
    {
        $translation = $this->translations[$language] ?? null;
        $slug = \is_array($translation) ? $translation['slug'] ?? null : null;

        return \is_string($slug) ? $slug : null;
    }
}
