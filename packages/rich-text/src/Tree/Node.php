<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Tree;

use Frootbox\RichText\NodeType;

/**
 * A checked node of a document.
 */
final readonly class Node
{
    /**
     * @param array<string, string|int|null> $attributes
     * @param list<Node|Text>                 $children
     * @param list<Mark>                      $marks      Only for inline nodes
     */
    public function __construct(
        public NodeType $type,
        public array $attributes = [],
        public array $children = [],
        public array $marks = [],
    ) {}
}
