<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;

/**
 * @implements Query<ArticleDetails>
 */
#[AsQuery('frootbox/news/article.show', 'Returns a news article with its draft, its published version and where visitors find it')]
final readonly class ShowArticle implements Query, Scoped
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * The object within its space (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [SpaceScopes::object(ArticleStore::TYPE, $this->id)];
    }

    public function handle(ArticleStore $store): ArticleDetails
    {
        return $store->details($this->id, true);
    }
}
