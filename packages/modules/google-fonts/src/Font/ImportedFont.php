<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Font;

use DateTimeImmutable;
use Frootbox\Database\Entity;

/**
 * A family imported from Google Fonts (decision 0252) with its files in
 * storage/fonts/frootbox/google-fonts/.
 */
final readonly class ImportedFont extends Entity
{
    /**
     * @param array<mixed> $files [{"name": "inter-latin-normal-100-900.woff2", "subset": "latin", "style": "normal", "weight": "100 900", "range": "U+0000-00FF, …"}]
     */
    public function __construct(
        public string $id,
        /** "google-inter" */
        public string $key,
        public string $family,
        /** "sans-serif", "serif", "display", "handwriting" or "monospace" */
        public string $category,
        public array $files,
        public bool $italic,
        public ?DateTimeImmutable $createdAt = null,
        public ?DateTimeImmutable $updatedAt = null,
    ) {}

    /**
     * @return list<array{name: string, subset: string, style: string, weight: string, range: ?string}>
     */
    public function files(): array
    {
        $files = [];

        foreach ($this->files as $file) {
            if (\is_array($file) && \is_string($file['name'] ?? null)) {
                $files[] = [
                    'name' => $file['name'],
                    'subset' => \is_string($file['subset'] ?? null) ? $file['subset'] : '',
                    'style' => 'italic' === ($file['style'] ?? null) ? 'italic' : 'normal',
                    'weight' => \is_string($file['weight'] ?? null) ? $file['weight'] : '400',
                    'range' => \is_string($file['range'] ?? null) ? $file['range'] : null,
                ];
            }
        }

        return $files;
    }

    /**
     * The scripts of the files, e.g. ["latin", "latin-ext", "arabic"].
     *
     * @return list<string>
     */
    public function subsets(): array
    {
        return array_values(array_unique(array_column($this->files(), 'subset')));
    }

    /**
     * The CSS font-family with a fallback by the kind of the font.
     */
    public function cssFamily(): string
    {
        $fallback = match ($this->category) {
            'serif' => 'Georgia, serif',
            'monospace' => '"Courier New", monospace',
            default => 'Arial, Helvetica, sans-serif',
        };

        return '"' . str_replace(['"', '\\'], '', $this->family) . '", ' . $fallback;
    }
}
