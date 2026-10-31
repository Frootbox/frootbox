<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

/**
 * Reads Tiptap and ProseMirror JSON and turns it into safe HTML or plain
 * text. Only nodes, marks and attributes of the schema reach the output.
 *
 *     $richText = RichText::standard();
 *     echo $richText->toHtml($json);
 *     $violations = $richText->validate($json);
 *
 *     // Own nodes and marks:
 *     $richText = RichText::standard()->withNode(new Callout())->withMark(new Link(['https']));
 */
final readonly class RichText
{
    public function __construct(public Schema $schema = new Schema()) {}

    public static function standard(): self
    {
        return new self(Schema::standard());
    }

    public function withNode(NodeType $node): self
    {
        return new self($this->schema->withNode($node));
    }

    public function withMark(MarkType $mark): self
    {
        return new self($this->schema->withMark($mark));
    }

    /**
     * @param mixed $document Decoded JSON, a JSON string, or null for an empty document
     */
    public function read(mixed $document): Document
    {
        return new Reader($this->schema)->read($document);
    }

    public function toHtml(mixed $document): string
    {
        return $this->read($document)->toHtml();
    }

    public function toText(mixed $document): string
    {
        return $this->read($document)->toText();
    }

    /**
     * @return list<Violation> Empty if the document fits the schema
     */
    public function validate(mixed $document): array
    {
        return $this->read($document)->violations;
    }
}
