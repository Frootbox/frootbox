<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Font;

use Frootbox\Core\Action\ConflictException;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Design\DesignTokens;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Support\Message;
use Frootbox\Core\Theme\StoredFonts;
use Frootbox\GoogleFonts\Catalog\Catalog;
use Frootbox\GoogleFonts\Catalog\CatalogFont;
use Frootbox\GoogleFonts\GoogleFontsApi;

/**
 * Imports families of Google Fonts and removes them again (decision
 * 0252): only the files of the scripts the languages of the website
 * need, only WOFF2, only from fonts.gstatic.com.
 */
final readonly class FontLibrary
{
    public const string PACKAGE = 'frootbox/google-fonts';

    public const string PREFIX = 'google-';

    /** Always, for names, numbers and words from other languages. */
    private const array LATIN = ['latin', 'latin-ext'];

    /** The scripts a language needs besides Latin. */
    private const array SCRIPTS = [
        'ar' => ['arabic'],
        'fa' => ['arabic'],
        'ur' => ['arabic'],
        'he' => ['hebrew'],
        'ru' => ['cyrillic', 'cyrillic-ext'],
        'uk' => ['cyrillic', 'cyrillic-ext'],
        'bg' => ['cyrillic', 'cyrillic-ext'],
        'sr' => ['cyrillic', 'cyrillic-ext'],
        'mk' => ['cyrillic', 'cyrillic-ext'],
        'be' => ['cyrillic', 'cyrillic-ext'],
        'el' => ['greek', 'greek-ext'],
        'vi' => ['vietnamese'],
    ];

    public function __construct(
        private Catalog $catalog,
        private GoogleFontsApi $api,
        private ImportedFonts $fonts,
        private StoredFonts $stored,
        private Languages $languages,
    ) {}

    /**
     * @throws InvalidInputException The catalog has no such family
     * @throws ConflictException     Google Fonts cannot be reached or gives no WOFF2 files
     */
    public function import(string $action, string $family, bool $italic): ImportedFont
    {
        $font = $this->catalog->family($family) ?? throw new InvalidInputException($action, ['/family' => new Message('Google Fonts has no family "{family}".', ['family' => $family])]);
        $italic = $italic && $font->italic();
        $wanted = $this->subsets($font);
        $files = [];
        $contents = [];

        foreach (self::faces($this->api->css(self::request($font, $italic))) as $face) {
            if (null !== $wanted && !\in_array($face['subset'], $wanted, true)) {
                continue;
            }

            $name = self::slug($font->family) . '-' . (preg_replace('/[^a-z0-9-]+/', '', strtolower($face['subset'])) ?? '') . '-' . $face['style'] . '-' . str_replace(' ', '-', $face['weight']) . '.woff2';
            $contents[$name] = $this->api->file($face['url']);
            $files[] = ['name' => $name, 'subset' => $face['subset'], 'style' => $face['style'], 'weight' => $face['weight'], 'range' => $face['range']];
        }

        if ([] === $files) {
            throw new ConflictException(new Message('Google Fonts gave no WOFF2 files for "{family}". Nothing was imported.', ['family' => $font->family]));
        }

        $key = self::key($font->family);
        $existing = $this->fonts->byKey($key);

        foreach ($existing?->files() ?? [] as $old) {
            if (!isset($contents[$old['name']])) {
                $this->stored->remove(self::PACKAGE, $old['name']);
            }
        }

        foreach ($contents as $name => $content) {
            $this->stored->save(self::PACKAGE, $name, $content);
        }

        $values = ['key' => $key, 'family' => $font->family, 'category' => $font->category, 'files' => $files, 'italic' => $italic];

        return null === $existing ? $this->fonts->insert($values) : $this->fonts->update($existing->id, $values);
    }

    /**
     * The design comes with the call, not with the library: it needs the
     * chain of themes, which knows the imported fonts only once built.
     *
     * @throws InvalidInputException There is no such font
     * @throws ConflictException     The design or its draft uses the font
     */
    public function delete(string $action, string $key, DesignTokens $design): void
    {
        $font = $this->fonts->byKey($key) ?? throw new InvalidInputException($action, ['/key' => 'There is no such imported font.']);

        foreach ([true, false] as $draft) {
            if (\in_array($key, $design->overrides($draft), true)) {
                throw new ConflictException(new Message('The design uses the font "{family}". Choose another font there first.', ['family' => $font->family]));
            }
        }

        $this->fonts->delete($font->id);

        foreach ($font->files() as $file) {
            $this->stored->remove(self::PACKAGE, $file['name']);
        }
    }

    public static function key(string $family): string
    {
        return self::PREFIX . self::slug($family);
    }

    /**
     * The scripts to keep, null for all the font has.
     *
     * @return list<string>|null
     */
    private function subsets(CatalogFont $font): ?array
    {
        if (!\in_array('latin', $font->subsets, true)) {
            return null;
        }

        $wanted = self::LATIN;

        foreach ($this->languages->codes() as $code) {
            $wanted = [...$wanted, ...self::SCRIPTS[strtolower(explode('-', $code)[0])] ?? []];
        }

        return array_values(array_intersect(array_unique($wanted), $font->subsets));
    }

    /**
     * The family for css2, e.g. "Inter:ital,wght@0,100..900;1,100..900"
     * or "Lato:wght@400;700".
     */
    private static function request(CatalogFont $font, bool $italic): string
    {
        if ($font->variable()) {
            $range = $font->minWeight . '..' . $font->maxWeight;

            return $font->family . ($italic ? ':ital,wght@0,' . $range . ';1,' . $range : ':wght@' . $range);
        }

        if ($italic) {
            $tuples = [...array_map(static fn(int $weight): string => '0,' . $weight, $font->weights), ...array_map(static fn(int $weight): string => '1,' . $weight, $font->italics)];

            return $font->family . ':ital,wght@' . implode(';', $tuples);
        }

        return $font->family . ([] === $font->weights ? '' : ':wght@' . implode(';', $font->weights));
    }

    /**
     * The @font-face rules of the CSS of Google Fonts, each after a
     * comment with its script, e.g. "latin-ext" or "[3]".
     *
     * @return list<array{subset: string, style: string, weight: string, range: ?string, url: string}>
     */
    private static function faces(string $css): array
    {
        preg_match_all('#/\*\s*([^*]+?)\s*\*/\s*@font-face\s*\{([^}]*)\}#', $css, $matches, \PREG_SET_ORDER);
        $faces = [];

        foreach ($matches as [, $subset, $rule]) {
            if (1 !== preg_match('/src:\s*url\(([^)\s]+\.woff2)\)\s*format\([\'"]woff2[\'"]\)/', $rule, $src)) {
                continue;
            }

            $style = 1 === preg_match('/font-style:\s*italic/', $rule) ? 'italic' : 'normal';
            $weight = 1 === preg_match('/font-weight:\s*(\d{3}(?: \d{3})?)\s*;/', $rule, $match) ? $match[1] : '400';
            $range = 1 === preg_match('/unicode-range:\s*([^;]+);/', $rule, $match) ? trim($match[1]) : null;
            $faces[] = ['subset' => $subset, 'style' => $style, 'weight' => $weight, 'range' => $range, 'url' => trim($src[1], '\'"')];
        }

        return $faces;
    }

    private static function slug(string $family): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($family)) ?? '', '-');
    }
}
