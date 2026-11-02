<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\ListOf;

/**
 * @implements Action<list<ArticleDetails>>
 */
#[AsAction('frootbox/news/article.publish', 'Publishes the drafts of one or more news articles')]
final readonly class PublishArticles implements Action
{
    /**
     * @param list<string> $ids
     */
    public function __construct(
        #[ListOf('string')]
        public array $ids,
    ) {}

    /**
     * @return list<ArticleDetails>
     */
    public function handle(ArticleEditor $editor): array
    {
        return $editor->publish('frootbox/news/article.publish', $this->ids);
    }
}
