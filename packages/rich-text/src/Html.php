<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

/**
 * Small helpers to write HTML safely.
 */
final class Html
{
    public static function escape(string $text): string
    {
        return htmlspecialchars($text, \ENT_QUOTES | \ENT_SUBSTITUTE | \ENT_HTML5, 'UTF-8');
    }

    /**
     * An opening tag. Attributes with null or false are left out, true
     * writes the bare name.
     *
     * @param array<string, string|int|bool|null> $attributes
     */
    public static function open(string $tag, array $attributes = []): string
    {
        $html = '<' . $tag;

        foreach ($attributes as $name => $value) {
            if (null === $value || false === $value) {
                continue;
            }

            $html .= true === $value ? ' ' . $name : ' ' . $name . '="' . self::escape((string) $value) . '"';
        }

        return $html . '>';
    }

    public static function close(string $tag): string
    {
        return '</' . $tag . '>';
    }

    /**
     * @param array<string, string|int|bool|null> $attributes
     */
    public static function element(string $tag, string $content, array $attributes = []): string
    {
        return self::open($tag, $attributes) . $content . self::close($tag);
    }
}
