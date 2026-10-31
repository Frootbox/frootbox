<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Marks;

use Frootbox\RichText\Html;
use Frootbox\RichText\MarkType;

/**
 * A mark that becomes one HTML element, e.g. new TagMark('bold', 'strong').
 */
final readonly class TagMark implements MarkType
{
    public function __construct(
        private string $name,
        private string $tag,
    ) {}

    public function name(): string
    {
        return $this->name;
    }

    public function attributes(): array
    {
        return [];
    }

    public function open(array $attributes): string
    {
        return Html::open($this->tag);
    }

    public function close(array $attributes): string
    {
        return Html::close($this->tag);
    }
}
