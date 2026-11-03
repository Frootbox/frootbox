<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

/**
 * The kinds of fields an admin adds to a collection (decision 0250), each
 * a field type of the core.
 */
enum FieldKind: string
{
    case Text = 'text';
    case LongText = 'longtext';
    case Number = 'number';
    case Date = 'date';
    case Boolean = 'boolean';
    case Link = 'link';
    case Choice = 'choice';
    case Image = 'image';
    case File = 'file';

    /**
     * The field type of the core.
     */
    public function type(): string
    {
        return match ($this) {
            self::Text, self::LongText => 'text',
            default => $this->value,
        };
    }

    public function title(): string
    {
        return match ($this) {
            self::Text => 'Text',
            self::LongText => 'Long text',
            self::Number => 'Number',
            self::Date => 'Date',
            self::Boolean => 'Yes or no',
            self::Link => 'Link',
            self::Choice => 'Choice from a list',
            self::Image => 'Image',
            self::File => 'File',
        };
    }

    /**
     * Whether it holds a value per language.
     */
    public function translatable(): bool
    {
        return \in_array($this, [self::Text, self::LongText, self::Link], true);
    }
}
