<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Backend\Screen;
use Frootbox\Backend\SearchCommand;
use Frootbox\Backend\SearchLink;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\View\BuildingHead;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\CreateArticle;
use Frootbox\News\Article\DeleteArticle;
use Frootbox\News\Article\DiscardArticle;
use Frootbox\News\Article\ListArticles;
use Frootbox\News\Article\PublishArticles;
use Frootbox\News\Article\ScheduleArticle;
use Frootbox\News\Article\ShowArticle;
use Frootbox\News\Article\UnpublishArticle;
use Frootbox\News\Article\UpdateArticle;
use Frootbox\News\Backend\ArticleHandler;
use Frootbox\News\Backend\ArticlesHandler;
use Frootbox\News\Backend\CategoriesHandler;
use Frootbox\News\Category\CreateCategory;
use Frootbox\News\Category\DeleteCategory;
use Frootbox\News\Category\ListCategories;
use Frootbox\News\Category\UpdateCategory;
use Frootbox\News\Feed\Feed;
use Frootbox\News\Feed\FeedHandler;
use Frootbox\News\Feed\FeedLink;

/**
 * News as a plugin (decisions 0219, 0232): articles with drafts in
 * spaces, their addresses below the page that shows the space, the scheduler, the search and
 * the feed. The screens come only with the backend.
 */
final class NewsExtension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->action(CreateArticle::class);
        $registry->action(UpdateArticle::class);
        $registry->action(PublishArticles::class);
        $registry->action(UnpublishArticle::class);
        $registry->action(ScheduleArticle::class);
        $registry->action(DiscardArticle::class);
        $registry->action(DeleteArticle::class);
        $registry->query(ListArticles::class);
        $registry->query(ShowArticle::class);
        $registry->action(CreateCategory::class);
        $registry->action(UpdateCategory::class);
        $registry->action(DeleteCategory::class);
        $registry->query(ListCategories::class);
        $registry->query(SpaceChoices::class);

        $registry->plugin(ArticlePlugin::class);
        $registry->scheduled(ArticleSchedule::class);
        $registry->searchSource(ArticleSource::class);
        $registry->settings(NewsSettings::class);

        $registry->get(Feed::ROUTE, FeedHandler::class, 'frootbox.news.feed');
        $registry->listen(BuildingHead::class, FeedLink::class);

        if (class_exists(Screen::class)) {
            $this->backend($registry);
        }
    }

    /**
     * The screens in the backend (decision 0220), only if it is installed.
     */
    private function backend(Registry $registry): void
    {
        $registry->mount('backend.path', '/cms')
            ->get('/news', ArticlesHandler::class, 'frootbox.news.articles')
            ->get('/news/new', ArticleHandler::class, 'frootbox.news.articles.new')
            ->get('/news/categories', CategoriesHandler::class, 'frootbox.news.articles.categories')
            ->get('/news/{id:[0-9A-Za-z]{26}}', ArticleHandler::class, 'frootbox.news.articles.show');

        $registry->add(Screen::class, new Screen('News', 'frootbox.news.articles', Screen::CONTENT, 'news', ArticlesHandler::PERMISSION, order: 15));
        $registry->add(SearchLink::class, new SearchLink(ArticleStore::TYPE, 'frootbox.news.articles.show', 'id', 'news'));
        $registry->add(SearchCommand::class, new SearchCommand('New article', 'frootbox.news.articles.new', 'frootbox/news/article.create'));
    }
}
