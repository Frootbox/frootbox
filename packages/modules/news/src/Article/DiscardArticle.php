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
 * @implements Action<ArticleDetails|null>
 */
#[AsAction('frootbox/news/article.discard', 'Throws away the draft of a news article; one that was never published is gone then')]
final readonly class DiscardArticle implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    public function handle(ArticleEditor $editor): ?ArticleDetails
    {
        return $editor->discard('frootbox/news/article.discard', $this->id);
    }
}
