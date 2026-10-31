<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

use Frootbox\RichText\Nodes\Doc;
use Frootbox\RichText\Tree\Mark;
use Frootbox\RichText\Tree\Node;
use Frootbox\RichText\Tree\Text;
use JsonException;

/**
 * Reads a JSON document into a checked tree. What does not fit the schema
 * is left out and reported as a violation.
 */
final class Reader
{
    private const int MAX_DEPTH = 100;

    /** @var list<Violation> */
    private array $violations = [];

    public function __construct(private readonly Schema $schema) {}

    /**
     * @param mixed $document Decoded JSON, a JSON string, or null for an empty document
     */
    public function read(mixed $document): Document
    {
        $this->violations = [];
        $root = new Doc();

        if (null === $document || '' === $document) {
            return new Document(new Node($root), []);
        }

        if (\is_string($document)) {
            try {
                $document = json_decode($document, true, 512, \JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                return new Document(new Node($root), [new Violation('', 'is not valid JSON')]);
            }
        }

        if (!\is_array($document) || Doc::NAME !== ($document['type'] ?? null)) {
            return new Document(new Node($root), [new Violation('', 'must be a document with "type": "doc"')]);
        }

        $node = new Node($root, [], $this->children($document['content'] ?? null, $root, '', 0));

        return new Document($node, $this->violations);
    }

    /**
     * @return list<Node|Text>
     */
    private function children(mixed $content, NodeType $parent, string $path, int $depth): array
    {
        if (null === $content || [] === $content) {
            return [];
        }

        if (!\is_array($content) || !array_is_list($content)) {
            $this->violation($path . '/content', 'must be a list of nodes');

            return [];
        }

        if ($parent->content()->isNone()) {
            $this->violation($path . '/content', \sprintf('"%s" has no content', $parent->name()));

            return [];
        }

        $children = [];

        foreach ($content as $index => $raw) {
            $at = $path . '/content/' . $index;
            $child = \is_array($raw) ? $this->child($raw, $parent, $at, $depth) : $this->violation($at, 'must be a node with a "type"');

            if (null !== $child) {
                $children[] = $child;
            }
        }

        return $children;
    }

    /**
     * @param array<mixed> $raw
     */
    private function child(array $raw, NodeType $parent, string $at, int $depth): Node|Text|null
    {
        $name = $raw['type'] ?? null;

        if (!\is_string($name)) {
            return $this->violation($at, 'must be a node with a "type"');
        }

        if ('text' === $name) {
            return $this->text($raw, $parent, $at);
        }

        $type = Doc::NAME === $name ? null : $this->schema->node($name);

        if (null === $type) {
            return $this->violation($at . '/type', \sprintf('unknown node "%s"', $name));
        }

        if (!$parent->content()->allowsNode($type)) {
            return $this->violation($at, \sprintf('"%s" is not allowed in "%s"', $name, $parent->name()));
        }

        if ($depth >= self::MAX_DEPTH) {
            return $this->violation($at, 'is nested too deeply');
        }

        return new Node(
            $type,
            $this->attributes($type->attributes(), $raw['attrs'] ?? null, $at),
            $this->children($raw['content'] ?? null, $type, $at, $depth + 1),
            $type->isInline() ? $this->marks($raw['marks'] ?? null, $parent, $at) : [],
        );
    }

    /**
     * @param array<mixed> $raw
     */
    private function text(array $raw, NodeType $parent, string $at): ?Text
    {
        if (!$parent->content()->allowsText()) {
            return $this->violation($at, \sprintf('text is not allowed in "%s"', $parent->name()));
        }

        $text = $raw['text'] ?? null;

        if (!\is_string($text) || '' === $text) {
            return $this->violation($at . '/text', 'must be text, not empty');
        }

        return new Text($text, $this->marks($raw['marks'] ?? null, $parent, $at));
    }

    /**
     * @return list<Mark>
     */
    private function marks(mixed $raw, NodeType $parent, string $at): array
    {
        if (null === $raw || [] === $raw) {
            return [];
        }

        if (!$parent->content()->allowsMarks()) {
            $this->violation($at . '/marks', \sprintf('marks are not allowed in "%s"', $parent->name()));

            return [];
        }

        if (!\is_array($raw) || !array_is_list($raw)) {
            $this->violation($at . '/marks', 'must be a list of marks');

            return [];
        }

        $marks = [];

        foreach ($raw as $index => $mark) {
            $path = $at . '/marks/' . $index;
            $name = \is_array($mark) ? ($mark['type'] ?? null) : null;

            if (!\is_array($mark) || !\is_string($name)) {
                $this->violation($path, 'must be a mark with a "type"');

                continue;
            }

            $type = $this->schema->mark($name);

            if (null === $type) {
                $this->violation($path . '/type', \sprintf('unknown mark "%s"', $name));

                continue;
            }

            $attributes = $this->attributes($type->attributes(), $mark['attrs'] ?? null, $path);

            // A mark without a required value, e.g. a link without href, is left out.
            foreach ($type->attributes() as $key => $attribute) {
                if ($attribute->required && null === $attributes[$key]) {
                    continue 2;
                }
            }

            $marks[$name] ??= new Mark($type, $attributes);
        }

        $marks = array_values($marks);
        usort($marks, fn(Mark $a, Mark $b): int => $this->schema->rank($a->type->name()) <=> $this->schema->rank($b->type->name()));

        return $marks;
    }

    /**
     * @param array<string, Attribute> $allowed
     *
     * @return array<string, string|int|null>
     */
    private function attributes(array $allowed, mixed $raw, string $at): array
    {
        if (null !== $raw && !\is_array($raw)) {
            $this->violation($at . '/attrs', 'must be an object');
        }

        $values = \is_array($raw) ? $raw : [];
        $attributes = [];

        foreach ($allowed as $name => $attribute) {
            [$value, $error] = $attribute->clean($values[$name] ?? null);
            $attributes[$name] = $value;

            if (null !== $error) {
                $this->violation($at . '/attrs/' . $name, $error);
            }
        }

        return $attributes;
    }

    private function violation(string $pointer, string $message): null
    {
        $this->violations[] = new Violation($pointer, $message);

        return null;
    }
}
