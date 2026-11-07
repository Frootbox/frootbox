<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\Tests;

use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;

/**
 * The texts for visitors addressed formally (decision 0316): a file
 * `<language>.formal.yaml` only replaces texts its package has, and none
 * of them still says "Du".
 */
#[CoversNothing]
final class FormalTextsTest extends TestCase
{
    private const string ROOT = __DIR__ . '/../..';

    /** German words of the informal address. */
    private const string INFORMAL = '/\b(du|dein\w*|dich|dir)\b/iu';

    #[DataProvider('files')]
    public function testFormalTextsReplaceTextsOfThePackage(string $formal, string $informal): void
    {
        self::assertFileExists($informal, 'A formal file sits next to the usual one of its language.');
        $texts = Yaml::parseFile($informal);
        self::assertIsArray($texts);
        $replacements = Yaml::parseFile($formal);
        self::assertIsArray($replacements);
        self::assertNotEmpty($replacements);

        foreach ($replacements as $key => $text) {
            self::assertArrayHasKey($key, $texts, \sprintf('%s replaces only texts of %s.', basename($formal), basename($informal)));
            self::assertIsString($text);
            self::assertNotSame($texts[$key], $text, \sprintf('"%s" is the same in both files, it belongs only in %s.', $key, basename($informal)));

            if (str_starts_with(basename($formal), 'de.')) {
                self::assertDoesNotMatchRegularExpression(self::INFORMAL, $text, \sprintf('"%s" still says Du.', $key));
            }
        }
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function files(): iterable
    {
        $files = glob(self::ROOT . '/packages/{*,*/*}/translations/{,website/}*.formal.yaml', \GLOB_BRACE);
        self::assertIsArray($files);
        self::assertNotEmpty($files);

        foreach ($files as $file) {
            yield substr($file, \strlen(self::ROOT) + 1) => [$file, str_replace('.formal.yaml', '.yaml', $file)];
        }
    }
}
