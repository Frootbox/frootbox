<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Tests;

use DateTimeImmutable;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Schedule\Scheduler;
use Frootbox\Core\Search\Search;
use Frootbox\Core\Url\Urls;
use Frootbox\Core\User\Roles;
use Frootbox\News\Article\ArticleDetails;
use Frootbox\News\Article\ArticleEditor;
use Frootbox\News\Article\Articles;
use Frootbox\News\Article\ArticleStatus;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleTranslations;
use Frootbox\News\Article\CreateArticle;
use Frootbox\News\Article\DeleteArticle;
use Frootbox\News\Article\DiscardArticle;
use Frootbox\News\Article\ListArticles;
use Frootbox\News\Article\PublishArticles;
use Frootbox\News\Article\ScheduleArticle;
use Frootbox\News\Article\ShowArticle;
use Frootbox\News\Article\UnpublishArticle;
use Frootbox\News\Article\UpdateArticle;
use Frootbox\News\ArticleSource;
use Frootbox\News\Category\Categories;
use Frootbox\News\Category\CategoryEditor;
use Frootbox\News\Category\CreateCategory;
use Frootbox\News\Category\DeleteCategory;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(ArticleSource::class)]
#[CoversClass(ArticleEditor::class)]
#[CoversClass(ArticleStore::class)]
#[CoversClass(CategoryEditor::class)]
final class ArticlesTest extends NewsTestCase
{
    public function testCreatesADraftAndPublishesIt(): void
    {
        $details = $this->create(['de' => ['title' => 'Neue Sorten', 'teaser' => 'Drei Bohnen aus Peru.', 'text' => self::text('Frisch geröstet.')]]);

        self::assertSame(ArticleStatus::Draft, $details->status);
        self::assertSame('neue-sorten', $details->draft?->translations['de']->slug, 'The slug comes from the title.');
        self::assertNull($this->get(Articles::class)->fetchById($details->id), 'A draft is not in the table.');

        $published = $this->runner()->run(new PublishArticles([$details->id]));
        self::assertSame(ArticleStatus::Published, $published[0]->status);
        self::assertSame(1, $published[0]->version);
        self::assertSame('Drei Bohnen aus Peru.', $this->get(ArticleTranslations::class)->of($details->id)['de']->teaser);

        $this->runner()->run(new UpdateArticle($details->id, ['de' => ['title' => 'Neue Sorten aus Peru']]));
        $shown = $this->runner()->ask(new ShowArticle($details->id));
        self::assertSame(ArticleStatus::Changed, $shown->status);
        self::assertSame('neue-sorten', $shown->draft?->translations['de']->slug, 'The slug stays when only the title changes.');
        self::assertSame('Drei Bohnen aus Peru.', $shown->draft->translations['de']->teaser, 'What is left out stays.');
        self::assertSame('Neue Sorten', $this->get(ArticleTranslations::class)->of($details->id)['de']->title, 'Visitors see the published version.');
    }

    public function testDraftsMayBeUnfinishedButPublishingChecksThem(): void
    {
        $details = $this->create(['de' => ['title' => '']]);

        try {
            $this->runner()->run(new PublishArticles([$details->id]));
            self::fail('An article without a title is not published.');
        } catch (InvalidInputException $error) {
            self::assertSame(['/ids/0/translations/de/title', '/ids/0/translations/de/slug'], array_keys($error->errors));
        }

        $this->expectException(InvalidInputException::class);
        $this->create(['fr' => ['title' => 'Nouvelles']]);
    }

    public function testSlugsAreUniqueInALanguage(): void
    {
        $this->article(['de' => ['title' => 'Neue Sorten']]);
        $this->create(['en' => ['title' => 'Neue Sorten']]);

        try {
            $this->create(['de' => ['title' => 'Neue Sorten']]);
            self::fail('Two articles cannot share a slug.');
        } catch (InvalidInputException $error) {
            self::assertArrayHasKey('/translations/de/slug', $error->errors);
        }
    }

    public function testTakesOfflineDiscardsAndDeletes(): void
    {
        $id = $this->article(['de' => ['title' => 'Neue Sorten']]);

        $details = $this->runner()->run(new UnpublishArticle($id));
        self::assertSame(ArticleStatus::Draft, $details->status, 'Offline it stays as a draft.');
        self::assertNull($this->get(Articles::class)->fetchById($id));

        $this->runner()->run(new PublishArticles([$id]));
        $this->runner()->run(new UpdateArticle($id, ['de' => ['title' => 'Anders']]));
        $kept = $this->runner()->run(new DiscardArticle($id));
        self::assertInstanceOf(ArticleDetails::class, $kept);
        self::assertSame(ArticleStatus::Published, $kept->status);

        $this->runner()->run(new DeleteArticle($id));
        self::assertNull($this->get(Articles::class)->fetchById($id));
        self::assertSame([], $this->get(ArticleStore::class)->ids());

        $draft = $this->create(['de' => ['title' => 'Nur Entwurf']]);
        self::assertNull($this->runner()->run(new DiscardArticle($draft->id)), 'Never published: gone.');
    }

    public function testListsArticlesNewestFirst(): void
    {
        $this->article(['de' => ['title' => 'Älter']], '2025-06-01');
        $this->article(['de' => ['title' => 'Neuer'], 'en' => ['title' => 'Newer']], '2026-10-01');
        $this->create(['de' => ['title' => 'Entwurf']], '2026-11-01');

        $list = $this->runner()->ask(new ListArticles('de'));
        self::assertSame(['Entwurf', 'Neuer', 'Älter'], array_map(static fn($item): string => $item->title, $list->items));
        self::assertSame(['de', 'en'], $list->items[1]->languages);
        self::assertSame(ArticleStatus::Draft, $list->items[0]->status);

        $found = $this->runner()->ask(new ListArticles('de', 'neu'));
        self::assertSame(1, $found->total);
    }

    public function testCategoriesAreCheckedAndDeletedCategoriesDropOut(): void
    {
        $coffee = $this->runner()->run(new CreateCategory(['de' => ['title' => 'Kaffee']]));
        self::assertSame('kaffee', $coffee->slug('de'));

        try {
            $this->runner()->run(new CreateCategory(['de' => ['title' => 'Kaffee']]));
            self::fail('Two categories cannot share a slug.');
        } catch (InvalidInputException $error) {
            self::assertArrayHasKey('/translations/de/slug', $error->errors);
        }

        try {
            $this->create(['de' => ['title' => 'Neue Sorten']], categories: ['01JNOCATEGORY0000000000000']);
            self::fail('Unknown categories are refused.');
        } catch (InvalidInputException $error) {
            self::assertArrayHasKey('/categories/0', $error->errors);
        }

        $id = $this->article(['de' => ['title' => 'Neue Sorten']], categories: [$coffee->id]);
        $this->runner()->run(new DeleteCategory($coffee->id));

        self::assertSame([], $this->get(Categories::class)->all());
        $this->runner()->run(new UpdateArticle($id, ['de' => ['teaser' => 'Neu']]));
        $published = $this->runner()->run(new PublishArticles([$id]));
        self::assertCount(1, $published, 'A deleted category does not keep the article from being published.');
    }

    public function testTheSchedulerPublishesArticles(): void
    {
        $details = $this->create(['de' => ['title' => 'Später']]);
        $this->runner()->run(new ScheduleArticle($details->id, new DateTimeImmutable('+1 hour')));

        $result = $this->get(Scheduler::class)->run(new DateTimeImmutable('+2 hours'));

        self::assertSame([$details->id], $result->published);
        self::assertNotNull($this->get(Articles::class)->fetchById($details->id));
    }

    public function testArticlesAreFoundAndEditorsMayChangeThem(): void
    {
        $page = $this->page(null, 'Start', [['block' => 'frootbox/news/ArticleList']]);
        $this->runner()->run(new PublishPages([$page]));
        $id = $this->article(['de' => ['title' => 'Neue Sorten', 'text' => self::text('Geröstet in Hamburg')]]);

        $hits = $this->runner()->ask(new Search('hamburg'));
        self::assertSame(['frootbox/news/article'], array_values(array_unique(array_map(static fn($hit): string => $hit->source, $hits))));
        self::assertSame($id, $hits[0]->item);
        self::assertSame('/neue-sorten', $this->get(Urls::class)->path(ArticleStore::target($id), 'de'));

        $published = iterator_to_array($this->get(ArticleSource::class)->published([$id]), false);
        self::assertCount(1, $published, 'The published version, for the search on the website.');
        self::assertSame(['Neue Sorten', 'de', ArticleStore::target($id)], [$published[0]->title, $published[0]->language, (string) $published[0]->target]);
        self::assertStringContainsString('Geröstet in Hamburg', $published[0]->text);

        $editor = $this->get(Roles::class)->fetchOne(['where' => ['name' => 'editor']]);
        self::assertNotNull($editor);
        self::assertContains('frootbox/news/*', $editor->permissions);
    }

    /**
     * @param array<string, mixed> $translations
     * @param list<string>         $categories
     */
    private function create(array $translations, string $date = '2026-11-02 09:00', array $categories = []): ArticleDetails
    {
        $details = $this->runner()->run(new CreateArticle($translations, new DateTimeImmutable($date), categories: $categories));

        return $details;
    }
}
