<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\Tests;

use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;

/**
 * Every key of config/app.yaml the code reads is described in the
 * config/app.yaml of the skeleton, the first place a developer looks.
 */
#[CoversNothing]
final class ConfigurationTest extends TestCase
{
    private const string ROOT = __DIR__ . '/../..';

    /** Keys the core fills from elsewhere, e.g. config/extensions/. */
    private const array INTERNAL = ['extensions'];

    public function testTheSkeletonDescribesEveryKeyTheCodeReads(): void
    {
        $keys = $this->keys();
        $lines = file(self::ROOT . '/skeleton/config/app.yaml', \FILE_IGNORE_NEW_LINES);
        self::assertIsArray($lines);
        self::assertContains('app.timezone', $keys, 'Keys in constants are found too.');
        self::assertContains('backend.path', $keys);

        foreach ($keys as $key) {
            self::assertTrue(self::describes($lines, explode('.', $key)), \sprintf('skeleton/config/app.yaml describes "%s", if only in a comment.', $key));
        }
    }

    /**
     * @return list<string>
     */
    private function keys(): array
    {
        $keys = [];
        $folders = [];

        foreach (['/packages/*/src', '/packages/*/*/src'] as $pattern) {
            $found = glob(self::ROOT . $pattern, \GLOB_ONLYDIR);
            $folders = [...$folders, ...(\is_array($found) ? $found : [])];
        }

        foreach ($folders as $folder) {
            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($folder, \FilesystemIterator::SKIP_DOTS));

            foreach ($files as $file) {
                if (!$file instanceof \SplFileInfo || 'php' !== $file->getExtension()) {
                    continue;
                }

                $code = (string) file_get_contents($file->getPathname());
                preg_match_all('/config->(?:get|string|int|bool)\(\'([a-z0-9_.]+)\'/', $code, $calls);
                preg_match_all('/const string KEY = \'([a-z_]+\.[a-z0-9_.]+)\'/', str_contains($code, 'Config\\Config') || str_contains($file->getPathname(), '/Config/') ? $code : '', $constants);
                $keys = [...$keys, ...$calls[1], ...$constants[1]];
            }
        }

        $keys = array_values(array_diff(array_unique($keys), self::INTERNAL));
        sort($keys);

        return $keys;
    }

    /**
     * Whether the lines hold the segments as nested keys, commented out or not.
     *
     * @param list<string> $lines
     * @param list<string> $segments
     */
    private static function describes(array $lines, array $segments): bool
    {
        $index = 0;

        foreach ($lines as $line) {
            if (1 === preg_match('/^#?\s*' . preg_quote($segments[$index], '/') . ':/', $line)) {
                ++$index;

                if ($index === \count($segments)) {
                    return true;
                }
            }
        }

        return false;
    }
}
