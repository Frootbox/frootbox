<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Tree;

use Frootbox\RichText\MarkType;

/**
 * A checked mark on text or an inline node.
 */
final readonly class Mark
{
    /**
     * @param array<string, string|int|null> $attributes
     */
    public function __construct(
        public MarkType $type,
        public array $attributes = [],
    ) {}

    public function equals(self $other): bool
    {
        return $this->type->name() === $other->type->name() && $this->attributes === $other->attributes;
    }
}
