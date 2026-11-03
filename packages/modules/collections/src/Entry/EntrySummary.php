<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use DateTimeImmutable;

/**
 * An entry in the list of the backend.
 */
final readonly class EntrySummary
{
    /**
     * @param list<string> $languages The languages it has, in the draft if there is one
     */
    public function __construct(
        public string $id,
        public EntryStatus $status,
        public string $title,
        public int $order,
        public array $languages,
        public ?DateTimeImmutable $publishAt = null,
        public ?DateTimeImmutable $unpublishAt = null,
    ) {}
}
