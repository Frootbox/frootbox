<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Pages;

use Frootbox\Core\Language\Language;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\PageStatus;
use Frootbox\Core\Page\PageTreeNode;

/**
 * The result of page.tree as the backend shows it (decision 0116): a
 * title in the default language, the path of the draft and a status,
 * "scheduled" for a draft with a time. With a role only within branches
 * the pages above them are "outside": shown, but not opened or moved
 * (decision 0118).
 *
 * @phpstan-type Row array{id: string, title: string, path: string, terms: string, languages: list<string>, status: string, layout: string, depth: int, start: bool, fixed: bool, online: bool, locked: bool, outside: bool, children: list<mixed>}
 */
final readonly class PageTree
{
    /**
     * Rows the sitemap shows at most when it opens whole levels by itself.
     */
    public const int OPEN_ROWS = 50;

    /**
     * @param list<Row>                                                                                                         $rows
     * @param array<string, array{row: Row, parentId: ?string, ancestors: list<string>, paths: array<string, string>, children: int}> $pages
     */
    private function __construct(
        public array $rows,
        private array $pages,
    ) {}

    /**
     * @param list<PageTreeNode> $nodes
     */
    public static function of(array $nodes, Languages $languages): self
    {
        $pages = [];
        $rows = self::rows($nodes, $languages, null, [], [], 0, $pages);

        return new self($rows, $pages);
    }

    public function has(string $id): bool
    {
        return isset($this->pages[$id]);
    }

    /**
     * Whether the page is there and may be opened, not only the way to a
     * branch.
     */
    public function inside(string $id): bool
    {
        return isset($this->pages[$id]) && !$this->pages[$id]['row']['outside'];
    }

    /**
     * The first page that may be opened, from the top.
     */
    public function first(): ?string
    {
        foreach ($this->pages as $id => $page) {
            if (!$page['row']['outside']) {
                return $id;
            }
        }

        return null;
    }

    /**
     * @return Row
     */
    public function row(string $id): array
    {
        return $this->pages[$id]['row'];
    }

    public function parentId(string $id): ?string
    {
        return $this->pages[$id]['parentId'];
    }

    /**
     * From the start page down to the parent.
     *
     * @return list<string>
     */
    public function ancestors(string $id): array
    {
        return $this->pages[$id]['ancestors'];
    }

    /**
     * How many levels the sitemap shows open at first (decision 0136): as
     * many whole levels as fit into $rows rows, at least the start page.
     * A small website is open completely, a large one only at the top.
     */
    public function openLevels(int $rows = self::OPEN_ROWS): int
    {
        $byDepth = [];

        foreach ($this->pages as $page) {
            $depth = $page['row']['depth'];
            $byDepth[$depth] = ($byDepth[$depth] ?? 0) + 1;
        }

        ksort($byDepth);
        $shown = 0;
        $levels = 0;

        foreach ($byDepth as $depth => $count) {
            $shown += $count;

            if ($shown > $rows) {
                break;
            }

            $levels = $depth + 1;
        }

        return max(1, $levels);
    }

    public function hasChildren(string $id): bool
    {
        return $this->pages[$id]['children'] > 0;
    }

    /**
     * The path of the draft in a language without its prefix, e.g.
     * "ueber-uns/team", "" for the start page.
     */
    public function path(string $id, string $language): string
    {
        return $this->pages[$id]['paths'][$language] ?? '';
    }

    /**
     * The layout a new page below this one most likely gets: the one of
     * its last subpage, else its own.
     */
    public function layoutBelow(string $parentId): string
    {
        $layout = $this->pages[$parentId]['row']['layout'];

        foreach ($this->pages as $page) {
            if ($page['parentId'] === $parentId) {
                $layout = $page['row']['layout'];
            }
        }

        return $layout;
    }

    /**
     * Pages for a select: every page with dashes by depth, without the
     * ones outside the branches and without the page and its subpages if
     * one is given.
     *
     * @return list<array{value: string, label: string}>
     */
    public function options(?string $without = null): array
    {
        $options = [];

        foreach ($this->pages as $id => $page) {
            if ($page['row']['outside'] || (null !== $without && ($id === $without || \in_array($without, $page['ancestors'], true)))) {
                continue;
            }

            $options[] = ['value' => $id, 'label' => str_repeat('– ', $page['row']['depth']) . $page['row']['title']];
        }

        return $options;
    }

    /**
     * @param list<PageTreeNode>                                                                                                $nodes
     * @param list<string>                                                                                                      $ancestors
     * @param array<string, string>                                                                                             $parentPaths
     * @param array<string, array{row: Row, parentId: ?string, ancestors: list<string>, paths: array<string, string>, children: int}> $pages
     *
     * @return list<Row>
     */
    private static function rows(array $nodes, Languages $languages, ?string $parentId, array $ancestors, array $parentPaths, int $depth, array &$pages): array
    {
        $default = $languages->default();
        $rows = [];

        foreach ($nodes as $node) {
            $paths = [];

            foreach ($languages->all() as $language) {
                $slug = $node->slugs[$language->code] ?? $node->slugs[$default->code] ?? array_first($node->slugs) ?? '';
                $paths[$language->code] = null === $parentId ? '' : ltrim(($parentPaths[$language->code] ?? '') . '/' . $slug, '/');
            }

            $row = [
                'id' => $node->id,
                'title' => $node->titles[$default->code] ?? array_first($node->titles) ?? $node->id,
                'path' => $default->path($paths[$default->code]),
                // What the search in the sitemap finds (decision 0136): titles and addresses in every language.
                'terms' => implode(' ', array_unique([...array_values($node->titles), ...array_map(
                    static fn(Language $language): string => $language->path($paths[$language->code]),
                    $languages->all(),
                )])),
                'languages' => array_values(array_map(
                    static fn(Language $language): string => strtoupper($language->code),
                    array_filter($languages->all(), static fn(Language $language): bool => isset($node->titles[$language->code])),
                )),
                'status' => null !== $node->publishAt && PageStatus::Published !== $node->status ? 'scheduled' : $node->status->value,
                'layout' => $node->layout,
                'depth' => $depth,
                'start' => null === $parentId,
                // The start page and the top of a branch stay in place.
                'fixed' => null === $parentId || $pages[$parentId]['row']['outside'],
                'online' => PageStatus::Draft !== $node->status,
                // Locked by itself or a page above (decision 0117).
                'locked' => null !== $node->visibility->lockedBy,
                'outside' => $node->outside,
                'children' => [],
            ];
            $pages[$node->id] = ['row' => $row, 'parentId' => $parentId, 'ancestors' => $ancestors, 'paths' => $paths, 'children' => \count($node->children)];
            $row['children'] = self::rows($node->children, $languages, $node->id, [...$ancestors, $node->id], $paths, $depth + 1, $pages);
            $rows[] = $row;
        }

        return $rows;
    }
}
