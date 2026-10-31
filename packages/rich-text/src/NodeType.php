<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

/**
 * A kind of node, e.g. "paragraph" or "heading". Its name is the "type" in
 * the JSON document.
 */
interface NodeType
{
    public function name(): string;

    /** Inline nodes sit in text, e.g. a hard break. Others are blocks. */
    public function isInline(): bool;

    public function content(): Content;

    /**
     * Allowed attributes. Others are ignored.
     *
     * @return array<string, Attribute>
     */
    public function attributes(): array;

    /**
     * @param array<string, string|int|null> $attributes Checked values of attributes()
     * @param string                          $content    The rendered HTML of the children
     */
    public function toHtml(array $attributes, string $content): string;

    /**
     * @param array<string, string|int|null> $attributes
     * @param string                          $content    The plain text of the children
     */
    public function toText(array $attributes, string $content): string;
}
