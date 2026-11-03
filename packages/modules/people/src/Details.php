<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

/**
 * A person or a location with its draft and published version.
 *
 * @template T of Data
 */
final readonly class Details
{
    /**
     * @param T|null $draft
     * @param T|null                $published
     * @param array<string, string> $urls      The addresses of the profile by language (decision 0242)
     */
    public function __construct(
        public string $id,
        public Status $status,
        public ?int $version,
        public ?Data $draft,
        public ?Data $published,
        public array $urls = [],
    ) {}

    /**
     * @param array<string, string> $urls
     *
     * @return self<T>
     */
    public function withUrls(array $urls): self
    {
        return new self($this->id, $this->status, $this->version, $this->draft, $this->published, $urls);
    }

    /**
     * The draft, else the published version.
     *
     * @return T
     */
    public function current(): Data
    {
        return $this->draft ?? $this->published ?? throw new \LogicException('Details without a version.');
    }
}
