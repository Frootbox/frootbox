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
 * <h1> to <h6>. Limit the levels, e.g. new Heading([2, 3]) when the page
 * title is the only <h1>.
 */
final readonly class Heading implements NodeType
{
    /**
     * @param non-empty-list<int<1, 6>> $levels
     */
    public function __construct(private array $levels = [1, 2, 3, 4, 5, 6]) {}

    public function name(): string
    {
        return 'heading';
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
        return ['level' => Attribute::choice($this->levels, $this->levels[0])];
    }

    public function toHtml(array $attributes, string $content): string
    {
        return Html::element('h' . (int) ($attributes['level'] ?? $this->levels[0]), $content);
    }

    public function toText(array $attributes, string $content): string
    {
        return $content . "\n";
    }
}
