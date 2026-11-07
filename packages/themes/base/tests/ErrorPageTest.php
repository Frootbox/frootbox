<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\ThemeBase\Tests;

use Frootbox\Core\Error\ErrorPages;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Navigation\PublishNavigations;
use Frootbox\Core\Navigation\UpdateNavigation;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Settings\UpdateSettings;
use Frootbox\Core\Site\PublishSite;
use Frootbox\Core\Site\UpdateSite;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\Attributes\CoversNothing;
use RuntimeException;
use Throwable;

/**
 * The error page of the website in the frame of the base theme (decision
 * 0189).
 */
#[CoversNothing]
final class ErrorPageTest extends NotesTestCase
{
    private const string THEME = 'frootbox/theme-base';

    protected function setUp(): void
    {
        parent::setUp();

        $start = $this->runner()->run(new CreatePage(self::THEME . '/Start', ['de' => ['title' => 'Start'], 'ar' => ['title' => 'البداية']]))->id;
        $about = $this->runner()->run(new CreatePage(self::THEME . '/Page', ['de' => ['title' => 'Über uns', 'content' => ['fields' => ['title' => 'Über uns']]]], $start))->id;
        $this->runner()->run(new PublishPages([$start, $about]));
        $this->runner()->run(new UpdateNavigation('main', ['de' => [['type' => 'target', 'target' => 'page:' . $about]]]));
        $this->runner()->run(new PublishNavigations(['main']));
        $this->runner()->run(new UpdateSite('de', ['brand' => 'Bohnenglück']));
        $this->runner()->run(new PublishSite());
    }

    public function testShowsAMissingPageInTheFrameOfTheWebsite(): void
    {
        $html = $this->page('/gibt-es-nicht', HttpException::notFound('/gibt-es-nicht'));

        self::assertStringContainsString('<html lang="de" dir="ltr">', $html);
        self::assertStringContainsString('<title>Seite nicht gefunden – Bohnenglück</title>', $html);
        self::assertStringContainsString('<meta name="robots" content="noindex">', $html);
        self::assertStringContainsString('<a class="base-header__brand" href="/">', $html, 'The brand leads to the start page.');
        self::assertStringContainsString('<a href="/ueber-uns">Über uns</a>', $html, 'The main navigation helps on.');
        self::assertStringContainsString('<main id="content" class="base-page base-error">', $html);
        self::assertStringContainsString('<p class="base-error__status">Fehler 404</p>', $html);
        self::assertStringContainsString('<h1 class="base-error__title">Seite nicht gefunden</h1>', $html);
        self::assertStringContainsString('<p class="base-error__text">Diese Seite gibt es nicht (mehr). Vielleicht hat sich ihre Adresse geändert.</p>', $html);
        self::assertStringContainsString('<p class="base-error__actions"><a href="/">Zur Startseite</a></p>', $html);
        self::assertStringContainsString('<p class="base-footer__brand">Bohnenglück</p>', $html);
        self::assertSame(1, substr_count($html, '<h1'), 'One main heading.');
        self::assertStringNotContainsString('base-languages', $html, 'No page, so no other languages of it.');
        self::assertStringNotContainsString('base-breadcrumb', $html);
        self::assertStringNotContainsString('fb-error-details', $html, 'Live, never technical details.');
    }

    public function testSpeaksTheLanguageOfTheAddress(): void
    {
        $html = $this->page('/ar/غير-موجود', HttpException::notFound('/ar/x'));

        self::assertStringContainsString('<html lang="ar" dir="rtl">', $html);
        self::assertStringContainsString('<h1 class="base-error__title">الصفحة غير موجودة</h1>', $html);
        self::assertStringContainsString('<a href="/ar">إلى الصفحة الرئيسية</a>', $html, 'The way back stays in the language.');
        self::assertStringContainsString('<a class="base-header__brand" href="/ar">', $html);
    }

    public function testTellsAServerErrorAndShowsDetailsInDevelopmentOnly(): void
    {
        $failure = new RuntimeException('The roaster is cold.');
        $html = $this->page('/kaputt', $failure, 500, details: true);

        self::assertStringContainsString('<h1 class="base-error__title">Da ist etwas schiefgegangen</h1>', $html);
        self::assertStringContainsString('<p class="base-error__status">Fehler 500</p>', $html);
        self::assertStringContainsString('<details class="fb-error-details"><summary>Technische Details</summary>', $html, 'Collapsed below the page.');
        self::assertStringContainsString('<p class="fb-error-details__message">The roaster is cold.</p>', $html);

        self::assertStringContainsString('<h1 class="base-error__title">Vorübergehend nicht erreichbar</h1>', $this->page('/gesperrt', HttpException::locked('/gesperrt'), 503));
    }

    public function testAddressesTheVisitorAsTheWebsiteSays(): void
    {
        $this->runner()->run(new UpdateSettings('frootbox/core.formality', ['formal' => true]));

        self::assertStringContainsString('Das liegt an uns, nicht an Ihnen. Bitte versuchen Sie es gleich noch einmal.', $this->page('/kaputt', new RuntimeException('Cold.'), 500));
        self::assertStringContainsString('An dieser Seite wird gerade gearbeitet. Bitte versuchen Sie es später noch einmal.', $this->page('/gesperrt', HttpException::locked('/gesperrt'), 503));
    }

    public function testLeavesTheAccessToTheWebsiteToTheCore(): void
    {
        $pages = $this->get(ErrorPages::class);
        $request = new ServerRequest('GET', 'https://example.org/kontakt');

        self::assertNull($pages->render($request, 401, HttpException::siteProtected('/kontakt'), false), 'Nothing of the site behind the password.');
        self::assertNull($pages->render($request, 401, HttpException::siteProtected('/kontakt', false), false));
        self::assertNull($pages->render($request, 410, HttpException::previewExpired(), false));
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

    private function page(string $path, Throwable $throwable, int $status = 404, bool $details = false): string
    {
        $html = $this->get(ErrorPages::class)->render(new ServerRequest('GET', 'https://example.org' . $path), $status, $throwable, $details);
        self::assertIsString($html);

        return $html;
    }
}
