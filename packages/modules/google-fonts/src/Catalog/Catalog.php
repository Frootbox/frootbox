<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Catalog;

use Frootbox\Core\Action\ConflictException;
use Frootbox\Core\ProjectPaths;
use Frootbox\GoogleFonts\GoogleFontsApi;

/**
 * The catalog of Google Fonts (decision 0252), slim and kept a day in
 * var/cache/, so a search does not ask Google every time.
 */
final readonly class Catalog
{
    public const int TTL = 86_400;

    private const string FILE = 'cache/google-fonts/catalog.json';

    private const array CATEGORIES = [
        'Sans Serif' => 'sans-serif',
        'Serif' => 'serif',
        'Display' => 'display',
        'Handwriting' => 'handwriting',
        'Monospace' => 'monospace',
    ];

    public function __construct(
        private GoogleFontsApi $api,
        private ProjectPaths $paths,
    ) {}

    /**
     * Every family, the most used first.
     *
     * @return list<CatalogFont>
     *
     * @throws ConflictException
     */
    public function all(): array
    {
        return array_map(CatalogFont::of(...), $this->entries());
    }

    /**
     * One family by its exact name, null if the catalog has none.
     *
     * @throws ConflictException
     */
    public function family(string $family): ?CatalogFont
    {
        foreach ($this->entries() as $entry) {
            if (($entry['family'] ?? null) === $family) {
                return CatalogFont::of($entry);
            }
        }

        return null;
    }

    /**
     * @return list<array<mixed>>
     *
     * @throws ConflictException
     */
    private function entries(): array
    {
        $file = $this->paths->var(self::FILE);

        if (is_file($file) && filemtime($file) > time() - self::TTL) {
            $cached = json_decode((string) file_get_contents($file), true);

            if (\is_array($cached) && array_is_list($cached)) {
                return array_values(array_filter($cached, \is_array(...)));
            }
        }

        $entries = self::slim($this->api->catalog());
        @mkdir(\dirname($file), 0o775, true);
        file_put_contents($file, json_encode($entries, \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_THROW_ON_ERROR));

        return $entries;
    }

    /**
     * @param array<mixed> $catalog
     *
     * @return list<array<mixed>>
     */
    private static function slim(array $catalog): array
    {
        $entries = [];

        foreach (\is_array($catalog['familyMetadataList'] ?? null) ? $catalog['familyMetadataList'] : [] as $family) {
            if (!\is_array($family) || !\is_string($family['family'] ?? null)) {
                continue;
            }

            $fonts = \is_array($family['fonts'] ?? null) ? array_map(strval(...), array_keys($family['fonts'])) : [];
            $weights = self::weights($fonts, '');
            $italics = self::weights($fonts, 'i');
            $range = null;

            foreach (\is_array($family['axes'] ?? null) ? $family['axes'] : [] as $axis) {
                if (\is_array($axis) && 'wght' === ($axis['tag'] ?? null) && is_numeric($axis['min'] ?? null) && is_numeric($axis['max'] ?? null)) {
                    $range = [(int) $axis['min'], (int) $axis['max']];
                }
            }

            $entries[] = [
                'family' => $family['family'],
                'category' => self::CATEGORIES[\is_string($family['category'] ?? null) ? $family['category'] : ''] ?? 'sans-serif',
                'subsets' => \is_array($family['subsets'] ?? null) ? array_values(array_filter($family['subsets'], static fn(mixed $subset): bool => \is_string($subset) && 'menu' !== $subset)) : [],
                'weights' => $weights,
                'italics' => $italics,
                'minWeight' => $range[0] ?? null,
                'maxWeight' => $range[1] ?? null,
                'popularity' => \is_int($family['popularity'] ?? null) ? $family['popularity'] : \PHP_INT_MAX,
            ];
        }

        usort($entries, static fn(array $a, array $b): int => [$a['popularity'], $a['family']] <=> [$b['popularity'], $b['family']]);

        return $entries;
    }

    /**
     * The weights of the styles "400" or "400i".
     *
     * @param list<string> $fonts
     *
     * @return list<int>
     */
    private static function weights(array $fonts, string $suffix): array
    {
        $weights = [];

        foreach ($fonts as $font) {
            if (1 === preg_match('/^([1-9]00)' . $suffix . '$/', $font, $match)) {
                $weights[] = (int) $match[1];
            }
        }

        sort($weights);

        return $weights;
    }
}
