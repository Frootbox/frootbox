<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;

/**
 * @implements Action<ArticleDetails>
 */
#[AsAction('frootbox/news/article.unpublish', 'Takes a news article offline; it stays as a draft and can be published again')]
final readonly class UnpublishArticle implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    public function handle(ArticleEditor $editor): ArticleDetails
    {
        return $editor->unpublish('frootbox/news/article.unpublish', $this->id);
    }
}
