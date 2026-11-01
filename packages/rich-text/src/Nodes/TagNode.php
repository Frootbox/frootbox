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
 * A node that becomes one HTML element, e.g.
 * new TagNode('paragraph', 'p', Content::inline()).
 *
 * Without content it is a void element such as <br> or <hr>. With
 * $directional it takes an optional "dir", "ltr" or "rtl", for text that
 * runs the other way than the text around it.
 */
final readonly class TagNode implements NodeType
{
    public function __construct(
        private string $name,
        private string $tag,
        private Content $content,
        private bool $inline = false,
        private bool $directional = false,
    ) {}

    public static function paragraph(): self
    {
        return new self('paragraph', 'p', Content::inline(), directional: true);
    }

    public static function blockquote(): self
    {
        return new self('blockquote', 'blockquote', Content::blocks(), directional: true);
    }

    public static function bulletList(): self
    {
        return new self('bulletList', 'ul', Content::only('listItem'));
    }

    public static function listItem(): self
    {
        return new self('listItem', 'li', Content::blocks());
    }

    public static function hardBreak(): self
    {
        return new self('hardBreak', 'br', Content::none(), inline: true);
    }

    public static function horizontalRule(): self
    {
        return new self('horizontalRule', 'hr', Content::none());
    }

    public function name(): string
    {
        return $this->name;
    }

    public function isInline(): bool
    {
        return $this->inline;
    }

    public function content(): Content
    {
        return $this->content;
    }

    public function attributes(): array
    {
        return $this->directional ? ['dir' => Attribute::direction()] : [];
    }

    public function toHtml(array $attributes, string $content): string
    {
        if ($this->content->isNone()) {
            return Html::open($this->tag);
        }

        return Html::element($this->tag, $content, $this->directional ? ['dir' => $attributes['dir'] ?? null] : []);
    }

    public function toText(array $attributes, string $content): string
    {
        if ($this->content->isNone()) {
            return "\n";
        }

        // Containers such as lists hold blocks that end with a line break already.
        return $this->content->allowsText() ? $content . "\n" : $content;
    }
}
