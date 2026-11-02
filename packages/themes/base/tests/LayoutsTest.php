<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\ThemeBase\Tests;

use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Navigation\PublishNavigations;
use Frootbox\Core\Navigation\UpdateNavigation;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PageHandler;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Site\PublishSite;
use Frootbox\Core\Site\UpdateSite;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\Attributes\CoversNothing;

/**
 * The layouts and partials of the base theme, delivered as visitors see
 * them (decision 0162).
 */
#[CoversNothing]
final class LayoutsTest extends NotesTestCase
{
    private const string THEME = 'frootbox/theme-base';

    public function testDeliversTheLayoutsWithHeadAndFoot(): void
    {
        $section = ['block' => self::THEME . '/Section', 'areas' => ['first' => [['block' => self::THEME . '/Heading', 'fields' => ['text' => 'Frisch geröstet']]]]];
        $start = $this->page(self::THEME . '/Start', null, ['de' => ['title' => 'Start', 'content' => ['areas' => ['main' => [$section]]]], 'ar' => ['title' => 'البداية']]);
        $about = $this->page(self::THEME . '/Page', $start, ['de' => ['title' => 'Über uns', 'content' => ['fields' => ['title' => 'Über uns', 'intro' => 'Seit 2012 in Hamburg.']]]]);
        $offer = $this->page(self::THEME . '/Landing', $start, ['de' => ['title' => 'Angebot']]);
        $legal = $this->page(self::THEME . '/Page', $start, ['de' => ['title' => 'Impressum', 'content' => ['fields' => ['title' => 'Impressum']]]]);
        $this->runner()->run(new PublishPages([$start, $about, $offer, $legal]));

        $this->runner()->run(new UpdateNavigation('main', ['de' => [['type' => 'target', 'target' => 'page:' . $about], ['type' => 'heading', 'label' => 'Mehr', 'children' => [['type' => 'target', 'target' => 'page:' . $offer]]], ['type' => 'target', 'target' => 'page:' . $legal, 'options' => ['button' => true]]]]));
        $this->runner()->run(new UpdateNavigation('footer', ['de' => [['type' => 'target', 'target' => 'page:' . $legal]]]));
        $this->runner()->run(new PublishNavigations(['main', 'footer']));
        $this->runner()->run(new UpdateSite('de', ['brand' => 'Bohnenglück', 'address' => "Hafenstraße 12\n20457 Hamburg"]));
        $this->runner()->run(new PublishSite());

        $home = $this->html('/');
        self::assertStringContainsString('<a class="base-skip-link" href="#content">Zum Inhalt springen</a>', $home, 'The texts of the theme speak the language of the page.');
        self::assertStringContainsString('<nav class="base-nav base-nav--main" aria-label="Hauptnavigation">', $home);
        self::assertStringContainsString('<a href="/impressum" class="base-nav__button">Impressum</a>', $home, 'An entry of the main navigation may stand out as a button (decision 0188).');
        self::assertMatchesRegularExpression('#<summary>Mehr</summary>\s*<ul>\s*<li><a href="/angebot">Angebot</a></li>#', $home, 'A heading opens its children without a link of its own.');
        self::assertStringContainsString('<button class="base-header__toggle" type="button" popovertarget="base-menu" aria-label="Menü">', $home);
        self::assertStringContainsString('<main id="content" class="base-page">', $home);
        self::assertStringContainsString('class="base-section', $home);
        self::assertStringContainsString('<h1 class="base-heading base-heading--large">Frisch geröstet</h1>', $home, 'On the start page the first heading is the main one.');
        self::assertStringContainsString('<p class="base-footer__brand">Bohnenglück</p>', $home);
        self::assertStringContainsString('<a href="/impressum">Impressum</a>', $home);
        self::assertStringContainsString('<ul class="base-languages" aria-label="Sprache">', $home);
        self::assertStringContainsString('hreflang="ar" lang="ar" dir="rtl">العربية</a>', $home, 'Each language is named in its own.');
        self::assertStringContainsString('<link rel="preload" href="/assets/frootbox/theme-base/assets/fonts/noto-sans-latin.woff2', $home);
        self::assertStringContainsString('font-family:"Noto Sans Arabic"', $home, 'Arabic letters bring their font along.');
        self::assertStringNotContainsString('base-breadcrumb', $home, 'The start page needs no way back.');

        $page = $this->html('/ueber-uns');
        self::assertMatchesRegularExpression('#<nav class="base-breadcrumb" aria-label="Brotkrumen">\s*<ol>\s*<li><a href="/">Startseite</a></li>\s*<li><span aria-current="page">Über uns</span></li>#', $page);
        self::assertStringContainsString('<h1 class="base-page-head__title">Über uns</h1>', $page);
        self::assertStringContainsString('<p class="base-page-head__intro">Seit 2012 in Hamburg.</p>', $page);
        self::assertStringContainsString('<a href="/ueber-uns" aria-current="page">Über uns</a>', $page);

        $landing = $this->html('/angebot');
        self::assertStringNotContainsString('base-nav--main', $landing, 'Nothing leads away from a landing page …');
        self::assertStringNotContainsString('popovertarget', $landing);
        self::assertStringContainsString('<a href="/impressum">Impressum</a>', $landing, '… but the legal notice stays in reach.');

        $arabic = $this->html('/ar');
        self::assertStringContainsString('<html lang="ar" dir="rtl">', $arabic);
        self::assertStringContainsString('>انتقل إلى المحتوى</a>', $arabic);
        self::assertStringContainsString('aria-label="القائمة"', $arabic);
        self::assertMatchesRegularExpression('#<p class="base-footer__address" lang="de" dir="ltr">Hafenstraße 12<br>\s*20457 Hamburg</p>#', $arabic, 'The German address keeps its direction on the Arabic page.');
        self::assertStringContainsString('<span lang="de" dir="ltr">Bohnenglück</span>', $arabic);
    }

    protected function extensions(): Extensions
    {
        return new Extensions([ExtensionPackage::fromManifest(self::THEME, \dirname(__DIR__))], 'tests');
    }

    protected function config(): array
    {
        return [
            'app' => ['name' => 'Bohnenglück', 'url' => 'https://example.org/'],
            'theme' => self::THEME,
            'languages' => ['de' => ['title' => 'Deutsch'], 'ar' => ['title' => 'العربية', 'direction' => 'rtl']],
        ];
    }

    /**
     * @param array<string, array<string, mixed>> $translations
     */
    private function page(string $layout, ?string $parentId, array $translations): string
    {
        return $this->runner()->run(new CreatePage($layout, $translations, $parentId))->id;
    }

    private function html(string $path): string
    {
        return (string) $this->get(PageHandler::class)->handle(new ServerRequest('GET', 'https://example.org' . $path))->getBody();
    }
}
