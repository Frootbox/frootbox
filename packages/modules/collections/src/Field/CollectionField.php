<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

use DateTimeImmutable;
use Frootbox\Database\Entity;

/**
 * A field an admin adds to a collection (decision 0250): its name in the
 * entries, its kind, a label by language and the settings of its kind,
 * e.g. the unit of a number or the options of a choice.
 */
final readonly class CollectionField extends Entity
{
    /**
     * @param array<mixed> $labels   {"de": "Höhe", "en": "Altitude"}
     * @param array<mixed> $settings {"unit": "m", "decimals": 0} or {"options": [{"key": "arabica", "labels": {"de": "Arabica"}}]}
     */
    public function __construct(
        public string $id,
        public string $space,
        public string $name,
        public string $type,
        public array $labels,
        public array $settings,
        public int $position,
        public ?DateTimeImmutable $createdAt = null,
        public ?DateTimeImmutable $updatedAt = null,
    ) {}

    public function kind(): FieldKind
    {
        return FieldKind::tryFrom($this->type) ?? FieldKind::Text;
    }

    /**
     * The label in the first of these languages that has one, else in any.
     *
     * @param list<string> $languages
     */
    public function label(array $languages): string
    {
        foreach ([...$languages, ...array_map(strval(...), array_keys($this->labels))] as $language) {
            if (\is_string($this->labels[$language] ?? null) && '' !== $this->labels[$language]) {
                return $this->labels[$language];
            }
        }

        return $this->name;
    }

    /**
     * @return array<string, string>
     */
    public function labels(): array
    {
        return self::texts($this->labels);
    }

    /**
     * The options of a choice in their order.
     *
     * @return list<array{key: string, labels: array<string, string>}>
     */
    public function options(): array
    {
        $options = [];

        foreach (\is_array($this->settings['options'] ?? null) ? $this->settings['options'] : [] as $option) {
            if (\is_array($option) && \is_string($option['key'] ?? null)) {
                $options[] = ['key' => $option['key'], 'labels' => self::texts(\is_array($option['labels'] ?? null) ? $option['labels'] : [])];
            }
        }

        return $options;
    }

    public function unit(): string
    {
        return \is_string($this->settings['unit'] ?? null) ? $this->settings['unit'] : '';
    }

    public function decimals(): int
    {
        return \is_int($this->settings['decimals'] ?? null) ? $this->settings['decimals'] : 0;
    }

    /**
     * The field as "object.fields" in the header of a view writes it.
     *
     * @param list<string> $languages The default language first
     *
     * @return array<string, mixed>
     */
    public function definition(array $languages): array
    {
        $kind = $this->kind();
        $definition = ['type' => $kind->type(), 'label' => $this->label($languages), 'labels' => $this->labels(), 'translatable' => $kind->translatable()];

        return match ($kind) {
            FieldKind::Text => [...$definition, 'maxLength' => 300],
            FieldKind::LongText => [...$definition, 'multiline' => true, 'maxLength' => 5000],
            FieldKind::Number => [...$definition, 'decimals' => $this->decimals(), ...('' === $this->unit() ? [] : ['unit' => $this->unit()])],
            FieldKind::Choice => [...$definition, 'options' => array_column($this->options(), 'labels', 'key')],
            default => $definition,
        };
    }

    /**
     * @param array<mixed> $texts
     *
     * @return array<string, string>
     */
    private static function texts(array $texts): array
    {
        $result = [];

        foreach ($texts as $language => $text) {
            if (\is_string($text) && '' !== $text) {
                $result[(string) $language] = $text;
            }
        }

        return $result;
    }
}
