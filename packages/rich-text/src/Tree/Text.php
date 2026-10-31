<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Tree;

/**
 * A checked piece of text with its marks, sorted from outer to inner.
 */
final readonly class Text
{
    /**
     * @param list<Mark> $marks
     */
    public function __construct(
        public string $text,
        public array $marks = [],
    ) {}
}
