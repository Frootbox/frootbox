<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Design;

/**
 * The contrast of two colors after WCAG 2, from 1 to 21. Text needs at
 * least 4.5 (AA).
 */
final readonly class Contrast
{
    public const float AA = 4.5;

    private const string HEX = '/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i';

    /**
     * @param string $mode light or dark
     */
    public function __construct(
        public string $foreground,
        public string $background,
        public string $mode,
        public float $ratio,
    ) {}

    public function passes(): bool
    {
        return $this->ratio >= self::AA;
    }

    public static function isColor(string $value): bool
    {
        return 1 === preg_match(self::HEX, $value);
    }

    /**
     * The ratio of two hex colors; an alpha channel is ignored.
     */
    public static function ratio(string $first, string $second): float
    {
        [$lighter, $darker] = [self::luminance($first), self::luminance($second)];

        if ($darker > $lighter) {
            [$lighter, $darker] = [$darker, $lighter];
        }

        return ($lighter + 0.05) / ($darker + 0.05);
    }

    private static function luminance(string $color): float
    {
        if (!self::isColor($color)) {
            throw new DesignException(\sprintf('"%s" is no hex color such as "#8637ff".', $color));
        }

        $hex = ltrim($color, '#');

        if (3 === \strlen($hex)) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }

        $channels = array_map(static function (string $pair): float {
            $channel = hexdec($pair) / 255;

            return $channel <= 0.03928 ? $channel / 12.92 : (($channel + 0.055) / 1.055) ** 2.4;
        }, str_split(substr($hex, 0, 6), 2));

        return 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2];
    }
}
