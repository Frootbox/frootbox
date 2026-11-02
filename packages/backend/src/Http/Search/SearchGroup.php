<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Search;

/**
 * Hits of one kind in the backend search, e.g. all pages.
 */
final readonly class SearchGroup
{
    /**
     * @param list<SearchItem> $items
     */
    public function __construct(
        public string $title,
        public array $items,
    ) {}
}
