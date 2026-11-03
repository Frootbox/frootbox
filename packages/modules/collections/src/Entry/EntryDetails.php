<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use DateTimeImmutable;

/**
 * An entry with its draft, published version and planned times.
 */
final readonly class EntryDetails
{
    /**
     * @param array<string, string> $urls Where visitors find it by language, e.g. {"de": "/entries/barista"}
     */
    public function __construct(
        public string $id,
        public EntryStatus $status,
        public ?int $version,
        public ?EntryData $draft,
        public ?EntryData $published,
        public ?DateTimeImmutable $publishAt = null,
        public ?DateTimeImmutable $unpublishAt = null,
        public array $urls = [],
    ) {}

    /**
     * The draft, else the published version.
     */
    public function current(): EntryData
    {
        return $this->draft ?? $this->published ?? new EntryData();
    }
}
