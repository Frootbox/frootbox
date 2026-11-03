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
use Frootbox\Core\Plugin\PluginPages;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Tag\Tag;
use Frootbox\Core\Url\Target;
use Frootbox\Core\Url\Urls;

/**
 * Some entries as cards, e.g. the references on the start page, with a
 * link to all (decision 0246): of all collections or of one, optionally
 * only those of a category (with the ones below it) or with a tag.
 */
final readonly class EntryTeaser implements BlockController
{
    public function __construct(
        private EntryStore $store,
        private EntryRendering $rendering,
        private PluginPages $plugins,
        private Urls $urls,
        private ObjectCategories $categories,
        private ObjectTags $tags,
    ) {}

    public function data(BlockContext $context): array
    {
        $language = $context->contentLanguage;
        $count = max(1, min(12, is_numeric($context->options['count'] ?? null) ? (int) $context->options['count'] : 3));
        $space = self::option($context, 'space');
        $base = null === $space ? $this->plugins->main(EntryStore::TYPE) : $this->plugins->of(EntryStore::TYPE, $space);
        $entries = array_values(array_filter($this->store->allPublished($space), static fn(PublishedEntry $entry): bool => isset($entry->data->translations[$language])));
        $ids = array_map(static fn(PublishedEntry $entry): string => $entry->id, $entries);
        $key = self::option($context, 'tag');
        $category = self::option($context, 'category');

        if (null !== $key) {
            // A tag deleted since then shows no entries rather than all.
            $tag = $this->tags->byKey($key)?->id;
            $tagged = $this->tags->of(EntryStore::TYPE, $ids);
            $entries = array_filter($entries, static fn(PublishedEntry $entry): bool => \in_array($tag, array_map(static fn(Tag $item): string => $item->id, $tagged[$entry->id] ?? []), true));
        }

        if (null !== $category) {
            // So does a category deleted since then.
            $chosen = $this->below($category);
            $assigned = $this->categories->of(EntryStore::TYPE, $ids);
            $entries = array_filter($entries, static fn(PublishedEntry $entry): bool => [] !== array_intersect($chosen, array_map(static fn(Category $item): string => $item->id, $assigned[$entry->id] ?? [])));
        }

        return [
            'entries' => array_map(fn(PublishedEntry $entry): array => $this->rendering->teaser($entry, $language, false !== ($context->options['images'] ?? true)), \array_slice(array_values($entries), 0, $count)),
            'all' => null === $base ? null : $this->urls->href(Target::page($base), $context->language),
        ];
    }

    private static function option(BlockContext $context, string $name): ?string
    {
        $value = $context->options[$name] ?? null;

        return \is_string($value) && '' !== $value ? $value : null;
    }

    /**
     * The category with the ones below it, empty if it is gone.
     *
     * @return list<string>
     */
    private function below(string $id): array
    {
        $ids = [];
        $depth = null;

        foreach ($this->categories->tree(EntryStore::TYPE, EntryStore::CATEGORIES) as $item) {
            if (null !== $depth && $item->depth <= $depth) {
                break;
            }

            if (null !== $depth || $item->id === $id) {
                $depth ??= $item->depth;
                $ids[] = $item->id;
            }
        }

        return $ids;
    }
}
