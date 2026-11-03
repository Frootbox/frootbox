<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Tests;

use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PageHandler;
use Frootbox\Core\Page\UpdateBlock;
use Frootbox\Core\Plugin\AssignPlugin;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Tests\Support\FixtureSite;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Frootbox\News\Article\Articles;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleTranslations;
use Frootbox\News\Article\CreateArticle;
use Frootbox\News\Article\PublishArticles;
use Nyholm\Psr7\ServerRequest;
use Psr\Http\Message\ResponseInterface;

/**
 * A website of the core fixtures with the news installed.
 */
abstract class NewsTestCase extends NotesTestCase
{
    public const string ROOT = __DIR__ . '/..';

    protected function tables(): array
    {
        return [ArticleTranslations::TABLE, Articles::TABLE, 'frootbox_news_article_categories', 'frootbox_news_categories'];
    }

    protected function environment(): Environment
    {
        return Environment::Production;
    }

    protected function extensions(): Extensions
    {
        $news = ExtensionPackage::fromManifest('frootbox/news', (string) realpath(self::ROOT), psr4: ['Frootbox\News\\' => ['src/'], 'Frootbox\News\Migrations\\' => ['migrations/']]);

        return new Extensions([...FixtureSite::extensions('base', 'site')->packages, $news], 'news');
    }

    protected function config(): array
    {
        return ['app' => ['name' => 'Testsite', 'url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }

    /**
     * A page, with the given blocks in its main area.
     *
     * @param list<array<string, mixed>> $blocks
     */
    protected function page(?string $parentId, string $title, array $blocks = [], string $language = 'de'): string
    {
        $content = ['fields' => ['heading' => $title], 'areas' => ['main' => $blocks]];

        return $this->runner()->run(new CreatePage('acme/base/Page', [$language => ['title' => $title, 'content' => $content]], $parentId))->id;
    }

    /**
     * A page that shows the news (decision 0232), with the options of the
     * view of the plugin.
     *
     * @param array<string, mixed> $options
     */
    protected function newsPage(?string $parentId, string $title, array $options = [], string $space = Space::DEFAULT): string
    {
        $id = $this->page($parentId, $title);
        $details = $this->runner()->run(new AssignPlugin($id, ArticleStore::TYPE, $space));

        if ([] !== $options) {
            foreach ($details->draft->translations ?? [] as $language => $translation) {
                $view = $translation->content['plugin'] ?? null;

                if (\is_array($view) && \is_string($view['id'] ?? null)) {
                    $this->runner()->run(new UpdateBlock($id, $language, $view['id'], options: $options));
                }
            }
        }

        return $id;
    }

    /**
     * A published article.
     *
     * @param array<string, mixed> $translations
     * @param list<string>         $categories
     * @param list<string>         $tags
     */
    protected function article(array $translations, string $date = '2026-11-02 09:00', array $categories = [], bool $publish = true, string $space = Space::DEFAULT, array $tags = []): string
    {
        $details = $this->runner()->run(new CreateArticle($translations, new \DateTimeImmutable($date), categories: $categories, space: $space, tags: $tags));

        if ($publish) {
            $this->runner()->run(new PublishArticles([$details->id]));
        }

        return $details->id;
    }

    protected function request(string $path): ResponseInterface
    {
        return $this->get(PageHandler::class)->handle(new ServerRequest('GET', 'https://example.org' . $path));
    }

    protected function html(string $path): string
    {
        return (string) $this->request($path)->getBody();
    }

    protected function statusOf(string $path): int
    {
        try {
            return $this->request($path)->getStatusCode();
        } catch (HttpException $error) {
            return $error->status;
        }
    }

    /**
     * @return array{string, int}
     */
    protected function redirect(string $path): array
    {
        $response = $this->request($path);

        return [$response->getHeaderLine('Location'), $response->getStatusCode()];
    }

    /**
     * Rich text with one paragraph.
     *
     * @return array<string, mixed>
     */
    protected static function text(string $paragraph): array
    {
        return ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $paragraph]]]]];
    }
}
