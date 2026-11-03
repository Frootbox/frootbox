<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Blocks;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\PublishedEntry;
use Frootbox\Collections\Website\EntryRendering;
use Frootbox\Core\Category\Category;
use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;
use Frootbox\Core\Plugin\CategoryPages;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Tag\Tag;
use Frootbox\Core\Url\Urls;

/**
 * The entries of the collection the page shows (decision 0246), by
 * position and else the newest first, filtered by category (with the
 * ones below it, decision 0233; its page if it has one, decision 0243)
 * and tag (decision 0239) without a script. Below the page each entry
 * has its address, there the view shows the entry (decision 0232).
 */
final readonly class EntryList implements BlockController
{
    public function __construct(
        private EntryStore $store,
        private EntryRendering $rendering,
        private Urls $urls,
        private ObjectCategories $categories,
        private ObjectTags $tags,
        private CategoryPages $pages,
    ) {}

    public function data(BlockContext $context): array
    {
        $language = $context->contentLanguage;
        $base = null === $context->target ? '' : $this->urls->href($context->target, $context->language) ?? '';
        $subpage = $context->subpage;
        $form = \is_string($context->options['form'] ?? null) ? $context->options['form'] : '';

        if (null !== $subpage && EntryStore::TYPE === $subpage->target->type) {
            $entry = $this->store->find($subpage->target->id);

            if (null !== $entry && isset($entry->data->translations[$language])) {
                return ['entry' => $this->rendering->detail($entry, $language), 'form' => $form, 'back' => $base];
            }
        }

        $entries = array_values(array_filter($this->store->allPublished($context->plugin->space ?? Space::DEFAULT), static fn(PublishedEntry $entry): bool => isset($entry->data->translations[$language])));
        $ids = array_map(static fn(PublishedEntry $entry): string => $entry->id, $entries);
        $images = false !== ($context->options['images'] ?? true);
        $filtering = false !== ($context->options['filters'] ?? true);

        // The choices are what the entries have; a filter with one choice is none.
        $assigned = $this->categories->of(EntryStore::TYPE, $ids);
        $used = array_flip(array_map(static fn(Category $category): string => $category->id, array_merge(...array_values($assigned))));
        $topics = [];

        foreach ($this->categories->tree(EntryStore::TYPE, EntryStore::CATEGORIES) as $item) {
            $slug = $item->slug($language);
            $title = $item->title($language);

            if (isset($used[$item->id]) && null !== $slug && null !== $title) {
                $topics[$slug] = ['id' => $item->id, 'title' => $title];
            }
        }

        $tagged = $this->tags->of(EntryStore::TYPE, $ids);
        $words = [];

        foreach (array_merge(...array_values($tagged)) as $tag) {
            foreach ($this->tags->visible([$tag], $language) as $word) {
                $words[$word['slug']] = ['id' => $tag->id, 'title' => $word['label']];
            }
        }

        uasort($words, static fn(array $a, array $b): int => strcmp(mb_strtolower($a['title']), mb_strtolower($b['title'])));
        $word = (string) $context->query('tag');
        $word = isset($words[$word]) && $filtering ? $word : null;
        // On the page of a category it is that one (decision 0243).
        $own = $this->pages->current($context);
        [$topic, $chosen] = $own ?? ($filtering ? $this->categories->bySlug(EntryStore::TYPE, $language, (string) $context->query('category')) : null) ?? [null, null];
        $here = null === $own || null === $subpage ? $base : $this->urls->href($subpage->target, $context->language) ?? $base;

        $shown = array_values(array_filter($entries, static fn(PublishedEntry $entry): bool => (null === $word || \in_array($words[$word]['id'], array_map(static fn(Tag $tag): string => $tag->id, $tagged[$entry->id] ?? []), true))
            && (null === $chosen || [] !== array_intersect($chosen, array_map(static fn(Category $category): string => $category->id, $assigned[$entry->id] ?? [])))));
        $current = ['category' => null === $own ? $topic?->slug($language) : null, 'tag' => $word];
        $link = static function (array $change, ?string $to = null) use ($here, $current): string {
            $query = array_filter([...$current, ...$change], static fn(mixed $value): bool => null !== $value);

            return ($to ?? $here) . ([] === $query ? '' : '?' . http_build_query($query));
        };
        $filters = [];

        if ($filtering && \count($topics) > 1) {
            $filters[] = [
                'label' => 'Category',
                'links' => [
                    ['title' => null, 'href' => $link(['category' => null], $base), 'current' => null === $topic],
                    ...array_map(fn(string $slug, array $item): array => ['title' => $item['title'], 'href' => $this->categoryLink($context, $item['id'], $slug, $link), 'current' => $item['id'] === $topic?->id], array_keys($topics), $topics),
                ],
            ];
        }

        if ($filtering && \count($words) > 1) {
            $filters[] = [
                'label' => 'Tag',
                'links' => [
                    ['title' => null, 'href' => $link(['tag' => null]), 'current' => null === $word],
                    ...array_map(static fn(string $slug, array $item): array => ['title' => $item['title'], 'href' => $link(['tag' => $slug]), 'current' => $slug === $word], array_keys($words), $words),
                ],
            ];
        }

        return [
            'entries' => array_map(fn(PublishedEntry $entry): array => $this->rendering->teaser($entry, $language, $images), $shown),
            'filters' => $filters,
            'filtered' => null !== $topic || null !== $word,
            'category' => null === $own ? null : ['title' => $own[0]->titleIn([$language]), 'description' => $own[0]->description($language)],
            'total' => \count($entries),
        ];
    }

    /**
     * A category of the filter: its page if it has one (decision 0243),
     * else the list with ?category=; the other filters stay.
     *
     * @param callable(array<string, string|null>, string|null): string $link
     */
    private function categoryLink(BlockContext $context, string $id, string $slug, callable $link): string
    {
        $page = $this->pages->href($context, $id);

        return null === $page ? $link(['category' => $slug], null) : $link(['category' => null], $page);
    }
}
