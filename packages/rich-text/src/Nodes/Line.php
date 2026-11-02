<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Nodes;

use Frootbox\RichText\Content;
use Frootbox\RichText\NodeType;

/**
 * Inline content without an element of its own, for places that bring
 * their element along, e.g. a table cell:
 *
 *     {"type": "doc", "content": [{"type": "line", "content": [{"type": "text", "text": "8–18 Uhr"}]}]}
 *
 * gives "8–18 Uhr" without a <p> around it.
 */
final readonly class Line implements NodeType
{
    public const string NAME = 'line';

    public function name(): string
    {
        return self::NAME;
    }

    public function isInline(): bool
    {
        return false;
    }

    public function content(): Content
    {
        return Content::inline();
    }

    public function attributes(): array
    {
        return [];
    }

    public function toHtml(array $attributes, string $content): string
    {
        return $content;
    }

    public function toText(array $attributes, string $content): string
    {
        return $content;
    }
}
