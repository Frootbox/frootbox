<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Support\Message;
use Frootbox\People\Data;
use Frootbox\People\Input;

/**
 * A location as its draft or published version holds it (decision 0226):
 * address, ways to reach it, coordinates for the map and texts by
 * language.
 */
final readonly class LocationData implements Data
{
    /**
     * @param array<mixed>|null            $image        The value of an image field: {"media": "01J…", "alt": "…"}
     * @param array<string, LocationText>  $translations By language
     */
    public function __construct(
        public array $translations = [],
        public string $street = '',
        public string $postalCode = '',
        public string $city = '',
        public string $country = '',
        public string $phone = '',
        public string $email = '',
        /** "53.5444, 9.9663" */
        public string $coordinates = '',
        public ?array $image = null,
    ) {}

    public static function fromArray(array $data): static
    {
        $translations = [];

        foreach (\is_array($data['translations'] ?? null) ? $data['translations'] : [] as $language => $text) {
            if (\is_array($text)) {
                $translations[(string) $language] = LocationText::fromArray($text);
            }
        }

        $text = static fn(string $key): string => \is_string($data[$key] ?? null) ? $data[$key] : '';

        return new self(
            $translations,
            $text('street'),
            $text('postalCode'),
            $text('city'),
            $text('country'),
            $text('phone'),
            $text('email'),
            $text('coordinates'),
            \is_array($data['image'] ?? null) ? $data['image'] : null,
        );
    }

    public function toArray(): array
    {
        return [
            'translations' => array_map(static fn(LocationText $text): array => $text->toArray(), $this->translations),
            'street' => $this->street,
            'postalCode' => $this->postalCode,
            'city' => $this->city,
            'country' => $this->country,
            'phone' => $this->phone,
            'email' => $this->email,
            'coordinates' => $this->coordinates,
            'image' => $this->image,
        ];
    }

    public function incomplete(): array
    {
        $errors = [];

        if ([] === $this->translations) {
            $errors['/translations'] = new Message('needs at least one language with a name.');
        }

        foreach ($this->translations as $language => $text) {
            if ('' === trim($text->name)) {
                $errors['/translations/' . $language . '/name'] = new Message('must not be empty.');
            }
        }

        return $errors;
    }

    /**
     * The texts in a language, else in the first one.
     */
    public function text(string $language): LocationText
    {
        return $this->translations[$language] ?? array_values($this->translations)[0] ?? new LocationText('');
    }

    /**
     * The language the texts come from: the one asked for or the first.
     */
    public function language(string $language): string
    {
        return isset($this->translations[$language]) ? $language : (string) array_key_first($this->translations);
    }

    /**
     * Street, postcode with town and country, without empty lines.
     *
     * @return list<string>
     */
    public function address(): array
    {
        return array_values(array_filter([$this->street, trim($this->postalCode . ' ' . $this->city), $this->country], static fn(string $line): bool => '' !== $line));
    }

    /**
     * Latitude and longitude, null without coordinates.
     *
     * @return array{float, float}|null
     */
    public function position(): ?array
    {
        return 1 === preg_match(Input::COORDINATES_PATTERN, $this->coordinates, $match) ? [(float) $match[1], (float) $match[2]] : null;
    }
}
