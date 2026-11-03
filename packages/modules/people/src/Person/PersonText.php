<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

/**
 * The texts of a person in one language.
 */
final readonly class PersonText
{
    public const int ROLE_LENGTH = 200;
    public const int TEXT_LENGTH = 1000;

    public function __construct(
        /** What the person does, e.g. "Head roaster" */
        public string $role = '',
        /** A few sentences about the person */
        public string $text = '',
    ) {}

    /**
     * @param array<mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            \is_string($data['role'] ?? null) ? $data['role'] : '',
            \is_string($data['text'] ?? null) ? $data['text'] : '',
        );
    }

    /**
     * @return array{role: string, text: string}
     */
    public function toArray(): array
    {
        return ['role' => $this->role, 'text' => $this->text];
    }
}
