<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

/**
 * What a node may contain.
 */
final readonly class Content
{
    /**
     * @param list<string> $names
     */
    private function __construct(
        private string $kind,
        private array $names = [],
    ) {}

    /** Block nodes such as paragraphs and lists. */
    public static function blocks(): self
    {
        return new self('blocks');
    }

    /** Text with marks and inline nodes such as hard breaks. */
    public static function inline(): self
    {
        return new self('inline');
    }

    /** Only plain text, without marks, e.g. in a code block. */
    public static function text(): self
    {
        return new self('text');
    }

    /** Nothing, e.g. a horizontal rule. */
    public static function none(): self
    {
        return new self('none');
    }

    /** Only the named nodes, e.g. list items in a list. */
    public static function only(string ...$names): self
    {
        return new self('only', array_values($names));
    }

    public function allowsNode(NodeType $node): bool
    {
        return match ($this->kind) {
            'blocks' => !$node->isInline(),
            'inline' => $node->isInline(),
            'only' => \in_array($node->name(), $this->names, true),
            default => false,
        };
    }

    public function isNone(): bool
    {
        return 'none' === $this->kind;
    }

    public function allowsText(): bool
    {
        return 'inline' === $this->kind || 'text' === $this->kind;
    }

    public function allowsMarks(): bool
    {
        return 'inline' === $this->kind;
    }
}
