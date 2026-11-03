<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Blocks;

use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Url\Urls;
use Frootbox\News\Article\ArticleRendering;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleView;
use Frootbox\News\Article\PublishedArticles;
use Frootbox\News\Feed\Feed;

/**
 * The view of the news at plugin() (decision 0232): the articles of the
 * space of the page, page by page, by category, tag (decision 0239) and
 * year. Below the page
 * each article has its address, there the view shows the article.
 */
final readonly class ArticleList implements BlockController
{
    public function __construct(
        private PublishedArticles $articles,
        private ObjectCategories $categories,
        private ObjectTags $tags,
        private ArticleRendering $rendering,
        private Urls $urls,
        private Feed $feed,
    ) {}

    public function data(BlockContext $context): array
    {
        $language = $context->contentLanguage;
        $base = null === $context->target ? '' : $this->urls->href($context->target, $context->language) ?? '';
        $subpage = $context->subpage;
        $spaces = [$context->plugin->space ?? Space::DEFAULT];

        if (null !== $subpage && ArticleStore::TYPE === $subpage->target->type) {
            $article = $this->articles->find($subpage->target->id, $language);

            if (null !== $article) {
                return ['article' => $this->withLinks($this->rendering->detail($article, $context->language), $base), 'back' => $base];
            }
        }

        // A category counts with all below it (decision 0233).
        $slug = self::text($context->query('category'));
        [$category, $chosen] = (null === $slug ? null : $this->categories->bySlug(ArticleStore::TYPE, $language, $slug)) ?? [null, null];
        // Like a category, an unknown tag filters nothing.
        $tagSlug = self::text($context->query('tag'));
        $tag = null === $tagSlug ? null : $this->tags->bySlug($language, $tagSlug);
        $shown = null === $tag ? null : $this->tags->visible([$tag], $language)[0] ?? null;
        $year = $context->query('year');
        $year = null !== $year && 1 === preg_match('/^[12][0-9]{3}$/', $year) ? (int) $year : null;
        $perPage = max(1, min(50, is_numeric($context->options['perPage'] ?? null) ? (int) $context->options['perPage'] : 10));
        $total = $this->articles->count($language, $chosen, $year, $spaces, $tag?->id);
        $pages = max(1, (int) ceil($total / $perPage));
        $page = min($pages, max(1, (int) ($context->query('page') ?? 1)));
        $filter = array_filter(['category' => $category?->slug($language), 'tag' => $shown['slug'] ?? null, 'year' => null === $year ? null : (string) $year], static fn(?string $value): bool => null !== $value);
        $link = static fn(array $query): string => $base . ([] === $query ? '' : '?' . http_build_query($query));
        $images = false !== ($context->options['images'] ?? true);

        $filters = [];

        if (false !== ($context->options['categories'] ?? true)) {
            foreach ($this->categories->tree(ArticleStore::TYPE, ArticleStore::CATEGORIES) as $item) {
                $itemSlug = $item->slug($language);
                $title = $item->title($language);

                if (null !== $itemSlug && null !== $title) {
                    $filters[] = ['title' => $title, 'href' => $link(['category' => $itemSlug]), 'current' => $item->id === $category?->id, 'depth' => $item->depth];
                }
            }
        }

        return [
            'articles' => array_map(fn(ArticleView $article): array => $this->withLinks($this->rendering->teaser($article, $context->language, $images), $base), $this->articles->list($language, $chosen, $year, $perPage, ($page - 1) * $perPage, $spaces, $tag?->id)),
            'filters' => [] === $filters ? [] : [['title' => null, 'href' => $link([]), 'current' => null === $category], ...$filters],
            'filtered' => [] !== $filter,
            'tag' => null === $shown ? null : ['label' => $shown['label'], 'all' => $link(array_diff_key($filter, ['tag' => true]))],
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
     * The categories and tags of an article link to the list filtered by
     * them.
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

        $tags = [];

        foreach (\is_array($article['tags'] ?? null) ? $article['tags'] : [] as $tag) {
            if (\is_array($tag) && \is_string($tag['slug'] ?? null)) {
                $tags[] = [...$tag, 'href' => $base . '?' . http_build_query(['tag' => $tag['slug']])];
            }
        }

        return ['categories' => $categories, 'tags' => $tags] + $article;
    }

    private static function text(?string $value): ?string
    {
        return null === $value || '' === trim($value) ? null : trim($value);
    }
}
