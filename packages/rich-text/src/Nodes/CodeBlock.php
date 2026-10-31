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
 * <pre><code>, with the language as class "language-…" for highlighters.
 */
final readonly class CodeBlock implements NodeType
{
    public function name(): string
    {
        return 'codeBlock';
    }

    public function isInline(): bool
    {
        return false;
    }

    public function content(): Content
    {
        return Content::text();
    }

    public function attributes(): array
    {
        return ['language' => Attribute::text(maxLength: 30, pattern: '/^[a-z0-9+#-]+$/i')];
    }

    public function toHtml(array $attributes, string $content): string
    {
        $language = $attributes['language'] ?? null;

        return Html::element('pre', Html::element('code', $content, ['class' => null === $language ? null : 'language-' . $language]));
    }

    public function toText(array $attributes, string $content): string
    {
        return $content . "\n";
    }
}
