<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

use Closure;
use Dom\Element;
use Dom\HTMLDocument;
use Dom\Node;
use Dom\Text;

/**
 * Turns HTML, e.g. from an older CMS, into a document of the standard
 * schema as Tiptap stores it:
 *
 *     new HtmlReader()->read('<p>We roast on <b>Mondays</b>.</p>')
 *     // ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [...]]]]
 *
 * Paragraphs, headings, lists, quotes, code, rules, breaks, links and the
 * marks of the standard schema are kept, wrappers such as <div> and
 * <span> are unwrapped, whitespace is collapsed as a browser does. Text
 * outside a block becomes a paragraph, paragraphs of only spaces such as
 * "&nbsp;" are left out. Headings keep their order as rank
 * 1 to 3 below the heading of the block: h1 and h2 become 1, h3 becomes 2,
 * everything below 3 (decision 0129). Elements without a counterpart,
 * such as images, tables or scripts, are left out and named by dropped().
 *
 * The optional $href decides about each link: it gets the address and
 * gives the one to keep, e.g. "page:01J…" for a page (decision 0105), or
 * null to keep only the text.
 */
final class HtmlReader
{
    private const array BLOCK = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'hr', 'div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'nav', 'figure', 'figcaption', 'address', 'center', 'table', 'dl', 'form', 'fieldset', 'details', 'summary'];

    private const array MARKS = ['strong' => 'bold', 'b' => 'bold', 'em' => 'italic', 'i' => 'italic', 'u' => 'underline', 's' => 'strike', 'strike' => 'strike', 'del' => 'strike', 'sub' => 'subscript', 'sup' => 'superscript'];

    /** Wrappers whose content counts, inline or as blocks. */
    private const array UNWRAP = ['div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'nav', 'center', 'address', 'span', 'font', 'small', 'big', 'abbr', 'cite', 'mark', 'time', 'label', 'q', 'dfn', 'var', 'samp', 'kbd', 'code', 'tt', 'ins'];

    /** @var array<string, true> Elements left out in the last read */
    private array $dropped = [];

    /**
     * @param (Closure(string): ?string)|null $href
     */
    public function __construct(private readonly ?Closure $href = null) {}

    /**
     * @return array{type: 'doc', content: list<array<string, mixed>>}
     */
    public function read(string $html): array
    {
        $this->dropped = [];
        $document = HTMLDocument::createFromString('<!DOCTYPE html><html><body>' . $html . '</body></html>', \LIBXML_NOERROR, 'UTF-8');
        $body = $document->body;

        return ['type' => 'doc', 'content' => null === $body ? [] : $this->blocks($body)];
    }

    /**
     * The names of the elements left out in the last read, e.g. ["img", "table"].
     *
     * @return list<string>
     */
    public function dropped(): array
    {
        $names = array_keys($this->dropped);
        sort($names);

        return $names;
    }

    /**
     * The blocks of a parent; inline content between them becomes a paragraph.
     *
     * @return list<array<string, mixed>>
     */
    private function blocks(Node $parent): array
    {
        $blocks = [];
        $run = [];

        foreach ($parent->childNodes as $child) {
            $name = $child instanceof Element ? strtolower($child->localName) : null;

            if (!$child instanceof Element || null === $name || !\in_array($name, self::BLOCK, true)) {
                $run[] = $child;

                continue;
            }

            $blocks = [...$blocks, ...$this->paragraph($run), ...$this->block($child, $name)];
            $run = [];
        }

        return [...$blocks, ...$this->paragraph($run)];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function block(Element $element, string $name): array
    {
        return match ($name) {
            'p' => $this->paragraph([...$element->childNodes]),
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6' => $this->heading($element, (int) $name[1]),
            'ul', 'ol' => $this->list($element, $name),
            'li' => $this->blocks($element),
            'blockquote' => [] === ($content = $this->blocks($element)) ? [] : [['type' => 'blockquote', 'content' => $content]],
            'pre' => '' === trim($element->textContent ?? '') ? [] : [['type' => 'codeBlock', 'content' => [['type' => 'text', 'text' => rtrim($element->textContent ?? '')]]]],
            'hr' => [['type' => 'horizontalRule']],
            'div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'nav', 'center', 'address' => $this->blocks($element),
            default => $this->drop($name),
        };
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function heading(Element $element, int $level): array
    {
        $content = $this->trim($this->inline([...$element->childNodes], []));

        return [] === $content ? [] : [['type' => 'heading', 'attrs' => ['level' => max(1, min(3, $level - 1))], 'content' => $content]];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function list(Element $element, string $name): array
    {
        $items = [];

        foreach ($element->childNodes as $child) {
            if ($child instanceof Element && 'li' === strtolower($child->localName)) {
                $content = $this->blocks($child);
                $items[] = ['type' => 'listItem', 'content' => [] === $content ? [['type' => 'paragraph']] : $content];
            } elseif ($child instanceof Element && \in_array(strtolower($child->localName), ['ul', 'ol'], true) && [] !== $items) {
                // A list right inside a list belongs to the item before it.
                $last = array_pop($items);
                $items[] = ['type' => 'listItem', 'content' => [...$last['content'], ...$this->list($child, strtolower($child->localName))]];
            }
        }

        if ([] === $items) {
            return [];
        }

        return [['type' => 'ol' === $name ? 'orderedList' : 'bulletList', 'content' => $items]];
    }

    /**
     * A paragraph of inline nodes, none if only whitespace is left.
     *
     * @param list<Node> $nodes
     *
     * @return list<array<string, mixed>>
     */
    private function paragraph(array $nodes): array
    {
        $content = $this->trim($this->inline($nodes, []));
        $text = implode('', array_map(fn(array $node): string => $this->text($node), $content));

        // Paragraphs of only spaces, e.g. "&nbsp;" as room between others, are left out.
        if (\count($content) === \count(array_filter($content, static fn(array $node): bool => 'text' === $node['type'])) && '' === trim($text, " \u{a0}")) {
            return [];
        }

        return [['type' => 'paragraph', 'content' => $content]];
    }

    /**
     * @param list<Node>                       $nodes
     * @param list<array<string, mixed>>       $marks
     *
     * @return list<array<string, mixed>>
     */
    private function inline(array $nodes, array $marks): array
    {
        $content = [];

        foreach ($nodes as $node) {
            if ($node instanceof Text) {
                $text = (string) preg_replace('/[ \t\n\r\f]+/', ' ', $node->data);

                if ('' !== $text) {
                    $content[] = [] === $marks ? ['type' => 'text', 'text' => $text] : ['type' => 'text', 'text' => $text, 'marks' => $marks];
                }

                continue;
            }

            if (!$node instanceof Element) {
                continue;
            }

            $name = strtolower($node->localName);
            $children = [...$node->childNodes];

            if ('br' === $name) {
                $content[] = ['type' => 'hardBreak'];
            } elseif (isset(self::MARKS[$name])) {
                $content = [...$content, ...$this->inline($children, $this->withMark($marks, ['type' => self::MARKS[$name]]))];
            } elseif ('a' === $name) {
                $content = [...$content, ...$this->inline($children, $this->withLink($marks, $node))];
            } elseif (\in_array($name, self::UNWRAP, true)) {
                $content = [...$content, ...$this->inline($children, $marks)];
            } elseif (\in_array($name, self::BLOCK, true)) {
                // A block inside inline content, e.g. <p> in <a>: its text stays.
                $content = [...$content, ...$this->inline($children, $marks)];
            } else {
                $this->drop($name);
            }
        }

        return $content;
    }

    /**
     * @param list<array<string, mixed>> $marks
     * @param array<string, mixed>       $mark
     *
     * @return list<array<string, mixed>>
     */
    private function withMark(array $marks, array $mark): array
    {
        foreach ($marks as $existing) {
            if ($existing['type'] === $mark['type']) {
                return $marks;
            }
        }

        return [...$marks, $mark];
    }

    /**
     * @param list<array<string, mixed>> $marks
     *
     * @return list<array<string, mixed>>
     */
    private function withLink(array $marks, Element $link): array
    {
        $href = trim($link->getAttribute('href') ?? '');
        $href = null === $this->href ? $href : ($this->href)($href);

        if (null === $href || '' === $href) {
            return $marks;
        }

        $attributes = ['href' => $href];

        if ('_blank' === $link->getAttribute('target')) {
            $attributes['target'] = '_blank';
        }

        return $this->withMark($marks, ['type' => 'link', 'attrs' => $attributes]);
    }

    /**
     * Joins neighbours with the same marks and removes whitespace at the
     * start, at the end and around breaks, as a browser shows it.
     *
     * @param list<array<string, mixed>> $content
     *
     * @return list<array<string, mixed>>
     */
    private function trim(array $content): array
    {
        $joined = [];

        foreach ($content as $node) {
            $last = array_key_last($joined);

            if (null !== $last && 'text' === $node['type'] && 'text' === $joined[$last]['type'] && ($node['marks'] ?? []) === ($joined[$last]['marks'] ?? [])) {
                $joined[$last]['text'] = $this->text($joined[$last]) . $this->text($node);
                $joined[$last]['text'] = (string) preg_replace('/ {2,}/', ' ', $joined[$last]['text']);

                continue;
            }

            $joined[] = $node;
        }

        $count = \count($joined);

        foreach ($joined as $index => $node) {
            if ('text' !== $node['type']) {
                continue;
            }

            $text = $this->text($node);

            if (0 === $index || 'hardBreak' === $joined[$index - 1]['type'] || str_ends_with($this->text($joined[$index - 1]), ' ')) {
                $text = ltrim($text, ' ');
            }

            if ($index === $count - 1 || 'hardBreak' === $joined[$index + 1]['type']) {
                $text = rtrim($text, ' ');
            }

            $joined[$index]['text'] = $text;
        }

        $joined = array_values(array_filter($joined, fn(array $node): bool => 'text' !== $node['type'] || '' !== $this->text($node)));

        // Breaks at the end show nothing.
        while ([] !== $joined && 'hardBreak' === $joined[array_key_last($joined)]['type']) {
            array_pop($joined);
        }

        return $joined;
    }

    /**
     * @param array<string, mixed> $node
     */
    private function text(array $node): string
    {
        return \is_string($node['text'] ?? null) ? $node['text'] : '';
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function drop(string $name): array
    {
        $this->dropped[$name] = true;

        return [];
    }
}
