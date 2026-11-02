<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http\Pages;

use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Core\Language\Language;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\PageStatus;
use Frootbox\Core\Page\PageTreeNode;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(PageTree::class)]
final class PageTreeTest extends TestCase
{
    public function testASmallWebsiteIsOpenCompletely(): void
    {
        // 1 + 5 + 5 * 4 = 26 rows, all fit.
        self::assertSame(3, $this->tree(5, 4)->openLevels());
    }

    public function testALargeWebsiteOpensOnlyWholeLevelsThatFit(): void
    {
        // 1 + 12 rows fit, 12 * 10 more do not.
        self::assertSame(2, $this->tree(12, 10)->openLevels());
        self::assertSame(1, $this->tree(60, 0)->openLevels(), 'The start page is always open.');
        self::assertSame(3, $this->tree(12, 10)->openLevels(200));
    }

    private function tree(int $sections, int $pages): PageTree
    {
        $children = [];

        for ($section = 0; $section < $sections; ++$section) {
            $children[] = self::node("s{$section}", array_map(static fn(int $page): PageTreeNode => self::node("s{$section}p{$page}"), $pages > 0 ? range(1, $pages) : []));
        }

        return PageTree::of([self::node('start', $children)], new Languages([new Language('de', 'Deutsch')]));
    }

    /**
     * @param list<PageTreeNode> $children
     */
    private static function node(string $id, array $children = []): PageTreeNode
    {
        return new PageTreeNode($id, PageStatus::Published, 'acme/site/Page', ['de' => $id], ['de' => $id], $children);
    }
}
