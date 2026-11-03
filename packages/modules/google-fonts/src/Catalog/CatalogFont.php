<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Catalog;

/**
 * A family of the catalog of Google Fonts (decision 0252). A variable
 * font has a weight range ("100" to "900"), others their weights.
 */
final readonly class CatalogFont
{
    /**
     * @param list<string> $subsets e.g. ["latin", "latin-ext", "arabic"]
     * @param list<int>    $weights The upright weights, e.g. [400, 700]
     * @param list<int>    $italics The italic weights, empty without italics
     */
    public function __construct(
        public string $family,
        /** "sans-serif", "serif", "display", "handwriting" or "monospace" */
        public string $category,
        public array $subsets,
        public array $weights,
        public array $italics,
        /** The weight range of a variable font, null for fixed weights */
        public ?int $minWeight,
        public ?int $maxWeight,
        /** 1 is the most used */
        public int $popularity,
    ) {}

    public function italic(): bool
    {
        return [] !== $this->italics;
    }

    public function variable(): bool
    {
        return null !== $this->minWeight && null !== $this->maxWeight && $this->minWeight < $this->maxWeight;
    }

    /**
     * @param array<mixed> $data A slim entry as Catalog keeps it
     */
    public static function of(array $data): self
    {
        $strings = static fn(mixed $list): array => \is_array($list) ? array_values(array_filter($list, \is_string(...))) : [];
        $ints = static fn(mixed $list): array => \is_array($list) ? array_values(array_filter($list, \is_int(...))) : [];
        $int = static fn(mixed $value): ?int => \is_int($value) ? $value : null;

        return new self(
            \is_string($data['family'] ?? null) ? $data['family'] : '',
            \is_string($data['category'] ?? null) ? $data['category'] : 'sans-serif',
            $strings($data['subsets'] ?? null),
            $ints($data['weights'] ?? null),
            $ints($data['italics'] ?? null),
            $int($data['minWeight'] ?? null),
            $int($data['maxWeight'] ?? null),
            $int($data['popularity'] ?? null) ?? \PHP_INT_MAX,
        );
    }
}
