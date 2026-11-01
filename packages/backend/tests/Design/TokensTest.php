<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Design;

use Frootbox\Backend\Brand;
use Frootbox\Backend\Design\Contrast;
use Frootbox\Backend\Design\DesignException;
use Frootbox\Backend\Design\Token;
use Frootbox\Backend\Design\Tokens;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(Tokens::class)]
#[CoversClass(Token::class)]
#[CoversClass(Contrast::class)]
final class TokensTest extends TestCase
{
    public function testEveryPairOfColorsPassesAaInBothModes(): void
    {
        $results = Tokens::fromFile()->contrasts();

        self::assertNotEmpty($results);

        foreach ($results as $result) {
            self::assertTrue($result->passes(), \sprintf('%s on %s (%s) has only %.2f:1.', $result->foreground, $result->background, $result->mode, $result->ratio));
        }
    }

    public function testTheRatioFollowsWcag(): void
    {
        self::assertEqualsWithDelta(21.0, Contrast::ratio('#000000', '#ffffff'), 0.01);
        self::assertEqualsWithDelta(1.0, Contrast::ratio('#8637ff', '#8637ff'), 0.01);
        self::assertEqualsWithDelta(4.54, Contrast::ratio('#767676', '#ffffff'), 0.01);
        self::assertTrue(Contrast::isColor('#00142373'));
        self::assertFalse(Contrast::isColor('red'));
    }

    public function testWritesCssVariablesForBothModes(): void
    {
        $css = Tokens::fromFile()->css();

        self::assertStringStartsWith(':root{color-scheme:light;--fb-accent:#8637ff;', $css);
        self::assertStringContainsString('--fb-space-4:16px;', $css);
        self::assertStringContainsString('[data-theme="dark"]{color-scheme:dark;--fb-accent:#a57cff;', $css);
        self::assertStringContainsString('@media (prefers-color-scheme:dark){:root:not([data-theme="light"])', $css);
        self::assertStringNotContainsString('--fb-space-4', explode('[data-theme="dark"]', $css)[1], 'Only colors and shadows change in dark mode.');
    }

    public function testTheDefaultBrandStandsInTheFile(): void
    {
        $tokens = Tokens::fromFile();

        self::assertSame('Frootbox', $tokens->brand['name']);
        self::assertSame(['accent', 'accent-hover', 'accent-soft', 'accent-soft-hover', 'accent-text', 'on-accent', 'focus'], array_map(static fn(Token $token): string => $token->name, $tokens->brandColors()));
    }

    public function testABrandReplacesOnlyBrandColors(): void
    {
        $tokens = Tokens::fromFile()->withBrand(new Brand('Acme', colors: ['accent' => '#0b6bcb', 'focus' => ['light' => '#111111', 'dark' => '#eeeeee']]));

        self::assertSame('#0b6bcb', $tokens->color('accent')->in('dark'));
        self::assertSame('#eeeeee', $tokens->color('focus')->in('dark'));
        self::assertSame('#f4f6f9', $tokens->color('bg')->in('light'));

        $this->expectException(DesignException::class);
        $this->expectExceptionMessage('The brand "Acme" sets the color "bg", but brands can only set accent, accent-hover, accent-soft, accent-soft-hover, accent-text, on-accent, focus.');
        Tokens::fromFile()->withBrand(new Brand('Acme', colors: ['bg' => '#000000']));
    }

    public function testABrandNeedsHexColors(): void
    {
        $this->expectException(DesignException::class);
        $this->expectExceptionMessage('The color "accent" of the brand "Acme" must be a hex color such as "#8637ff", not "blue".');
        Tokens::fromFile()->withBrand(new Brand('Acme', colors: ['accent' => 'blue']));
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function brokenFiles(): iterable
    {
        yield 'no groups' => ["brand: {}\n", 'needs the groups "brand" and "system"'];
        yield 'color without dark' => ["brand: {}\nsystem:\n  color:\n    bg: { light: '#ffffff' }\n", 'The token "system.color.bg" needs a "light" and a "dark" value.'];
        yield 'no hex color' => ["brand: {}\nsystem:\n  color:\n    bg: { light: white, dark: black }\n", 'The colors of "system.color.bg" must be hex colors'];
        yield 'bad name' => ["brand: {}\nsystem:\n  space:\n    Big: { value: 4px }\n", 'The token "system.space.Big" needs a name of lower case'];
        yield 'no value' => ["brand: {}\nsystem:\n  space:\n    '1': { use: x }\n", 'The token "system.space.1" needs a "value".'];
        yield 'unknown contrast' => ["brand: {}\nsystem:\n  color:\n    bg: { light: '#ffffff', dark: '#000000' }\ncontrast:\n  - [text, bg]\n", 'There is no color "text" in tokens.yaml.'];
        yield 'invalid yaml' => ["brand: [\n", 'is no valid YAML'];
    }

    #[DataProvider('brokenFiles')]
    public function testExplainsBrokenFiles(string $yaml, string $message): void
    {
        $file = tempnam(sys_get_temp_dir(), 'tokens');
        self::assertIsString($file);
        file_put_contents($file, $yaml);

        try {
            Tokens::fromFile($file);
            self::fail('The file was accepted.');
        } catch (DesignException $error) {
            self::assertStringContainsString($message, $error->getMessage());
        } finally {
            unlink($file);
        }
    }
}
