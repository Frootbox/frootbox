<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\Tests;

use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;

/**
 * The public texts (documentation, READMEs, help, DESIGN.md) link only to
 * files that exist and name no internal decision (decisions 0265, 0272).
 * Comments in the code keep their numbers.
 */
#[CoversNothing]
final class DocumentationTest extends TestCase
{
    private const string ROOT = __DIR__ . '/../..';

    public function testLinksLeadToFilesAndNoDecisionIsNamed(): void
    {
        $files = [self::ROOT . '/README.md', self::ROOT . '/CONTRIBUTING.md', self::ROOT . '/SECURITY.md', self::ROOT . '/CHANGELOG.md', self::ROOT . '/skeleton/AGENTS.md'];
        foreach (['documentation', 'packages', 'tests/Fixtures'] as $folder) {
            $items = new \RecursiveIteratorIterator(new \RecursiveCallbackFilterIterator(
                new \RecursiveDirectoryIterator(self::ROOT . '/' . $folder, \FilesystemIterator::SKIP_DOTS),
                // Fixtures of tests may hold broken links on purpose.
                static fn(\SplFileInfo $item): bool => !\in_array($item->getFilename(), ['vendor', 'node_modules'], true) && !str_ends_with($item->getPathname(), '/tests/Fixtures'),
            ));

            foreach ($items as $item) {
                if ($item instanceof \SplFileInfo && 'md' === $item->getExtension()) {
                    $files[] = $item->getPathname();
                }
            }
        }

        $broken = [];
        $decisions = [];

        foreach ($files as $file) {
            $text = (string) file_get_contents($file);
            $name = substr((string) realpath($file), \strlen((string) realpath(self::ROOT)) + 1);

            if (1 === preg_match('/decisions?\s+\d{4}/', $text)) {
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
