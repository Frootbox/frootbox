<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Design;

use Frootbox\Backend\BackendExtension;
use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;

/**
 * The icons come from Lucide in one style (decision 0125): the files for
 * icon() and the copy the editor bar holds in icons.js.
 */
#[CoversNothing]
final class IconsTest extends TestCase
{
    private const string HEAD = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';

    public function testEveryFileHasTheSameStyle(): void
    {
        $files = glob(BackendExtension::ROOT . '/assets/icons/*.svg');
        self::assertNotEmpty($files);

        foreach ($files as $file) {
            self::assertStringStartsWith(self::HEAD, (string) file_get_contents($file), basename($file));
        }

        self::assertFileExists(BackendExtension::ROOT . '/assets/icons/LICENSE-lucide');
    }

    public function testTheBarDrawsAnIconLikeItsFile(): void
    {
        preg_match_all('/^    ([a-zA-Z]+): svg`([^`]*)`,$/m', (string) file_get_contents(BackendExtension::ROOT . '/resources/js/edit/icons.js'), $matches, \PREG_SET_ORDER);
        self::assertNotEmpty($matches);
        $compared = 0;

        foreach ($matches as [, $name, $paths]) {
            $file = BackendExtension::ROOT . '/assets/icons/' . $name . '.svg';

            if (is_file($file)) {
                self::assertSame(self::HEAD . $paths . "</svg>\n", file_get_contents($file), $name);
                ++$compared;
            }
        }

        self::assertGreaterThan(10, $compared);
    }
}
