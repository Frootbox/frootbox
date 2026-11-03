<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Blocks;

use Frootbox\Core\Category\Category;
use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;
use Frootbox\Core\Plugin\CategoryPages;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Tag\Tag;
use Frootbox\Core\Url\Urls;
use Frootbox\People\Person\PersonData;
use Frootbox\People\Person\PersonStore;
use Frootbox\People\Website\Cards;

/**
 * The people of the space the page shows, in the order of the team,
 * filtered by category (with the ones below it) and tag without a
 * script: the view of the people at plugin() (decision 0242). With
 * profiles on, each person has an address below the page; there the view
 * shows the profile.
 */
final readonly class PersonList implements BlockController
{
    public function __construct(
        private Cards $cards,
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

        if (null !== $subpage && PersonStore::TYPE === $subpage->target->type) {
            $person = $this->cards->profile($subpage->target->id, $language, $context->language);

            if (null !== $person) {
                return ['person' => $person, 'back' => $base];
            }
        }

        $people = $this->cards->people(space: $context->plugin->space ?? Space::DEFAULT);
        $filtering = false !== ($context->options['filters'] ?? true);
        $ids = array_keys($people);

        // The choices are what the people have; a filter with one choice is none.
        $assigned = $this->categories->of(PersonStore::TYPE, $ids);
        $used = array_flip(array_map(static fn(Category $category): string => $category->id, array_merge(...array_values($assigned))));
        $topics = [];

        foreach ($this->categories->tree(PersonStore::TYPE) as $item) {
            $slug = $item->slug($language);
            $title = $item->title($language);

            if (isset($used[$item->id]) && null !== $slug && null !== $title) {
                $topics[$slug] = ['id' => $item->id, 'title' => $title];
            }
        }

        $tagged = $this->tags->of(PersonStore::TYPE, $ids);
        $words = [];

        foreach (array_merge(...array_values($tagged)) as $tag) {
            foreach ($this->tags->visible([$tag], $language) as $word) {
                $words[$word['slug']] = ['id' => $tag->id, 'title' => $word['label']];
            }
        }

        uasort($words, static fn(array $a, array $b): int => strcmp(mb_strtolower($a['title']), mb_strtolower($b['title'])));
        // On the page of a category it is that one (decision 0243).
        $own = $this->pages->current($context);
        [$topic, $chosen] = $own ?? ($filtering ? $this->categories->bySlug(PersonStore::TYPE, $language, (string) $context->query('category')) : null) ?? [null, null];
        $here = null === $own || null === $subpage ? $base : $this->urls->href($subpage->target, $context->language) ?? $base;
        $word = (string) $context->query('tag');
        $word = isset($words[$word]) && $filtering ? $word : null;

        $shown = array_filter($people, static fn(PersonData $person, string $id): bool => (null === $chosen || [] !== array_intersect($chosen, array_map(static fn(Category $category): string => $category->id, $assigned[$id] ?? [])))
            && (null === $word || \in_array($words[$word]['id'], array_map(static fn(Tag $tag): string => $tag->id, $tagged[$id] ?? []), true)), \ARRAY_FILTER_USE_BOTH);
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
            'people' => $this->cards->cards($shown, $language, $context->language),
            'filters' => $filters,
            'filtered' => null !== $topic || null !== $word,
            'category' => null === $own ? null : ['title' => $own[0]->titleIn([$language]), 'description' => $own[0]->description($language)],
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
