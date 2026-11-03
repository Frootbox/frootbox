<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Support\Message;
use Frootbox\People\Data;

/**
 * A person as the draft or published version holds it (decision 0226):
 * name, ways to reach the person, the locations and texts by language.
 */
final readonly class PersonData implements Data
{
    public const int ORDER_MAX = 999;

    /**
     * @param array<mixed>|null          $image        The value of an image field: {"media": "01J…", "alt": "…"}
     * @param list<string>               $locations    Ids of the locations
     * @param array<string, PersonText>  $translations By language
     */
    public function __construct(
        public string $givenName = '',
        public string $familyName = '',
        /** Before the name, e.g. "Dr." */
        public string $prefix = '',
        public string $email = '',
        public string $phone = '',
        public ?array $image = null,
        public array $locations = [],
        /** Smaller first, then by family name */
        public int $order = 0,
        public array $translations = [],
    ) {}

    public static function fromArray(array $data): static
    {
        $translations = [];

        foreach (\is_array($data['translations'] ?? null) ? $data['translations'] : [] as $language => $text) {
            if (\is_array($text)) {
                $translations[(string) $language] = PersonText::fromArray($text);
            }
        }

        $text = static fn(string $key): string => \is_string($data[$key] ?? null) ? $data[$key] : '';

        return new self(
            $text('givenName'),
            $text('familyName'),
            $text('prefix'),
            $text('email'),
            $text('phone'),
            \is_array($data['image'] ?? null) ? $data['image'] : null,
            array_values(array_filter(\is_array($data['locations'] ?? null) ? $data['locations'] : [], \is_string(...))),
            \is_int($data['order'] ?? null) ? $data['order'] : 0,
            $translations,
        );
    }

    public function toArray(): array
    {
        return [
            'givenName' => $this->givenName,
            'familyName' => $this->familyName,
            'prefix' => $this->prefix,
            'email' => $this->email,
            'phone' => $this->phone,
            'image' => $this->image,
            'locations' => $this->locations,
            'order' => $this->order,
            'translations' => array_map(static fn(PersonText $text): array => $text->toArray(), $this->translations),
        ];
    }

    public function incomplete(): array
    {
        return '' === $this->name() ? ['/familyName' => new Message('A person needs a name.')] : [];
    }

    /**
     * The full name, e.g. "Dr. Maria Rossi".
     */
    public function name(): string
    {
        return trim(implode(' ', array_filter([$this->prefix, $this->givenName, $this->familyName], static fn(string $part): bool => '' !== $part)));
    }

    /**
     * The texts in a language, else in the first one.
     */
    public function text(string $language): PersonText
    {
        return $this->translations[$language] ?? array_values($this->translations)[0] ?? new PersonText();
    }

    /**
     * The language the texts come from: the one asked for or the first.
     */
    public function language(string $language): string
    {
        return isset($this->translations[$language]) || [] === $this->translations ? $language : array_key_first($this->translations);
    }

    /**
     * How the team is ordered: by order, then by family and given name.
     *
     * @return array{int, string, string}
     */
    public function sortKey(): array
    {
        return [$this->order, mb_strtolower($this->familyName), mb_strtolower($this->givenName)];
    }
}
