<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Font;

use DateTimeImmutable;

/**
 * An imported font for the API, the AI and the backend (decision 0252).
 */
final readonly class FontSummary
{
    /**
     * @param list<string> $subsets
     */
    public function __construct(
        /** The value of a font token, e.g. "google-inter" */
        public string $key,
        public string $family,
        public string $category,
        public string $cssFamily,
        public bool $italic,
        public array $subsets,
        public int $files,
        public ?DateTimeImmutable $updatedAt,
    ) {}

    public static function of(ImportedFont $font): self
    {
        return new self($font->key, $font->family, $font->category, $font->cssFamily(), $font->italic, $font->subsets(), \count($font->files()), $font->updatedAt);
    }
}
