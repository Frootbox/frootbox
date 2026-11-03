<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Website;

use Frootbox\Core\Field\Field;
use Frootbox\Core\Field\FieldTypes;
use Frootbox\Core\Language\Languages;
use Frootbox\People\Location\LocationData;
use Frootbox\People\Location\LocationStore;
use Frootbox\People\Person\PersonData;
use Frootbox\People\Person\PersonStore;
use Twig\Markup;

/**
 * People and locations as the views of the blocks use them: published
 * versions only, texts in the language of the visitor or the first one,
 * images as HTML and the ways to reach them as links (decision 0226).
 */
final readonly class Cards
{
    /** A photo in the team: four columns on wide screens. */
    public const string PHOTO_SIZES = '(min-width: 72rem) 16rem, (min-width: 40rem) 33vw, 50vw';

    /** The image of a location beside its address. */
    public const string IMAGE_SIZES = '(min-width: 72rem) 36rem, (min-width: 48rem) 50vw, 100vw';

    public function __construct(
        private PersonStore $people,
        private LocationStore $locations,
        private FieldTypes $types,
        private Languages $languages,
    ) {}

    /**
     * The published people, in the order of the team, of one location or all.
     *
     * @return list<array<string, mixed>>
     */
    public function team(string $language, ?string $location = null): array
    {
        $people = array_filter($this->people->allPublished(), static fn(PersonData $person): bool => null === $location || \in_array($location, $person->locations, true));
        uasort($people, static fn(PersonData $a, PersonData $b): int => $a->sortKey() <=> $b->sortKey());
        $locations = $this->locations->allPublished();

        return array_map(fn(string $id, PersonData $person): array => $this->person($id, $person, $language, $locations), array_keys($people), $people);
    }

    /**
     * One published person, null if there is none.
     *
     * @return array<string, mixed>|null
     */
    public function contact(string $id, string $language): ?array
    {
        $person = '' === $id ? null : $this->people->published($id);

        return null === $person ? null : $this->person($id, $person, $language, $this->locations->allPublished());
    }

    /**
     * One published location with its structured data, null if there is none.
     *
     * @return array<string, mixed>|null
     */
    public function location(string $id, string $language): ?array
    {
        $location = '' === $id ? null : $this->locations->published($id);

        if (null === $location) {
            return null;
        }

        $text = $location->text($language);

        return [
            'id' => $id,
            ...$this->attributes($location->language($language), $language),
            'name' => $text->name,
            'address' => $location->address(),
            'phone' => $location->phone,
            'phoneHref' => self::tel($location->phone),
            'email' => $location->email,
            'hours' => self::lines($text->hours),
            'text' => $text->text,
            'coordinates' => $location->coordinates,
            'image' => $this->image($location->image, null, self::IMAGE_SIZES),
            'data' => new Markup(self::json($this->structured($location, $text->name)), 'UTF-8'),
        ];
    }

    /**
     * @param array<string, LocationData> $locations
     *
     * @return array<string, mixed>
     */
    private function person(string $id, PersonData $person, string $language, array $locations): array
    {
        $text = $person->text($language);

        return [
            'id' => $id,
            ...$this->attributes($person->language($language), $language),
            'name' => $person->name(),
            'role' => $text->role,
            'text' => $text->text,
            'phone' => $person->phone,
            'phoneHref' => self::tel($person->phone),
            'email' => $person->email,
            'image' => $this->image($person->image, '1:1', self::PHOTO_SIZES),
            'locations' => array_values(array_filter(array_map(static fn(string $location): string => isset($locations[$location]) ? $locations[$location]->text($language)->name : '', $person->locations), static fn(string $name): bool => '' !== $name)),
        ];
    }

    /**
     * lang and dir where the texts come from another language.
     *
     * @return array{lang: string|null, dir: string|null}
     */
    private function attributes(string $from, string $language): array
    {
        if ($from === $language || !$this->languages->has($from)) {
            return ['lang' => null, 'dir' => null];
        }

        return ['lang' => $from, 'dir' => $this->languages->get($from)->direction->value];
    }

    /**
     * @param array<mixed>|null $image
     */
    private function image(?array $image, ?string $ratio, string $sizes): Markup|string
    {
        if (null === $image) {
            return '';
        }

        $output = $this->types->get('image')->output($image, new Field('image', 'image', 'Image', settings: array_filter(['ratio' => $ratio, 'sizes' => $sizes], static fn(?string $value): bool => null !== $value)));

        return $output instanceof Markup ? $output : (\is_string($output) ? $output : '');
    }

    /**
     * A place for search engines (schema.org), with address, ways to
     * reach it and the coordinates.
     *
     * @return array<string, mixed>
     */
    private function structured(LocationData $location, string $name): array
    {
        $position = $location->position();

        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Place',
            'name' => $name,
            'address' => [] === $location->address() ? null : array_filter([
                '@type' => 'PostalAddress',
                'streetAddress' => $location->street,
                'postalCode' => $location->postalCode,
                'addressLocality' => $location->city,
                'addressCountry' => $location->country,
            ], static fn(string $value): bool => '' !== $value),
            'telephone' => $location->phone,
            'email' => $location->email,
            'geo' => null === $position ? null : ['@type' => 'GeoCoordinates', 'latitude' => $position[0], 'longitude' => $position[1]],
        ], static fn(mixed $value): bool => null !== $value && '' !== $value);
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function json(array $data): string
    {
        // "</" cannot end the script early.
        return str_replace('</', '<\/', json_encode($data, \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_THROW_ON_ERROR));
    }

    /**
     * @return list<string>
     */
    private static function lines(string $text): array
    {
        $lines = preg_split('/\R/u', $text);

        return array_values(array_filter(array_map(trim(...), false === $lines ? [] : $lines), static fn(string $line): bool => '' !== $line));
    }

    private static function tel(string $phone): string
    {
        return '' === $phone ? '' : 'tel:' . preg_replace('/[^0-9+]/', '', $phone);
    }
}
