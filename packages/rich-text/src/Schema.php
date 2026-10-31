<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

use Frootbox\RichText\Marks\Link;
use Frootbox\RichText\Marks\TagMark;
use Frootbox\RichText\Nodes\CodeBlock;
use Frootbox\RichText\Nodes\Doc;
use Frootbox\RichText\Nodes\Heading;
use Frootbox\RichText\Nodes\OrderedList;
use Frootbox\RichText\Nodes\TagNode;

/**
 * The allowed nodes and marks. Everything else is left out.
 *
 * Marks are nested in the order they are added: earlier ones wrap later
 * ones, so a link around partly bold text stays one <a>.
 */
final readonly class Schema
{
    /** @var array<string, NodeType> */
    private array $nodes;

    /** @var array<string, MarkType> */
    private array $marks;

    /**
     * @param list<NodeType> $nodes
     * @param list<MarkType> $marks
     */
    public function __construct(array $nodes = [], array $marks = [])
    {
        $byName = [Doc::NAME => new Doc()];

        foreach ($nodes as $node) {
            $byName[$node->name()] = $node;
        }

        $this->nodes = $byName;
        $marksByName = [];

        foreach ($marks as $mark) {
            $marksByName[$mark->name()] = $mark;
        }

        $this->marks = $marksByName;
    }

    /**
     * The nodes and marks of Tiptap's StarterKit plus link, underline,
     * subscript and superscript.
     */
    public static function standard(): self
    {
        return new self(
            [
                TagNode::paragraph(),
                new Heading(),
                TagNode::blockquote(),
                TagNode::bulletList(),
                new OrderedList(),
                TagNode::listItem(),
                new CodeBlock(),
                TagNode::hardBreak(),
                TagNode::horizontalRule(),
            ],
            [
                new Link(),
                new TagMark('bold', 'strong'),
                new TagMark('italic', 'em'),
                new TagMark('underline', 'u'),
                new TagMark('strike', 's'),
                new TagMark('subscript', 'sub'),
                new TagMark('superscript', 'sup'),
                new TagMark('code', 'code'),
            ],
        );
    }

    /**
     * Adds a node or replaces the one with the same name.
     */
    public function withNode(NodeType $node): self
    {
        return new self(array_values([...$this->nodes, $node->name() => $node]), array_values($this->marks));
    }

    /**
     * Adds a mark or replaces the one with the same name, keeping its place.
     */
    public function withMark(MarkType $mark): self
    {
        return new self(array_values($this->nodes), array_values([...$this->marks, $mark->name() => $mark]));
    }

    public function withoutNode(string $name): self
    {
        $nodes = $this->nodes;
        unset($nodes[$name]);

        return new self(array_values($nodes), array_values($this->marks));
    }

    public function withoutMark(string $name): self
    {
        $marks = $this->marks;
        unset($marks[$name]);

        return new self(array_values($this->nodes), array_values($marks));
    }

    public function node(string $name): ?NodeType
    {
        return $this->nodes[$name] ?? null;
    }

    public function mark(string $name): ?MarkType
    {
        return $this->marks[$name] ?? null;
    }

    /**
     * Position of a mark in the nesting order, outer marks first.
     */
    public function rank(string $mark): int
    {
        $position = array_search($mark, array_keys($this->marks), true);

        return false === $position ? \PHP_INT_MAX : $position;
    }
}
