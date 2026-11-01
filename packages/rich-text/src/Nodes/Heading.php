<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Nodes;

use Closure;
use Frootbox\RichText\Attribute;
use Frootbox\RichText\Content;
use Frootbox\RichText\Html;
use Frootbox\RichText\NodeType;

/**
 * <h1> to <h6>. Limit the levels, e.g. new Heading([2, 3]) when the page
 * title is the only <h1>.
 *
 * With a function for the level the stored level is a rank instead: 1 for
 * a heading, 2 below it and so on. The page decides the level of each
 * heading, e.g. from where the text stands, and the rank goes along as
 * data-rank for the styles:
 *
 *     new Heading([1, 2, 3], fn(int $rank, string $content): int => $rank + 1)
 *     // <h2 data-rank="1">…</h2>
 */
final readonly class Heading implements NodeType
{
    /**
     * @param non-empty-list<int<1, 6>>        $levels
     * @param (Closure(int, string): int)|null $level  The level for a rank and the rendered content, kept between 1 and 6
     */
    public function __construct(
        private array $levels = [1, 2, 3, 4, 5, 6],
        private ?Closure $level = null,
    ) {}

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
        $stored = (int) ($attributes['level'] ?? $this->levels[0]);

        if (null === $this->level) {
            return Html::element('h' . $stored, $content);
        }

        return Html::element('h' . max(1, min(6, ($this->level)($stored, $content))), $content, ['data-rank' => $stored]);
    }

    public function toText(array $attributes, string $content): string
    {
        return $content . "\n";
    }
}
