<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\Tests;

use Frootbox\Core\Frootbox;
use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Every package of the monorepo is mirrored, licensed and versioned the
 * same way (decisions 0181, 0271, 0272), so a new package cannot be
 * forgotten on its way to Packagist.
 */
#[CoversNothing]
final class PackagesTest extends TestCase
{
    private const string ROOT = __DIR__ . '/../..';

    public function testEveryPackageIsMirrored(): void
    {
        $mirrors = self::mirrors();
        $packages = array_keys(self::packages());

        self::assertSame($packages, array_keys($mirrors), 'Every folder with a composer.json is in .github/split.json, and nothing else.');
        self::assertStringContainsString('.github/split.json', (string) file_get_contents(self::ROOT . '/.github/workflows/split.yml'));
    }

    /**
     * @param array<string, mixed> $composer
     */
    #[DataProvider('packages')]
    public function testThePackageIsReadyForPackagist(string $path, array $composer): void
    {
        $name = $composer['name'] ?? null;
        self::assertIsString($name);
        self::assertSame('frootbox/' . (self::mirrors()[$path] ?? ''), $name, 'The mirror has the name of the package without vendor.');
        self::assertSame('MIT', $composer['license'] ?? null);
        self::assertFileExists(self::ROOT . '/' . $path . '/LICENSE');
        self::assertStringContainsString('github.com/Frootbox/frootbox', (string) file_get_contents(self::ROOT . '/' . $path . '/README.md'), 'The mirror says where the package is developed.');

        self::assertFileExists(self::ROOT . '/' . $path . '/.gitattributes');
        $attributes = (string) file_get_contents(self::ROOT . '/' . $path . '/.gitattributes');

        if (is_dir(self::ROOT . '/' . $path . '/tests')) {
            self::assertStringContainsString('/tests export-ignore', $attributes, 'Tests stay out of the download.');
        }

        $requires = $composer['require'] ?? [];
        self::assertIsArray($requires);
        $minor = implode('.', \array_slice(explode('.', Frootbox::VERSION), 0, 2));

        if ('skeleton' === $path) {
            self::assertStringContainsString('/LICENSE export-ignore', $attributes, 'A new website does not take the license of Frootbox.');
            self::assertStringContainsString('/README.md export-ignore', $attributes);
            $constraint = '^' . $minor . '@dev';
        } else {
            self::assertSame(['dev-main' => $minor . '.x-dev'], self::branchAlias($composer), 'main is the next version (decision 0271).');
            $constraint = '^' . $minor;
        }

        foreach ($requires as $package => $version) {
            if (\is_string($package) && str_starts_with($package, 'frootbox/')) {
                self::assertSame($constraint, $version, \sprintf('%s needs %s in the shared version.', $path, $package));
            }
        }
    }

    public function testTheChangelogHasAPlaceForTheNextVersion(): void
    {
        $changelog = (string) file_get_contents(self::ROOT . '/CHANGELOG.md');

        self::assertStringContainsString("\n## [Unreleased]\n", $changelog);

        // A release names its version; between releases main is "-dev".
        if (!str_contains(Frootbox::VERSION, '-')) {
            self::assertStringContainsString("\n## [" . Frootbox::VERSION . '] - ', $changelog, 'The released version is in the changelog.');
        }
    }

    /**
     * @return array<string, array{string, array<string, mixed>}>
     */
    public static function packages(): array
    {
        $files = [self::ROOT . '/skeleton/composer.json'];

        foreach (['/packages/*/composer.json', '/packages/*/*/composer.json'] as $pattern) {
            $found = glob(self::ROOT . $pattern);
            $files = [...$files, ...(false === $found ? [] : $found)];
        }

        $packages = [];

        foreach ($files as $file) {
            $path = substr(\dirname($file), \strlen(self::ROOT) + 1);
            $composer = json_decode((string) file_get_contents($file), true, flags: \JSON_THROW_ON_ERROR);
            self::assertIsArray($composer);
            $packages[$path] = [$path, self::strings($composer)];
        }

        ksort($packages);

        return $packages;
    }

    /**
     * @return array<string, string>
     */
    private static function mirrors(): array
    {
        $mirrors = json_decode((string) file_get_contents(self::ROOT . '/.github/split.json'), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($mirrors);
        $list = [];

        foreach ($mirrors as $path => $repo) {
            self::assertIsString($repo);
            $list[(string) $path] = $repo;
        }

        ksort($list);

        return $list;
    }

    /**
     * @param array<string, mixed> $composer
     *
     * @return array<mixed>
     */
    private static function branchAlias(array $composer): array
    {
        $extra = $composer['extra'] ?? [];
        self::assertIsArray($extra);
        $alias = $extra['branch-alias'] ?? [];
        self::assertIsArray($alias);

        return $alias;
    }

    /**
     * @param array<mixed> $array
     *
     * @return array<string, mixed>
     */
    private static function strings(array $array): array
    {
        $result = [];

        foreach ($array as $key => $value) {
            $result[(string) $key] = $value;
        }

        return $result;
    }
}
