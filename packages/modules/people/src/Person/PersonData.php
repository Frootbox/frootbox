<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Page\Slug;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Support\Message;
use Frootbox\People\Data;

/**
 * A person as the draft or published version holds it (decision 0226):
 * name, ways to reach the person, the locations and texts by language.
 * As a plugin (decision 0242) the person belongs to a space, has one slug
 * for the address of the profile in every language, categories, tags and
 * the further fields of the theme.
 */
final readonly class PersonData implements Data
{
    public const int ORDER_MAX = 999;

    /**
     * @param array<mixed>|null          $image        The value of an image field: {"media": "01J…", "alt": "…"}
     * @param list<string>               $locations    Ids of the locations
     * @param array<string, PersonText>  $translations By language
     * @param list<string>               $categories   Ids of categories
     * @param list<string>               $tags         Ids of tags
     * @param array<string, mixed>       $fields       Further fields by name (decision 0240)
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
        public string $space = Space::DEFAULT,
        /** The last part of the address of the profile, e.g. "maria-rossi" */
        public string $slug = '',
        public array $categories = [],
        public array $tags = [],
        public array $fields = [],
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
        $ids = static fn(string $key): array => array_values(array_filter(\is_array($data[$key] ?? null) ? $data[$key] : [], \is_string(...)));
        $fields = \is_array($data['fields'] ?? null) ? $data['fields'] : [];

        return new self(
            $text('givenName'),
            $text('familyName'),
            $text('prefix'),
            $text('email'),
            $text('phone'),
            \is_array($data['image'] ?? null) ? $data['image'] : null,
            $ids('locations'),
            \is_int($data['order'] ?? null) ? $data['order'] : 0,
            $translations,
            '' === $text('space') ? Space::DEFAULT : $text('space'),
            $text('slug'),
            $ids('categories'),
            $ids('tags'),
            array_filter($fields, static fn(int|string $name): bool => \is_string($name), \ARRAY_FILTER_USE_KEY),
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
            'space' => $this->space,
            'slug' => $this->slug,
            'categories' => $this->categories,
            'tags' => $this->tags,
            'fields' => $this->fields,
        ];
    }

    public function incomplete(): array
    {
        return array_filter([
            '/familyName' => '' === $this->name() ? new Message('A person needs a name.') : null,
            '/slug' => '' === $this->slug ? new Message('is required.') : null,
        ]);
    }

    public function withSlug(string $slug): self
    {
        return new self($this->givenName, $this->familyName, $this->prefix, $this->email, $this->phone, $this->image, $this->locations, $this->order, $this->translations, $this->space, $slug, $this->categories, $this->tags, $this->fields);
    }

    /**
     * The slug that comes from the name, e.g. "dr-maria-rossi".
     */
    public function nameSlug(): string
    {
        return Slug::fromTitle($this->name());
    }

    /**
     * The id of the photo in the media library, null without one.
     */
    public function media(): ?string
    {
        $media = $this->image['media'] ?? null;

        return \is_string($media) && '' !== $media ? $media : null;
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
