<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use DateTimeInterface;
use Exception;
use Frootbox\Core\Plugin\Space;

/**
 * An article as its draft or published version holds it.
 */
final readonly class ArticleData
{
    /**
     * @param array<mixed>|null           $image        The value of an image field: {"media": "01J…", "alt": "…"}
     * @param list<string>                $categories   Ids of the categories
     * @param array<string, ArticleText>  $translations By language
     * @param list<string>                $tags         Ids of the tags (decision 0239)
     * @param array<mixed>                $fields       Further fields of the views by name (decision 0240)
     */
    public function __construct(
        public DateTimeImmutable $date,
        public ?array $image = null,
        public array $categories = [],
        public array $translations = [],
        /** The space of the news it belongs to (decision 0232) */
        public string $space = Space::DEFAULT,
        public array $tags = [],
        public array $fields = [],
    ) {}

    /**
     * @param array<mixed> $data
     */
    public static function fromArray(array $data): self
    {
        try {
            $date = new DateTimeImmutable(\is_string($data['date'] ?? null) ? $data['date'] : 'now');
        } catch (Exception) {
            $date = new DateTimeImmutable();
        }

        $translations = [];

        foreach (\is_array($data['translations'] ?? null) ? $data['translations'] : [] as $language => $text) {
            if (\is_array($text)) {
                $translations[(string) $language] = ArticleText::fromArray($text);
            }
        }

        return new self(
            $date,
            \is_array($data['image'] ?? null) ? $data['image'] : null,
            array_values(array_filter(\is_array($data['categories'] ?? null) ? $data['categories'] : [], \is_string(...))),
            $translations,
            \is_string($data['space'] ?? null) && '' !== $data['space'] ? $data['space'] : Space::DEFAULT,
            array_values(array_filter(\is_array($data['tags'] ?? null) ? $data['tags'] : [], \is_string(...))),
            \is_array($data['fields'] ?? null) ? $data['fields'] : [],
        );
    }

    /**
     * The same in another space (decision 0244).
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
            'date' => $this->date->format(DateTimeInterface::ATOM),
            'image' => $this->image,
            'categories' => $this->categories,
            'translations' => array_map(static fn(ArticleText $text): array => $text->toArray(), $this->translations),
            'space' => $this->space,
            'tags' => $this->tags,
            'fields' => $this->fields,
        ];
    }

    /**
     * @param array<mixed>|null|false          $image        false keeps it
     * @param list<string>|null                $categories
     * @param array<string, ArticleText>|null  $translations
     * @param list<string>|null                $tags
     * @param array<mixed>|null                $fields
     */
    public function with(?DateTimeImmutable $date = null, array|false|null $image = false, ?array $categories = null, ?array $translations = null, ?array $tags = null, ?array $fields = null): self
    {
        return new self($date ?? $this->date, false === $image ? $this->image : $image, $categories ?? $this->categories, $translations ?? $this->translations, $this->space, $tags ?? $this->tags, $fields ?? $this->fields);
    }

    /**
     * The id of the image, if any.
     */
    public function media(): ?string
    {
        return \is_string($this->image['media'] ?? null) ? $this->image['media'] : null;
    }
}
