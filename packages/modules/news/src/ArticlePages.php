<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Url\SubpageSource;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleTranslations;

/**
 * Each published article has an address below the first page with the
 * list of articles, its slug (decision 0219).
 */
final readonly class ArticlePages implements SubpageSource
{
    public const string LIST_BLOCK = 'frootbox/news/ArticleList';

    public function __construct(private ArticleTranslations $translations) {}

    public function type(): string
    {
        return ArticleStore::TYPE;
    }

    public function blocks(): array
    {
        return [self::LIST_BLOCK];
    }

    public function paths(): iterable
    {
        $paths = [];

        foreach ($this->translations->fetch(['order' => 'id']) as $translation) {
            $paths[$translation->articleId][$translation->language] = $translation->slug;
        }

        yield from $paths;
    }

    public function title(string $id, string $language): ?string
    {
        return $this->translations->fetchOne(['where' => ['articleId' => $id, 'language' => $language]])?->title;
    }
}
