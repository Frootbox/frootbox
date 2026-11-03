<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Font;

use Doctrine\DBAL\Exception\TableNotFoundException;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Theme\Font;
use Frootbox\Core\Theme\FontFile;
use Frootbox\Core\Theme\FontSource;
use Frootbox\Core\Theme\StoredFonts;
use Psr\Container\ContainerInterface;

/**
 * The imported fonts for the design (decision 0252): they appear among
 * the fonts of the theme. The repository comes from the container only
 * with a database, because the chain of themes is built for every request,
 * also during the installation.
 */
final readonly class GoogleFontSource implements FontSource
{
    public function __construct(
        private Config $config,
        private ContainerInterface $container,
        private StoredFonts $stored,
    ) {}

    /**
     * @return list<Font>
     */
    public function fonts(): array
    {
        if ('' === $this->config->string('database.url', '')) {
            return [];
        }

        $fonts = $this->container->get(ImportedFonts::class);

        try {
            $imported = $fonts instanceof ImportedFonts ? $fonts->sorted() : [];
        } catch (TableNotFoundException) {
            // Not migrated yet.
            return [];
        }

        return array_map($this->font(...), $imported);
    }

    private function font(ImportedFont $font): Font
    {
        $files = [];
        $preload = false;

        foreach ($font->files() as $file) {
            $first = !$preload && 'latin' === $file['subset'] && 'normal' === $file['style'] && self::covers($file['weight'], 400);
            $preload = $preload || $first;
            $files[] = new FontFile(
                $this->stored->path(FontLibrary::PACKAGE, $file['name']),
                $file['weight'],
                $file['style'],
                $file['range'],
                $first,
                $this->stored->url(FontLibrary::PACKAGE, $file['name']),
            );
        }

        return new Font($font->key, $font->family, $font->cssFamily(), $font->family, $files);
    }

    /** Whether "400" or "100 900" includes the weight. */
    private static function covers(string $weight, int $value): bool
    {
        $parts = array_map(intval(...), explode(' ', $weight));

        return $value >= $parts[0] && $value <= ($parts[1] ?? $parts[0]);
    }
}
