<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

/**
 * The texts of a location in one language.
 */
final readonly class LocationText
{
    public const int NAME_LENGTH = 200;
    public const int HOURS_LENGTH = 1000;
    public const int TEXT_LENGTH = 1000;

    public function __construct(
        /** e.g. "Café am Hafen" */
        public string $name,
        /** Opening hours, one line per range, e.g. "Mo–Fr 8–18 Uhr" */
        public string $hours = '',
        /** A few sentences about the location, e.g. how to get there */
        public string $text = '',
    ) {}

    /**
     * @param array<mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            \is_string($data['name'] ?? null) ? $data['name'] : '',
            \is_string($data['hours'] ?? null) ? $data['hours'] : '',
            \is_string($data['text'] ?? null) ? $data['text'] : '',
        );
    }

    /**
     * @return array{name: string, hours: string, text: string}
     */
    public function toArray(): array
    {
        return ['name' => $this->name, 'hours' => $this->hours, 'text' => $this->text];
    }
}
