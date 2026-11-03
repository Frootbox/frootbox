<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use DateTimeImmutable;

/**
 * An entry online on the website.
 */
final readonly class PublishedEntry
{
    /**
     * @param DateTimeImmutable      $posted The day it was first published
     * @param DateTimeImmutable|null $until  When it goes offline by itself
     */
    public function __construct(
        public string $id,
        public EntryData $data,
        public DateTimeImmutable $posted,
        public ?DateTimeImmutable $until = null,
    ) {}
}
