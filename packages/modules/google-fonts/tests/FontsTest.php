<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Tests;

use Frootbox\Core\Action\ConflictException;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Container\ContainerFactory;
use Frootbox\Core\Design\UpdateDesign;
use Frootbox\Core\Design\WebFonts;
use Frootbox\Core\ProjectPaths;
use Frootbox\Core\Theme\ThemeChain;
use Frootbox\GoogleFonts\Catalog\Catalog;
use Frootbox\GoogleFonts\Catalog\CatalogFont;
use Frootbox\GoogleFonts\Catalog\SearchCatalog;
use Frootbox\GoogleFonts\Font\DeleteFont;
use Frootbox\GoogleFonts\Font\FontLibrary;
use Frootbox\GoogleFonts\Font\FontSummary;
use Frootbox\GoogleFonts\Font\GoogleFontSource;
use Frootbox\GoogleFonts\Font\ImportedFont;
use Frootbox\GoogleFonts\Font\ImportFont;
use Frootbox\GoogleFonts\Font\ListFonts;
use Frootbox\GoogleFonts\GoogleFontsApi;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(GoogleFontsApi::class)]
#[CoversClass(Catalog::class)]
#[CoversClass(CatalogFont::class)]
#[CoversClass(SearchCatalog::class)]
#[CoversClass(FontLibrary::class)]
#[CoversClass(ImportFont::class)]
#[CoversClass(DeleteFont::class)]
#[CoversClass(ListFonts::class)]
#[CoversClass(ImportedFont::class)]
#[CoversClass(FontSummary::class)]
#[CoversClass(GoogleFontSource::class)]
final class FontsTest extends GoogleFontsTestCase
{
    public function testTheCatalogIsSearchedAndAskedOnceADay(): void
    {
        $families = self::families(...);

        self::assertSame(['Roboto', 'Inter', 'Lato', 'Lora', 'Noto Kufi Arabic', 'Nunito', 'Fake Mono'], $families($this->runner()->ask(new SearchCatalog())), 'The most used first.');
        self::assertSame(['Lato', 'Lora'], $families($this->runner()->ask(new SearchCatalog('L'))));
        self::assertSame(['Lora'], $families($this->runner()->ask(new SearchCatalog(category: 'serif'))));
        self::assertSame(['Roboto', 'Inter'], $families($this->runner()->ask(new SearchCatalog(limit: 2))));
        self::assertSame([GoogleFontsApi::CATALOG], $this->google->requests, 'Kept a day.');

        $inter = $this->runner()->ask(new SearchCatalog('inter'))[0];
        self::assertSame(['sans-serif', ['cyrillic', 'latin', 'latin-ext', 'vietnamese'], [100, 400, 900], [400], 100, 900, true], [$inter->category, $inter->subsets, $inter->weights, $inter->italics, $inter->minWeight, $inter->maxWeight, $inter->variable()]);
        $lato = $this->runner()->ask(new SearchCatalog('lato'))[0];
        self::assertSame(['latin', 'latin-ext'], $lato->subsets, 'Without "menu".');
        self::assertFalse($lato->variable());
    }

    public function testAnImportKeepsTheScriptsTheLanguagesNeed(): void
    {
        $inter = $this->runner()->run(new ImportFont('Inter'));
        self::assertSame(['google-inter', 'Inter', '"Inter", Arial, Helvetica, sans-serif', ['latin-ext', 'latin'], 2, false], [$inter->key, $inter->family, $inter->cssFamily, $inter->subsets, $inter->files, $inter->italic], 'No Cyrillic for German and Arabic; Inter has no Arabic.');
        self::assertContains('https://fonts.googleapis.com/css2?family=Inter%3Awght%40100..900&display=swap', $this->google->requests, 'The weight range of the variable font.');

        $kufi = $this->runner()->run(new ImportFont('Noto Kufi Arabic'));
        self::assertSame(['google-noto-kufi-arabic', ['arabic', 'latin']], [$kufi->key, $kufi->subsets], 'Arabic for the Arabic website.');

        $paths = $this->get(ProjectPaths::class);
        $file = $paths->storage('fonts/frootbox/google-fonts/inter-latin-normal-100-900.woff2');
        self::assertSame('wOF2 latin.woff2', file_get_contents($file));
        self::assertSame(['google-inter', 'google-noto-kufi-arabic'], array_map(static fn(FontSummary $font): string => $font->key, $this->runner()->ask(new ListFonts())));

        $fonts = $this->get(GoogleFontSource::class)->fonts();
        self::assertSame(['Inter', 'Inter'], [$fonts[0]->label, $fonts[0]->face]);
        self::assertSame([false, true], array_map(static fn($font): bool => $font->preload, $fonts[0]->files), 'Only the Latin file is preloaded.');
        self::assertSame('/media/fonts/frootbox/google-fonts/inter-latin-normal-100-900.woff2?v=' . filemtime($file), $fonts[0]->files[1]->url);
        self::assertFileExists($paths->public('media/fonts/frootbox/google-fonts/inter-latin-normal-100-900.woff2'), 'Copied for visitors.');

        $chain = $this->themes();
        self::assertSame('"Inter", Arial, Helvetica, sans-serif', $chain->fonts()['google-inter']->family, 'Among the fonts of the theme.');
        self::assertArrayHasKey('lora', $chain->fonts(), 'Next to those of the theme.');
    }

    public function testItalicsOfFixedWeightsComeOnRequest(): void
    {
        $lato = $this->runner()->run(new ImportFont('Lato', italic: true));

        self::assertContains('https://fonts.googleapis.com/css2?family=Lato%3Aital%2Cwght%400%2C400%3B0%2C700%3B1%2C400&display=swap', $this->google->requests);
        self::assertSame([3, true], [$lato->files, $lato->italic]);
        self::assertSame(
            [['italic', '400', false], ['normal', '400', true], ['normal', '700', false]],
            array_map(static fn($file): array => [$file->style, $file->weight, $file->preload], $this->get(GoogleFontSource::class)->fonts()[0]->files),
        );
    }

    public function testAVariableFontUpToWeight1000KeepsItsRange(): void
    {
        $this->runner()->run(new ImportFont('Nunito'));

        self::assertSame([['normal', '200 1000']], array_map(static fn($file): array => [$file->style, $file->weight], $this->get(GoogleFontSource::class)->fonts()[0]->files), 'Bold text uses the font, not a faked bold.');
        self::assertFileExists($this->get(ProjectPaths::class)->storage('fonts/frootbox/google-fonts/nunito-latin-normal-200-1000.woff2'));
    }

    public function testAnImportAgainReplacesTheFiles(): void
    {
        $this->runner()->run(new ImportFont('Inter'));
        $this->google->css['Inter:wght@100..900'] = str_replace('/* latin-ext */', '/* vietnamese */', $this->google->css['Inter:wght@100..900']);
        $this->runner()->run(new ImportFont('Inter'));

        $paths = $this->get(ProjectPaths::class);
        self::assertFileDoesNotExist($paths->storage('fonts/frootbox/google-fonts/inter-latin-ext-normal-100-900.woff2'));
        self::assertSame(['latin'], $this->runner()->ask(new ListFonts())[0]->subsets);
        self::assertCount(1, $this->runner()->ask(new ListFonts()));
    }

    public function testFilesComeOnlyFromGoogle(): void
    {
        $this->expectException(ConflictException::class);
        $this->expectExceptionMessage('outside of fonts.gstatic.com');

        try {
            $this->runner()->run(new ImportFont('Fake Mono'));
        } finally {
            self::assertSame([], $this->runner()->ask(new ListFonts()));
        }
    }

    public function testAFamilyMustBeInTheCatalog(): void
    {
        try {
            $this->runner()->run(new ImportFont('Comic Neue'));
            self::fail('Not in the catalog.');
        } catch (InvalidInputException $exception) {
            self::assertSame(['/family' => 'Google Fonts has no family "Comic Neue".'], $exception->errors);
        }
    }

    public function testAFontTheDesignUsesStays(): void
    {
        $this->runner()->run(new ImportFont('Inter'));
        $this->themes();
        $this->runner()->run(new UpdateDesign(['font-heading' => 'google-inter']));

        try {
            $this->runner()->run(new DeleteFont('google-inter'));
            self::fail('The draft of the design uses it.');
        } catch (ConflictException $exception) {
            self::assertStringContainsString('The design uses the font "Inter"', $exception->getMessage());
        }

        $this->runner()->run(new UpdateDesign(['font-heading' => null]));
        $this->runner()->run(new DeleteFont('google-inter'));
        self::assertSame([], $this->runner()->ask(new ListFonts()));
        self::assertFileDoesNotExist($this->get(ProjectPaths::class)->storage('fonts/frootbox/google-fonts/inter-latin-normal-100-900.woff2'));
        $this->themes();
        $fonts = $this->container->make(WebFonts::class);
        self::assertInstanceOf(WebFonts::class, $fonts);
        self::assertStringNotContainsString('Inter', $fonts->css());
    }

    /**
     * @param list<CatalogFont> $fonts
     *
     * @return list<string>
     */
    private static function families(array $fonts): array
    {
        return array_map(static fn(CatalogFont $font): string => $font->family, $fonts);
    }

    /**
     * The chain of themes as the next request builds it.
     */
    private function themes(): ThemeChain
    {
        $chain = $this->container->call([ContainerFactory::class, 'createThemeChain']);
        self::assertInstanceOf(ThemeChain::class, $chain);
        $this->container->set(ThemeChain::class, $chain);

        return $chain;
    }
}
