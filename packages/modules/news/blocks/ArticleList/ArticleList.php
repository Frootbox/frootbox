<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Blocks;

use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;
use Frootbox\Core\Url\Urls;
use Frootbox\News\Article\ArticleRendering;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleView;
use Frootbox\News\Article\PublishedArticles;
use Frootbox\News\Category\Categories;
use Frootbox\News\Feed\Feed;

/**
 * The list of articles, page by page, by category and year. Below the
 * first page with this block each article has its address, there the
 * block shows the article instead (decision 0219).
 */
final readonly class ArticleList implements BlockController
{
    public function __construct(
        private PublishedArticles $articles,
        private Categories $categories,
        private ArticleRendering $rendering,
        private Urls $urls,
        private Feed $feed,
    ) {}

    public function data(BlockContext $context): array
    {
        $language = $context->contentLanguage;
        $base = null === $context->target ? '' : $this->urls->href($context->target, $context->language) ?? '';
        $subpage = $context->subpage;

        if (null !== $subpage && ArticleStore::TYPE === $subpage->target->type) {
            $article = $this->articles->find($subpage->target->id, $language);

            if (null !== $article) {
                return ['article' => $this->withLinks($this->rendering->detail($article, $context->language), $base), 'back' => $base];
            }
        }

        $category = self::text($context->query('category'));
        $category = null === $category ? null : $this->categories->bySlug($language, $category);
        $year = $context->query('year');
        $year = null !== $year && 1 === preg_match('/^[12][0-9]{3}$/', $year) ? (int) $year : null;
        $perPage = max(1, min(50, is_numeric($context->options['perPage'] ?? null) ? (int) $context->options['perPage'] : 10));
        $total = $this->articles->count($language, $category?->id, $year);
        $pages = max(1, (int) ceil($total / $perPage));
        $page = min($pages, max(1, (int) ($context->query('page') ?? 1)));
        $filter = array_filter(['category' => $category?->slug($language), 'year' => null === $year ? null : (string) $year], static fn(?string $value): bool => null !== $value);
        $link = static fn(array $query): string => $base . ([] === $query ? '' : '?' . http_build_query($query));
        $images = false !== ($context->options['images'] ?? true);

        $filters = [];

        if (false !== ($context->options['categories'] ?? true)) {
            foreach ($this->categories->all() as $item) {
                $slug = $item->slug($language);
                $title = $item->title($language);

                if (null !== $slug && null !== $title) {
                    $filters[] = ['title' => $title, 'href' => $link(['category' => $slug]), 'current' => $item->id === $category?->id];
                }
            }
        }

        return [
            'articles' => array_map(fn(ArticleView $article): array => $this->withLinks($this->rendering->teaser($article, $context->language, $images), $base), $this->articles->list($language, $category?->id, $year, $perPage, ($page - 1) * $perPage)),
            'filters' => [] === $filters ? [] : [['title' => null, 'href' => $link([]), 'current' => null === $category], ...$filters],
            'filtered' => [] !== $filter,
            'pagination' => [
                'page' => $page,
                'pages' => $pages,
                'previous' => $page > 1 ? $link([...$filter, ...($page > 2 ? ['page' => $page - 1] : [])]) : null,
                'next' => $page < $pages ? $link([...$filter, 'page' => $page + 1]) : null,
            ],
            'feed' => null === $context->target ? null : $this->feed->url($context->target->id, $context->language),
        ];
    }

    /**
     * The categories of an article link to the list filtered by them.
     *
     * @param array<string, mixed> $article
     *
     * @return array<string, mixed>
     */
    private function withLinks(array $article, string $base): array
    {
        $categories = [];

        foreach (\is_array($article['categories'] ?? null) ? $article['categories'] : [] as $category) {
            if (\is_array($category) && \is_string($category['slug'] ?? null)) {
                $categories[] = [...$category, 'href' => $base . '?' . http_build_query(['category' => $category['slug']])];
            }
        }

        return ['categories' => $categories] + $article;
    }

    private static function text(?string $value): ?string
    {
        return null === $value || '' === trim($value) ? null : trim($value);
    }
}
