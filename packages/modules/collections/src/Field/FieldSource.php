<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

use Frootbox\Core\Language\Languages;
use Frootbox\Core\ObjectField\SpaceFieldSource;

/**
 * The fields of a collection for the core (decision 0250): the entries
 * take values in them, object_facts() shows them.
 */
final readonly class FieldSource implements SpaceFieldSource
{
    public function __construct(
        private CollectionFields $fields,
        private Languages $languages,
    ) {}

    public function fields(string $space): array
    {
        $languages = [$this->languages->default()->code];
        $result = [];

        foreach ($this->fields->ofSpace($space) as $field) {
            $result[$field->name] = $field->definition($languages);
        }

        return $result;
    }

    public function name(string $space): string
    {
        return \sprintf('frootbox/collections, fields of the collection "%s"', $space);
    }
}
