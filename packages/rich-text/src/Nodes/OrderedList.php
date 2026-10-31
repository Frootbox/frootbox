<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Nodes;

use Frootbox\RichText\Attribute;
use Frootbox\RichText\Content;
use Frootbox\RichText\Html;
use Frootbox\RichText\NodeType;

/**
 * <ol>, optionally starting at another number.
 */
final readonly class OrderedList implements NodeType
{
    public function name(): string
    {
        return 'orderedList';
    }

    public function isInline(): bool
    {
        return false;
    }

    public function content(): Content
    {
        return Content::only('listItem');
    }

    public function attributes(): array
    {
        return ['start' => Attribute::integer(1, min: 0)];
    }

    public function toHtml(array $attributes, string $content): string
    {
        $start = (int) ($attributes['start'] ?? 1);

        return Html::element('ol', $content, ['start' => 1 === $start ? null : $start]);
    }

    public function toText(array $attributes, string $content): string
    {
        return $content;
    }
}
