<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;

/**
 * An article in the list of the backend.
 */
final readonly class ArticleSummary
{
    /**
     * @param list<string> $languages The languages it has, in the draft if there is one
     */
    public function __construct(
        public string $id,
        public ArticleStatus $status,
        public string $title,
        public DateTimeImmutable $date,
        public array $languages,
        public ?DateTimeImmutable $publishAt = null,
        public ?DateTimeImmutable $unpublishAt = null,
    ) {}
}
