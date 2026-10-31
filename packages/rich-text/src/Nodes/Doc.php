<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Nodes;

use Frootbox\RichText\Content;
use Frootbox\RichText\NodeType;

/**
 * The root of every document.
 */
final readonly class Doc implements NodeType
{
    public const string NAME = 'doc';

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
        return Content::blocks();
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
