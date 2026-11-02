<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Tests;

use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\User\CreateRole;
use Frootbox\News\Article\ArticleCategories;
use Frootbox\News\Article\Articles;
use Frootbox\News\Article\ArticleTranslations;
use Frootbox\News\Backend\ArticleHandler;
use Frootbox\News\Backend\ArticlesHandler;
use Frootbox\News\Backend\CategoriesHandler;
use Frootbox\News\Category\Categories;
use Frootbox\News\Category\CategoryEditor;
use Frootbox\News\NewsExtension;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(ArticlesHandler::class)]
#[CoversClass(ArticleHandler::class)]
#[CoversClass(CategoriesHandler::class)]
#[CoversClass(CategoryEditor::class)]
#[CoversClass(NewsExtension::class)]
final class BackendTest extends BackendTestCase
{
    protected function tables(): array
    {
        return [ArticleCategories::TABLE, ArticleTranslations::TABLE, Articles::TABLE, Categories::TABLE];
    }

    protected function extensions(): Extensions
    {
        $news = ExtensionPackage::fromManifest('frootbox/news', (string) realpath(NewsTestCase::ROOT), psr4: ['Frootbox\News\\' => ['src/'], 'Frootbox\News\Migrations\\' => ['migrations/']]);

        return new Extensions([self::backend(), $news], 'news-backend');
    }

    protected function config(): array
    {
        return ['languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }

    public function testEditorsWriteAndPublishArticles(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $list = $this->html($this->request('GET', '/cms/news', session: $session));
        self::assertStringContainsString('href="/cms/news" aria-current="page"', $list, 'The sidebar has the screen.');
        self::assertStringContainsString('href="/cms/news/new"', $list);
        self::assertStringContainsString('Noch keine Artikel', $list);

        $new = $this->html($this->request('GET', '/cms/news/new', session: $session));
        self::assertStringContainsString('<fb-form action="frootbox/news/article.create" next="/cms/news/{id}"', $new);
        self::assertStringContainsString('<fb-rich-text', $new);
        self::assertStringContainsString('<fb-image-input', $new);
        self::assertStringContainsString('src="/cms/queries/media.list"', $new);

        $category = $this->id($this->action('frootbox/news/category.create', ['translations' => ['de' => ['title' => 'Presse'], 'en' => ['title' => '', 'slug' => '']]], $session));
        $created = $this->action('frootbox/news/article.create', [
            'translations' => ['de' => ['title' => 'Neue Sorten', 'teaser' => 'Frisch geröstet.', 'text' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Fruchtig.']]]]]]],
            'date' => null,
            'image' => [],
            'categories' => [$category],
        ], $session);
        $id = $this->id($created);

        $show = $this->html($this->request('GET', '/cms/news/' . $id, session: $session));
        self::assertStringContainsString('<h1 class="fb-heading-1" tabindex="-1" data-fb-focus>Neue Sorten</h1>', $show);
        self::assertStringContainsString('name="translations.de.slug"', $show);
        self::assertStringContainsString('value="neue-sorten"', $show);
        self::assertStringContainsString('&quot;text&quot;:&quot;Fruchtig.&quot;', $show, 'The text goes to <fb-rich-text> as JSON.');
        self::assertMatchesRegularExpression('/name="categories\[\]"[^>]*value="' . $category . '"[^>]*checked/', $show);
        self::assertStringContainsString('<fb-form action="frootbox/news/article.publish"', $show);
        self::assertStringContainsString('commandfor="article-discard"', $show);
        self::assertStringNotContainsString('commandfor="article-unpublish"', $show, 'A draft cannot go offline.');

        $english = $this->html($this->request('GET', '/cms/news/' . $id . '?language=en', session: $session));
        self::assertStringContainsString('Noch keine Fassung in English', $english);
        self::assertStringContainsString('name="translations.en.title" value="Neue Sorten"', $english);

        $this->action('frootbox/news/article.publish', ['ids' => [$id]], $session);
        $published = $this->html($this->request('GET', '/cms/news/' . $id, session: $session));
        self::assertStringNotContainsString('<fb-form action="frootbox/news/article.publish"', $published);
        self::assertStringContainsString('commandfor="article-unpublish"', $published);

        $list = $this->html($this->request('GET', '/cms/news', session: $session));
        self::assertStringContainsString('href="/cms/news/' . $id . '">Neue Sorten</a>', $list);
        self::assertStringNotContainsString('Neue Sorten', $this->html($this->request('GET', '/cms/news?q=kaffee', session: $session)));

        $categories = $this->html($this->request('GET', '/cms/news/categories', session: $session));
        self::assertStringContainsString('<fb-form action="frootbox/news/category.update"', $categories);
        self::assertStringContainsString('value="presse"', $categories);
        self::assertStringContainsString('<fb-form action="frootbox/news/category.create"', $categories);
    }

    public function testAnEmptyLanguageOfACategoryIsNone(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $created = $this->action('frootbox/news/category.create', ['translations' => ['de' => ['title' => 'Termine'], 'en' => ['title' => 'Events']]], $session);
        $updated = $this->action('frootbox/news/category.update', ['id' => $this->id($created), 'translations' => ['de' => ['title' => 'Termine', 'slug' => 'termine'], 'en' => ['title' => '', 'slug' => '']]], $session);
        $translations = $this->data($updated, 'translations');
        self::assertIsArray($translations);
        self::assertSame(['de'], array_keys($translations));

        $error = $this->action('frootbox/news/category.create', ['translations' => ['de' => ['title' => '', 'slug' => '']]], $session, 422);
        self::assertStringContainsString('"pointer":"\\/translations\\/de\\/title"', json_encode($error, \JSON_THROW_ON_ERROR));
    }

    public function testOthersSeeNoNews(): void
    {
        $this->runner()->run(new CreateRole('guest-writer', 'Writer', ['page.tree']), Context::system());
        $this->createUser('writer@example.org', ['guest-writer']);
        $session = $this->signIn('writer@example.org');

        self::assertStringNotContainsString('href="/cms/news"', $this->html($this->request('GET', '/cms', session: $session)));
        self::assertSame(403, $this->request('GET', '/cms/news', session: $session)->getStatusCode());
    }

    /**
     * @param array<mixed> $answer
     */
    private function id(array $answer): string
    {
        $id = $this->data($answer, 'id');
        self::assertIsString($id);

        return $id;
    }

    /**
     * @param array<mixed> $answer
     *
     * @return mixed a value of the result
     */
    private function data(array $answer, string $key): mixed
    {
        self::assertIsArray($answer['data'] ?? null);

        return $answer['data'][$key] ?? null;
    }
}
