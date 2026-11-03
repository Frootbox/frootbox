<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use Frootbox\Core\Plugin\Space;

/**
 * An entry of a collection as its draft or published version holds it
 * (decision 0246).
 */
final readonly class EntryData
{
    public const string ID_PATTERN = '/^[0-9A-HJKMNP-TV-Z]{26}$/';

    /**
     * @param array<mixed>|null        $image        The value of an image field: {"media": "01J…", "alt": "…"}
     * @param array<string, EntryText> $translations By language
     * @param list<string>             $categories   Ids of categories of the core (decision 0233)
     * @param list<string>             $tags         Ids of tags of the core (decision 0239)
     * @param array<mixed>             $fields       Further fields of the views by name (decision 0240)
     */
    public function __construct(
        public ?array $image = null,
        public array $translations = [],
        /** The collection it belongs to, a space of the plugin (decision 0232) */
        public string $space = Space::DEFAULT,
        /** Smaller ones come first; with the same, the newest first */
        public int $order = 0,
        public array $categories = [],
        public array $tags = [],
        public array $fields = [],
    ) {}

    /**
     * @param array<mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $translations = [];

        foreach (\is_array($data['translations'] ?? null) ? $data['translations'] : [] as $language => $text) {
            if (\is_array($text)) {
                $translations[(string) $language] = EntryText::fromArray($text);
            }
        }

        return new self(
            \is_array($data['image'] ?? null) ? $data['image'] : null,
            $translations,
            \is_string($data['space'] ?? null) && '' !== $data['space'] ? $data['space'] : Space::DEFAULT,
            \is_int($data['order'] ?? null) ? $data['order'] : 0,
            array_values(array_filter(\is_array($data['categories'] ?? null) ? $data['categories'] : [], \is_string(...))),
            array_values(array_filter(\is_array($data['tags'] ?? null) ? $data['tags'] : [], \is_string(...))),
            \is_array($data['fields'] ?? null) ? $data['fields'] : [],
        );
    }

    /**
     * The same in another collection (decision 0244).
     */
    public function withSpace(string $space): self
    {
        return self::fromArray([...$this->toArray(), 'space' => $space]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'image' => $this->image,
            'translations' => array_map(static fn(EntryText $text): array => $text->toArray(), $this->translations),
            'space' => $this->space,
            'order' => $this->order,
            'categories' => $this->categories,
            'tags' => $this->tags,
            'fields' => $this->fields,
        ];
    }

    /**
     * The id of the image, if any.
     */
    public function media(): ?string
    {
        return \is_string($this->image['media'] ?? null) ? $this->image['media'] : null;
    }

    /**
     * The texts in a language, else in the first one.
     */
    public function text(string $language): ?EntryText
    {
        return $this->translations[$language] ?? ([] === $this->translations ? null : array_values($this->translations)[0]);
    }
}
