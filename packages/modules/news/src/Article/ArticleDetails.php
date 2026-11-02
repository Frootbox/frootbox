<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;

/**
 * An article for editors: its draft and its published version.
 */
final readonly class ArticleDetails
{
    /**
     * @param array<string, string> $urls Where visitors find it by language, e.g. {"de": "/aktuelles/neue-sorten"}
     */
    public function __construct(
        public string $id,
        public ArticleStatus $status,
        public ?int $version,
        public ?ArticleData $draft,
        public ?ArticleData $published,
        public ?DateTimeImmutable $publishAt = null,
        public ?DateTimeImmutable $unpublishAt = null,
        public array $urls = [],
    ) {}

    /**
     * The draft, else the published version.
     */
    public function current(): ArticleData
    {
        return $this->draft ?? $this->published ?? new ArticleData(new DateTimeImmutable());
    }
}
