<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Url\DescribedSubpages;
use Frootbox\News\Article\Articles;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleTranslations;

/**
 * Each published article has an address below the first page with the
 * list of articles, its slug (decision 0219). The teaser and the image
 * describe it for search engines and sharing (decision 0223).
 */
final readonly class ArticlePages implements DescribedSubpages
{
    public const string LIST_BLOCK = 'frootbox/news/ArticleList';

    public function __construct(
        private ArticleTranslations $translations,
        private Articles $articles,
    ) {}

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

    public function description(string $id, string $language): ?string
    {
        return $this->translations->fetchOne(['where' => ['articleId' => $id, 'language' => $language]])?->teaser;
    }

    public function image(string $id, string $language): ?array
    {
        $image = $this->articles->fetchById($id)?->image;
        $media = $image['media'] ?? null;

        if (!\is_string($media) || '' === $media) {
            return null;
        }

        $alt = $image['alt'] ?? null;

        return \is_string($alt) ? ['media' => $media, 'alt' => $alt] : ['media' => $media];
    }
}
