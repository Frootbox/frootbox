<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

/**
 * A field of a collection for the API, the AI and the backend (decision
 * 0250), with how many entries have a value in it.
 */
final readonly class FieldSummary
{
    /**
     * @param array<string, string>                                    $labels  By language
     * @param list<array{key: string, labels: array<string, string>}> $options Of a choice
     */
    public function __construct(
        public string $name,
        public FieldKind $kind,
        public array $labels,
        public string $unit,
        public int $decimals,
        public array $options,
        public int $position,
        public int $used,
    ) {}

    public static function of(CollectionField $field, int $used): self
    {
        return new self($field->name, $field->kind(), $field->labels(), $field->unit(), $field->decimals(), $field->options(), $field->position, $used);
    }
}
