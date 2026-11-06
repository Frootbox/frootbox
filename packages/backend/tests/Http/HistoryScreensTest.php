<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Log\LogHandler;
use Frootbox\Backend\Http\Pages\PageHistoryHandler;
use Frootbox\Backend\Http\Pages\PagesHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\HistoryNames;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * The history of a page and the log in the backend (decision 0174).
 */
#[CoversClass(PageHistoryHandler::class)]
#[CoversClass(PagesHandler::class)]
#[CoversClass(LogHandler::class)]
#[CoversClass(HistoryNames::class)]
final class HistoryScreensTest extends BackendTestCase
{
    private string $page;

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->page = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Start', 'content' => ['fields' => ['heading' => 'Willkommen']]]]), Context::system())->id;
        $this->runner()->run(new PublishPages([$this->page]), Context::system());

        $this->createUser('admin@example.org', ['admin']);
        $this->session = $this->signIn('admin@example.org');
        $this->action('page.update-field', ['id' => $this->page, 'language' => 'de', 'path' => 'heading', 'value' => 'Hallo Welt', 'previous' => 'Willkommen'], $this->session);
    }

    public function testThePageShowsItsLatestChanges(): void
    {
        $html = $this->html($this->request('GET', '/cms/pages/' . $this->page, session: $this->session));

        self::assertStringContainsString('id="page-history-title"', $html);
        self::assertStringContainsString('Text geändert', $html);
        self::assertStringContainsString('href="/cms/pages/' . $this->page . '/history"', $html);
        self::assertStringNotContainsString('fb-change__old', $html, 'The details name the entries only.');
    }

    public function testTheHistoryShowsOldAndNewValues(): void
    {
        $html = $this->html($this->request('GET', '/cms/pages/' . $this->page . '/history', session: $this->session));

        self::assertStringContainsString('Verlauf von Start', $html);
        self::assertMatchesRegularExpression('/class="fb-change__old">.*Willkommen/', $html);
        self::assertMatchesRegularExpression('/class="fb-change__new">.*Hallo Welt/', $html);
        self::assertStringContainsString('Seite angelegt', $html);
        self::assertStringContainsString('<span class="fb-visually-hidden">Nachher: </span>Veröffentlicht</p>', $html, 'The status by its name.');

        $english = $this->html($this->request('GET', '/cms/pages/' . $this->page . '/history?language=en', session: $this->session));
        self::assertStringNotContainsString('Hallo Welt', $english, 'Only changes of the language and of the whole page.');

        self::assertSame(404, $this->request('GET', '/cms/pages/01JZZZZZZZZZZZZZZZZZZZZZZZ/history', session: $this->session)->getStatusCode());
    }

    public function testTheLogFiltersAndIsOnlyForThoseWithTheRight(): void
    {
        $html = $this->html($this->request('GET', '/cms/log', session: $this->session));

        self::assertStringContainsString('<h1 class="fb-heading-1">Protokoll</h1>', $html);
        self::assertStringContainsString('<code>page.update-field</code>', $html);
        self::assertStringContainsString('href="/cms/log"', $html, 'The menu has the log.');

        $filtered = $this->html($this->request('GET', '/cms/log?action=page.publish', session: $this->session));
        self::assertStringNotContainsString('<code>page.update-field</code>', $filtered);
        self::assertStringContainsString('<code>page.publish</code>', $filtered);

        $this->createUser('jane@example.org', ['editor']);
        $editor = $this->signIn('jane@example.org');
        self::assertSame(403, $this->request('GET', '/cms/log', session: $editor)->getStatusCode());
        self::assertStringNotContainsString('href="/cms/log"', $this->html($this->request('GET', '/cms', session: $editor)));
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-history-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }
}
