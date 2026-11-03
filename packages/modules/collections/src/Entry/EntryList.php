<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

/**
 * A page of the list of entries.
 */
final readonly class EntryList
{
    /**
     * @param list<EntrySummary> $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $page,
        public int $pages,
    ) {}
}
