<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

use Frootbox\RichText\Tree\Mark;
use Frootbox\RichText\Tree\Node;
use Frootbox\RichText\Tree\Text;

/**
 * A checked document: what fits the schema, plus what did not.
 */
final readonly class Document
{
    /**
     * @param list<Violation> $violations
     */
    public function __construct(
        public Node $root,
        public array $violations,
    ) {}

    public function isValid(): bool
    {
        return [] === $this->violations;
    }

    public function isEmpty(): bool
    {
        return '' === $this->toText();
    }

    public function toHtml(): string
    {
        return $this->nodeHtml($this->root);
    }

    /**
     * Plain text, e.g. for search, previews or counting characters. Blocks
     * are separated by line breaks.
     */
    public function toText(): string
    {
        return trim((string) preg_replace("/\n{3,}/", "\n\n", $this->nodeText($this->root)));
    }

    private function nodeHtml(Node $node): string
    {
        return $node->type->toHtml($node->attributes, $this->childrenHtml($node->children));
    }

    /**
     * Renders children and their marks. A mark shared by neighbours stays
     * open, so a link over partly bold text becomes one <a>.
     *
     * @param list<Node|Text> $children
     */
    private function childrenHtml(array $children): string
    {
        $html = '';
        $open = [];

        foreach ($children as $child) {
            $marks = $child->marks;
            $keep = 0;

            while (isset($open[$keep], $marks[$keep]) && $open[$keep]->equals($marks[$keep])) {
                ++$keep;
            }

            $html .= $this->close($open, $keep);
            $open = \array_slice($open, 0, $keep);

            foreach (\array_slice($marks, $keep) as $mark) {
                $html .= $mark->type->open($mark->attributes);
                $open[] = $mark;
            }

            $html .= $child instanceof Text ? Html::escape($child->text) : $this->nodeHtml($child);
        }

        return $html . $this->close($open, 0);
    }

    /**
     * Closes open marks from the innermost down to position $keep.
     *
     * @param list<Mark> $open
     */
    private function close(array $open, int $keep): string
    {
        $html = '';

        for ($index = \count($open) - 1; $index >= $keep; --$index) {
            $html .= $open[$index]->type->close($open[$index]->attributes);
        }

        return $html;
    }

    private function nodeText(Node $node): string
    {
        $content = '';

        foreach ($node->children as $child) {
            $content .= $child instanceof Text ? $child->text : $this->nodeText($child);
        }

        return $node->type->toText($node->attributes, $content);
    }
}
