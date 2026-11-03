<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;

/**
 * @implements Action<ArticleDetails>
 */
#[AsAction('frootbox/news/article.schedule', 'Plans when the draft of a news article is published and when it goes offline')]
final readonly class ScheduleArticle implements Action, Scoped
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
        #[Description('When the draft is published; left out or null for no time')]
        public ?DateTimeImmutable $publishAt = null,
        #[Description('When the article goes offline; left out or null for no time')]
        public ?DateTimeImmutable $unpublishAt = null,
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

    public function handle(ArticleEditor $editor): ArticleDetails
    {
        return $editor->schedule('frootbox/news/article.schedule', $this->id, $this->publishAt, $this->unpublishAt);
    }
}
