<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Tests;

use Frootbox\Core\Action\Undo\UndoAction;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Page\UpdatePage;
use Frootbox\News\Article\PublishArticles;
use Frootbox\News\Article\UnpublishArticle;
use Frootbox\News\Article\UpdateArticle;
use Frootbox\News\ArticlePages;
use Frootbox\News\Blocks\ArticleList;
use Frootbox\News\Blocks\ArticleTeaser;
use Frootbox\News\Category\CreateCategory;
use Frootbox\News\Feed\Feed;
use Frootbox\News\Feed\FeedHandler;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(ArticleList::class)]
#[CoversClass(ArticleTeaser::class)]
#[CoversClass(ArticlePages::class)]
#[CoversClass(Feed::class)]
final class WebsiteTest extends NewsTestCase
{
    private string $start;

    private string $news;

    protected function setUp(): void
    {
        parent::setUp();

        $this->start = $this->page(null, 'Start', [['block' => 'frootbox/news/ArticleTeaser', 'options' => ['count' => 2]]]);
        $this->news = $this->page($this->start, 'Aktuelles', [['block' => 'frootbox/news/ArticleList', 'options' => ['perPage' => 2]]]);
        $this->runner()->run(new PublishPages([$this->start, $this->news]));
    }

    public function testListsTheArticlesPageByPage(): void
    {
        $this->article(['de' => ['title' => 'Erstes', 'teaser' => 'Der Anfang.']], '2026-01-10');
        $this->article(['de' => ['title' => 'Zweites']], '2026-05-10');
        $this->article(['de' => ['title' => 'Drittes']], '2026-09-10');

        $html = $this->html('/aktuelles');
        self::assertMatchesRegularExpression('~<h\d class="news-teaser__title"><a href="/aktuelles/drittes">Drittes</a></h\d>~', $html, 'The title links to the article.');
        self::assertStringContainsString('<time datetime="2026-09-10T00:00:00', $html);
        self::assertStringContainsString('10. September 2026', $html, 'The date in German.');
        self::assertStringNotContainsString('Erstes', $html, 'Two per page.');
        self::assertStringContainsString('href="/aktuelles?page=2" rel="next"', $html);
        self::assertStringContainsString('Seite 1 von 2', $html);

        $second = $this->html('/aktuelles?page=2');
        self::assertStringContainsString('Erstes', $second);
        self::assertStringContainsString('Der Anfang.', $second);
        self::assertStringContainsString('href="/aktuelles" rel="prev"', $second);
        self::assertStringContainsString('Erstes', $this->html('/aktuelles?year=2026&page=2'));
        self::assertStringContainsString('Zu dieser Auswahl gibt es keine Artikel.', $this->html('/aktuelles?year=2025'));
    }

    public function testFiltersByCategory(): void
    {
        $coffee = $this->runner()->run(new CreateCategory(['de' => ['title' => 'Kaffee']]));
        $this->runner()->run(new CreateCategory(['de' => ['title' => 'Presse']]));
        $this->article(['de' => ['title' => 'Bohnen']], categories: [$coffee->id]);
        $this->article(['de' => ['title' => 'Interview']]);

        $html = $this->html('/aktuelles?category=kaffee');

        self::assertStringContainsString('Bohnen', $html);
        self::assertStringNotContainsString('Interview', $html);
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles?category=kaffee" aria-current="page">Kaffee</a>', $html);
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles">Alle</a>', $html);
        self::assertStringContainsString('Interview', $this->html('/aktuelles?category=unbekannt'), 'An unknown category shows all.');
    }

    public function testShowsAnArticleAtItsAddress(): void
    {
        $id = $this->article(['de' => ['title' => 'Neue Sorten', 'teaser' => 'Aus Peru.', 'text' => self::text('Frisch geröstet.')]]);

        $html = $this->html('/aktuelles/neue-sorten');
        file_put_contents('/private/tmp/claude-501/-Users-habbo-Sites-frootbox2/e248f974-7e5b-4fd0-bcdc-ec6e7c3c818c/scratchpad/detail.html', $html);
        file_put_contents('/private/tmp/claude-501/-Users-habbo-Sites-frootbox2/e248f974-7e5b-4fd0-bcdc-ec6e7c3c818c/scratchpad/list.html', $this->html('/aktuelles'));

        self::assertStringContainsString('<title>Neue Sorten – Testsite</title>', $html);
        self::assertStringContainsString('<link rel="canonical" href="https://example.org/aktuelles/neue-sorten">', $html);
        self::assertMatchesRegularExpression('~<h\d class="news-article__title">Neue Sorten</h\d>~', $html);
        self::assertStringContainsString('<p>Frisch geröstet.</p>', $html);
        self::assertStringContainsString('<a href="/aktuelles">Alle News</a>', $html);
        self::assertStringNotContainsString('news-list', $html, 'Not the list.');
        self::assertSame(404, $this->statusOf('/aktuelles/alte-sorten'));

        $this->runner()->run(new UpdateArticle($id, ['de' => ['slug' => 'sorten-aus-peru']]));
        $this->runner()->run(new PublishArticles([$id]));
        self::assertSame(['/aktuelles/sorten-aus-peru', 301], $this->redirect('/aktuelles/neue-sorten'));

        $this->runner()->run(new UpdatePage($this->news, ['de' => ['slug' => 'news']]));
        $this->runner()->run(new PublishPages([$this->news]));
        self::assertSame(['/news/sorten-aus-peru', 301], $this->redirect('/aktuelles/sorten-aus-peru'));

        $this->runner()->run(new UnpublishArticle($id));
        self::assertSame(410, $this->statusOf('/news/sorten-aus-peru'));
    }

    public function testPublishingCanBeUndone(): void
    {
        $id = $this->article(['de' => ['title' => 'Neue Sorten']], publish: false);
        $this->runner()->run(new PublishArticles([$id]));
        self::assertSame(200, $this->statusOf('/aktuelles/neue-sorten'));

        $this->runner()->run(new UndoAction($this->lastEntry()->id));

        self::assertSame(404, $this->statusOf('/aktuelles/neue-sorten'), 'The address is gone again.');
        self::assertStringNotContainsString('Neue Sorten', $this->html('/aktuelles'));
    }

    public function testTheTeaserShowsTheNewestArticles(): void
    {
        $this->article(['de' => ['title' => 'Erstes']], '2026-01-10');
        $this->article(['de' => ['title' => 'Zweites']], '2026-05-10');
        $this->article(['de' => ['title' => 'Drittes']], '2026-09-10');

        $html = $this->html('/');

        self::assertStringContainsString('Drittes', $html);
        self::assertStringContainsString('Zweites', $html);
        self::assertStringNotContainsString('Erstes', $html);
        self::assertStringContainsString('<a href="/aktuelles">Alle News</a>', $html);
    }

    public function testOffersAFeed(): void
    {
        $this->article(['de' => ['title' => 'Neue Sorten & mehr', 'teaser' => 'Aus Peru.']], '2026-11-02 09:00');

        self::assertStringContainsString('<link rel="alternate" type="application/rss+xml" title="Aktuelles – Testsite" href="/_news/feed/' . $this->news . '/de.xml">', $this->html('/aktuelles'));
        self::assertStringNotContainsString('application/rss+xml', $this->html('/'), 'Only on the page with the list.');

        $response = $this->get(FeedHandler::class)->handle(new ServerRequest('GET', 'https://example.org/_news/feed/' . $this->news . '/de.xml')->withAttribute('page', $this->news)->withAttribute('language', 'de'));
        $xml = (string) $response->getBody();

        self::assertSame('application/rss+xml; charset=utf-8', $response->getHeaderLine('Content-Type'));
        self::assertNotFalse(simplexml_load_string($xml), 'Well-formed XML.');
        self::assertStringContainsString('<title>Neue Sorten &amp; mehr</title>', $xml);
        self::assertStringContainsString('<link>https://example.org/aktuelles/neue-sorten-mehr</link>', $xml);
        self::assertStringContainsString('<description>Aus Peru.</description>', $xml);

        $this->expectException(HttpException::class);
        $this->get(FeedHandler::class)->handle(new ServerRequest('GET', 'https://example.org/')->withAttribute('page', $this->start)->withAttribute('language', 'de'));
    }
}
