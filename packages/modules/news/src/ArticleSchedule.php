<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Schedule\ScheduledType;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\PublishArticles;
use Frootbox\News\Article\UnpublishArticle;

/**
 * The scheduler publishes articles and takes them offline at their time.
 */
final readonly class ArticleSchedule implements ScheduledType
{
    public function type(): string
    {
        return ArticleStore::TYPE;
    }

    public function publish(array $ids): Action
    {
        return new PublishArticles($ids);
    }

    public function unpublish(string $id): Action
    {
        return new UnpublishArticle($id);
    }
}
