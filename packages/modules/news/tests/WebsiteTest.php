<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Tests;

use Frootbox\Core\Action\Undo\UndoAction;
use Frootbox\Core\Category\CreateCategory;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Page\UpdatePage;
use Frootbox\Core\Plugin\AssignPlugin;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Settings\UpdateSettings;
use Frootbox\Core\Tag\CreateTag;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\PublishArticles;
use Frootbox\News\Article\UnpublishArticle;
use Frootbox\News\Article\UpdateArticle;
use Frootbox\News\ArticlePlugin;
use Frootbox\News\Blocks\ArticleList;
use Frootbox\News\Blocks\ArticleTeaser;
use Frootbox\News\Feed\Feed;
use Frootbox\News\Feed\FeedHandler;
use Frootbox\News\SpaceChoices;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(ArticleList::class)]
#[CoversClass(ArticleTeaser::class)]
#[CoversClass(ArticlePlugin::class)]
#[CoversClass(Feed::class)]
final class WebsiteTest extends NewsTestCase
{
    private string $start;

    private string $news;

    protected function setUp(): void
    {
        parent::setUp();

        $this->start = $this->page(null, 'Start', [['block' => 'frootbox/news/ArticleTeaser', 'options' => ['count' => 2]]]);
        $this->news = $this->newsPage($this->start, 'Aktuelles', ['perPage' => 2]);
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
        $coffee = $this->runner()->run(new CreateCategory(ArticleStore::CATEGORIES, ['de' => ['title' => 'Kaffee']]));
        $espresso = $this->runner()->run(new CreateCategory(ArticleStore::CATEGORIES, ['de' => ['title' => 'Espresso']], $coffee->id));
        $this->runner()->run(new CreateCategory(ArticleStore::CATEGORIES, ['de' => ['title' => 'Presse']]));
        $this->article(['de' => ['title' => 'Bohnen']], categories: [$coffee->id]);
        $this->article(['de' => ['title' => 'Crema']], categories: [$espresso->id]);
        $this->article(['de' => ['title' => 'Interview']]);

        $html = $this->html('/aktuelles?category=kaffee');

        self::assertStringContainsString('Bohnen', $html);
        self::assertStringContainsString('Crema', $html, 'A category counts with all below it.');
        self::assertStringContainsString('<li data-depth="1"><a class="news-filter__link" href="/aktuelles?category=espresso">Espresso</a></li>', $html);
        self::assertStringNotContainsString('Bohnen', $this->html('/aktuelles?category=espresso'));
        self::assertStringNotContainsString('Interview', $html);
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles?category=kaffee" aria-current="page">Kaffee</a>', $html);
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles">Alle</a>', $html);
        self::assertStringContainsString('Interview', $this->html('/aktuelles?category=unbekannt'), 'An unknown category shows all.');
    }

    public function testCategoriesHavePagesOfTheirOwnWithTheSwitch(): void
    {
        $coffee = $this->runner()->run(new CreateCategory(ArticleStore::CATEGORIES, ['de' => ['title' => 'Kaffee', 'description' => 'Alles über Bohnen und Röstung.']]));
        $espresso = $this->runner()->run(new CreateCategory(ArticleStore::CATEGORIES, ['de' => ['title' => 'Espresso']], $coffee->id));
        $this->article(['de' => ['title' => 'Bohnen']], categories: [$coffee->id]);
        $this->article(['de' => ['title' => 'Crema']], categories: [$espresso->id]);
        $this->article(['de' => ['title' => 'Interview']]);
        $this->runner()->run(new AssignPlugin($this->news, ArticleStore::TYPE, categories: true));
        $this->runner()->run(new PublishPages([$this->news]));

        $html = $this->html('/aktuelles/kaffee');
        self::assertMatchesRegularExpression('~<h1 class="news-list__title">Kaffee</h1>~', $html, 'The category owns the h1 (decision 0243).');
        self::assertStringContainsString('<p class="news-list__intro">Alles über Bohnen und Röstung.</p>', $html);
        self::assertStringContainsString('<title>Kaffee – ', $html);
        self::assertStringContainsString('Bohnen', $html);
        self::assertStringContainsString('Crema', $html, 'With the ones below it.');
        self::assertStringNotContainsString('Interview', $html);
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles/kaffee" aria-current="page">Kaffee</a>', $html, 'The filters lead to the pages of the categories.');
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles/kaffee/espresso">Espresso</a>', $html);
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles">Alle</a>', $html);
        self::assertStringNotContainsString('Bohnen', $this->html('/aktuelles/kaffee/espresso'));
        self::assertStringContainsString('href="/aktuelles/kaffee/espresso">Espresso</a>', $this->html('/aktuelles/crema'), 'The categories of an article too.');
        self::assertStringContainsString('<a class="news-filter__link" href="/aktuelles/kaffee">Kaffee</a>', $this->html('/aktuelles'));
    }

    public function testFiltersByTag(): void
    {
        $this->runner()->run(new CreateTag([], 'featured', true));
        $this->article(['de' => ['title' => 'Bohnen']], '2026-01-10', tags: ['Nachhaltigkeit', 'Barista', 'featured']);
        $this->article(['de' => ['title' => 'Crema']], '2026-02-10', tags: ['barista']);
        $this->article(['de' => ['title' => 'Interview']], '2026-03-10');

        $html = $this->html('/aktuelles?tag=nachhaltigkeit');
        self::assertStringContainsString('Bohnen', $html);
        self::assertStringNotContainsString('Crema', $html);
        self::assertStringContainsString('Artikel mit dem Schlagwort „Nachhaltigkeit“ · <a href="/aktuelles">Alle News</a>', $html);
        self::assertStringContainsString('Crema', $this->html('/aktuelles?tag=barista'), 'Typed in another case, the same tag.');
        self::assertStringContainsString('Interview', $this->html('/aktuelles?tag=featured'), 'Never by an internal tag.');

        $article = $this->html('/aktuelles/bohnen');
        self::assertStringContainsString('<li><a class="news-tags__link" href="/aktuelles?tag=nachhaltigkeit">Nachhaltigkeit</a></li><li><a class="news-tags__link" href="/aktuelles?tag=barista">Barista</a></li>', $article);
        self::assertStringNotContainsString('featured', $article, 'Visitors never see an internal tag.');

        $featured = $this->page($this->start, 'Empfohlen', [['block' => 'frootbox/news/ArticleTeaser', 'options' => ['tag' => 'featured']]]);
        $this->runner()->run(new PublishPages([$featured]));
        $teaser = $this->html('/empfohlen');
        self::assertStringContainsString('Bohnen', $teaser, 'A teaser chooses by a tag, internal ones too.');
        self::assertStringNotContainsString('Interview', $teaser);
    }

    public function testShowsAnArticleAtItsAddress(): void
    {
        $id = $this->article(['de' => ['title' => 'Neue Sorten', 'teaser' => 'Aus Peru.', 'text' => self::text('Frisch geröstet.')]]);

        $html = $this->html('/aktuelles/neue-sorten');

        self::assertStringContainsString('<title>Neue Sorten – Testsite</title>', $html);
        self::assertStringContainsString('<meta name="description" content="Aus Peru.">', $html, 'The teaser describes the article.');
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

    public function testTheFeedListsAsManyArticlesAsSet(): void
    {
        $this->article(['de' => ['title' => 'Erster']], '2026-11-01 09:00');
        $this->article(['de' => ['title' => 'Zweiter']], '2026-11-02 09:00');
        $this->runner()->run(new UpdateSettings('frootbox/news', ['feedItems' => 1]));

        $xml = (string) $this->get(FeedHandler::class)->handle(new ServerRequest('GET', 'https://example.org/_news/feed/' . $this->news . '/de.xml')->withAttribute('page', $this->news)->withAttribute('language', 'de'))->getBody();

        self::assertStringContainsString('<title>Zweiter</title>', $xml);
        self::assertStringNotContainsString('<title>Erster</title>', $xml);
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

    public function testASpaceHasItsArticlesBelowItsOwnPage(): void
    {
        $press = $this->runner()->run(new CreateSpace(ArticleStore::TYPE, 'Presse'))->id;
        $page = $this->newsPage($this->start, 'Presse', space: $press);
        $this->runner()->run(new PublishPages([$page]));
        $this->article(['de' => ['title' => 'Interview']], '2026-11-01', space: $press);
        $this->article(['de' => ['title' => 'Neue Sorten']], '2026-10-01');

        self::assertSame(200, $this->statusOf('/presse/interview'));
        self::assertSame(404, $this->statusOf('/aktuelles/interview'), 'Not below the page of another space.');
        self::assertStringNotContainsString('Neue Sorten', $this->html('/presse'), 'Only the articles of its space.');
        self::assertStringNotContainsString('Interview', $this->html('/aktuelles'));

        $teaser = $this->html('/');
        self::assertStringContainsString('href="/presse/interview"', $teaser, 'A teaser over all spaces links each article below its page.');
        self::assertStringContainsString('href="/aktuelles/neue-sorten"', $teaser);
        self::assertStringContainsString('<a href="/aktuelles">Alle News</a>', $teaser, 'All of them: the page of the default space.');
        self::assertSame([['', 'Alle'], ['default', 'News'], [$press, 'Presse']], array_map(static fn(array $choice): array => [$choice['value'], $choice['label']], $this->runner()->ask(new SpaceChoices())));
    }

    public function testAnArticleMovesToAnotherSpaceWithPublishing(): void
    {
        $press = $this->runner()->run(new CreateSpace(ArticleStore::TYPE, 'Presse'))->id;
        $page = $this->newsPage($this->start, 'Presse', space: $press);
        $this->runner()->run(new PublishPages([$page]));
        $id = $this->article(['de' => ['title' => 'Interview']]);

        // In the draft first, like a page that moves (decision 0244).
        $this->runner()->run(new UpdateArticle($id, space: $press));
        self::assertSame(200, $this->statusOf('/aktuelles/interview'));
        $this->runner()->run(new PublishArticles([$id]));
        self::assertSame(200, $this->statusOf('/presse/interview'));
        self::assertSame(['/presse/interview', 301], $this->redirect('/aktuelles/interview'), 'The old address leads to the new one.');
        self::assertStringContainsString('Interview', $this->html('/presse'));
        self::assertStringNotContainsString('Interview', $this->html('/aktuelles'));

        $this->expectException(\Frootbox\Core\Action\InvalidInputException::class);
        $this->runner()->run(new UpdateArticle($id, space: 'nirgends'));
    }
}
