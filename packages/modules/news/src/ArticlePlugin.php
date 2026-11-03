<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Plugin\Offer;
use Frootbox\Core\Plugin\Plugin;
use Frootbox\News\Article\Articles;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleTranslations;

/**
 * The news as a plugin (decision 0232): a page that shows a space lists
 * its articles at plugin(), each published article has its address below
 * that page, its slug. The teaser and the image describe it for search
 * engines and sharing (decision 0223).
 */
final readonly class ArticlePlugin implements Plugin
{
    public const string LIST_BLOCK = 'frootbox/news/ArticleList';

    public function __construct(
        private ArticleTranslations $translations,
        private Articles $articles,
        private ArticleStore $store,
    ) {}

    public function type(): string
    {
        return ArticleStore::TYPE;
    }

    public function label(): string
    {
        return 'News';
    }

    public function block(): string
    {
        return self::LIST_BLOCK;
    }

    public function details(): Offer
    {
        return Offer::Required;
    }

    public function spaces(): bool
    {
        return true;
    }

    public function paths(string $space): iterable
    {
        $ids = [];

        foreach ($this->articles->fetch(['where' => ['space' => $space]]) as $article) {
            $ids[] = $article->id;
        }

        if ([] === $ids) {
            return;
        }

        $paths = [];

        foreach ($this->translations->fetch(['where' => ['articleId' => $ids], 'order' => 'id']) as $translation) {
            $paths[$translation->articleId][$translation->language] = $translation->slug;
        }

        yield from $paths;
    }

    public function count(string $space): int
    {
        return \count(array_filter($this->store->ids(), fn(string $id): bool => $this->store->current($id)->space === $space));
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
