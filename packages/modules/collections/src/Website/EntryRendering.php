<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Website;

use Frootbox\Collections\Entry\EntryData;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\EntryText;
use Frootbox\Collections\Entry\PublishedEntry;
use Frootbox\Core\Field\Field;
use Frootbox\Core\Field\FieldTypes;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Url\Urls;
use Twig\Markup;

/**
 * An entry as the views of the blocks use it (decision 0246): title,
 * teaser, text and the image as HTML. Further fields the views read with
 * object_field() and object_value() at the target (decision 0240), the
 * fields of the collection with object_facts() (decision 0250).
 */
final readonly class EntryRendering
{
    /** The image of a card: three columns on wide screens. */
    public const string TEASER_SIZES = '(min-width: 72rem) 24rem, (min-width: 40rem) 50vw, 100vw';

    /** The image above the text of an entry. */
    public const string DETAIL_SIZES = '(min-width: 72rem) 48rem, 100vw';

    public function __construct(
        private FieldTypes $types,
        private Urls $urls,
        private Translator $translator,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function teaser(PublishedEntry $entry, string $language, bool $image = true): array
    {
        $text = $entry->data->text($language) ?? new EntryText('', '');

        return [
            'id' => $entry->id,
            // For object_field() and object_value() (decision 0240).
            'target' => EntryStore::target($entry->id),
            'title' => $text->title,
            'teaser' => $text->teaser,
            'url' => $this->url($entry->id, $language),
            'image' => $image ? $this->image($entry->data, '3:2', self::TEASER_SIZES, false) : '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(PublishedEntry $entry, string $language): array
    {
        $text = $entry->data->text($language) ?? new EntryText('', '');

        return [
            ...$this->teaser($entry, $language),
            'image' => $this->image($entry->data, null, self::DETAIL_SIZES, true),
            'text' => $this->types->get('richtext')->output($text->text, new Field('text', 'richtext', 'Text')),
            // Switches in the fact sheet, in the language of the content like the values (decision 0250).
            'yes' => $this->translator->in($language, 'Yes', ['frootbox/collections']),
            'no' => $this->translator->in($language, 'No', ['frootbox/collections']),
        ];
    }

    public function url(string $id, string $language): ?string
    {
        return $this->urls->href(EntryStore::target($id), $language);
    }

    private function image(EntryData $data, ?string $ratio, string $sizes, bool $eager): Markup|string
    {
        if (null === $data->image) {
            return '';
        }

        $output = $this->types->get('image')->output($data->image, new Field('image', 'image', 'Image', settings: array_filter(['ratio' => $ratio, 'sizes' => $sizes, 'eager' => $eager], static fn(mixed $value): bool => null !== $value)));

        return $output instanceof Markup ? $output : (\is_string($output) ? $output : '');
    }
}
