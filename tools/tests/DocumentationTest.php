<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\Tests;

use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;

/**
 * The public documentation links only to files that exist and names no
 * internal decision (decisions 0265, 0272).
 */
#[CoversNothing]
final class DocumentationTest extends TestCase
{
    private const string ROOT = __DIR__ . '/../..';

    public function testLinksLeadToFilesAndNoDecisionIsNamed(): void
    {
        $files = [self::ROOT . '/README.md', self::ROOT . '/CONTRIBUTING.md', self::ROOT . '/SECURITY.md', self::ROOT . '/CHANGELOG.md', self::ROOT . '/skeleton/AGENTS.md'];
        $items = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(self::ROOT . '/documentation', \FilesystemIterator::SKIP_DOTS));

        foreach ($items as $item) {
            if ($item instanceof \SplFileInfo && 'md' === $item->getExtension()) {
                $files[] = $item->getPathname();
            }
        }

        $broken = [];
        $decisions = [];

        foreach ($files as $file) {
            $text = (string) file_get_contents($file);
            $name = substr((string) realpath($file), \strlen((string) realpath(self::ROOT)) + 1);

            if (1 === preg_match('/decisions? \d{4}/', $text)) {
                $decisions[] = $name;
            }

            preg_match_all('/\]\(([^)\s]+)\)/', $text, $links);

            foreach ($links[1] as $link) {
                if (1 === preg_match('#^(https?:|mailto:|\#)#', $link)) {
                    continue;
                }

                $path = \dirname($file) . '/' . explode('#', $link)[0];

                if (!file_exists($path)) {
                    $broken[] = $name . ': ' . $link;
                }
            }
        }

        self::assertSame([], $broken, 'Links to files that do not exist.');
        self::assertSame([], $decisions, 'Public texts name no internal decision, see documentation/README.md.');
    }
}
