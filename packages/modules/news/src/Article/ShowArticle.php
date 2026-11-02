<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;

#[AsQuery('frootbox/news/article.show', 'Returns a news article with its draft, its published version and where visitors find it')]
final readonly class ShowArticle implements Query
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    public function handle(ArticleStore $store): ArticleDetails
    {
        return $store->details($this->id, true);
    }
}
