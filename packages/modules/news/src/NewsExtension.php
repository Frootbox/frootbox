<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\View\BuildingHead;
use Frootbox\News\Article\CreateArticle;
use Frootbox\News\Article\DeleteArticle;
use Frootbox\News\Article\DiscardArticle;
use Frootbox\News\Article\ListArticles;
use Frootbox\News\Article\PublishArticles;
use Frootbox\News\Article\ScheduleArticle;
use Frootbox\News\Article\ShowArticle;
use Frootbox\News\Article\UnpublishArticle;
use Frootbox\News\Article\UpdateArticle;
use Frootbox\News\Category\CreateCategory;
use Frootbox\News\Category\DeleteCategory;
use Frootbox\News\Category\ListCategories;
use Frootbox\News\Category\UpdateCategory;
use Frootbox\News\Feed\Feed;
use Frootbox\News\Feed\FeedHandler;
use Frootbox\News\Feed\FeedLink;

/**
 * News as a plugin (decisions 0027, 0219): articles with drafts, their
 * addresses below the page with the list, the scheduler, the search and
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

        $registry->subpages(ArticlePages::class);
        $registry->scheduled(ArticleSchedule::class);
        $registry->searchSource(ArticleSource::class);

        $registry->get(Feed::ROUTE, FeedHandler::class, 'frootbox.news.feed');
        $registry->listen(BuildingHead::class, FeedLink::class);
    }
}
