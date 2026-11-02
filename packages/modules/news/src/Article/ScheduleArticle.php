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
use Frootbox\Database\Ulid;

#[AsAction('frootbox/news/article.schedule', 'Plans when the draft of a news article is published and when it goes offline')]
final readonly class ScheduleArticle implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
        #[Description('When the draft is published; left out or null for no time')]
        public ?DateTimeImmutable $publishAt = null,
        #[Description('When the article goes offline; left out or null for no time')]
        public ?DateTimeImmutable $unpublishAt = null,
    ) {}

    public function handle(ArticleEditor $editor): ArticleDetails
    {
        return $editor->schedule('frootbox/news/article.schedule', $this->id, $this->publishAt, $this->unpublishAt);
    }
}
