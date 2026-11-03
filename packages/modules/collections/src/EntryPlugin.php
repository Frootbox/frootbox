<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\EntryText;
use Frootbox\Core\Plugin\Offer;
use Frootbox\Core\Plugin\Plugin;

/**
 * The entries as a plugin (decisions 0231, 0232): a page that shows a space
 * lists its entries at plugin(), each published entry has its address below
 * that page, its slug. The teaser and the image describe it for search
 * engines and sharing (decision 0223).
 */
final readonly class EntryPlugin implements Plugin
{
    public const string LIST_BLOCK = 'frootbox/collections/EntryList';

    public function __construct(private EntryStore $store) {}

    public function type(): string
    {
        return EntryStore::TYPE;
    }

    public function label(): string
    {
        return 'Collections';
    }

    public function block(): string
    {
        return self::LIST_BLOCK;
    }

    public function details(): Offer
    {
        return Offer::Optional;
    }

    public function categories(): Offer
    {
        return Offer::Optional;
    }

    public function spaces(): bool
    {
        return true;
    }

    public function paths(string $space): iterable
    {
        foreach ($this->store->allPublished($space) as $entry) {
            yield $entry->id => array_map(static fn(EntryText $text): string => $text->slug, $entry->data->translations);
        }
    }

    public function space(string $id): ?string
    {
        return ($this->store->draft($id) ?? $this->store->published($id))?->space;
    }

    public function count(string $space): int
    {
        return \count(array_filter($this->store->ids(), fn(string $id): bool => $this->store->current($id)->space === $space));
    }

    public function title(string $id, string $language): ?string
    {
        $title = $this->store->published($id)->translations[$language]->title ?? null;

        return null === $title || '' === $title ? null : $title;
    }

    public function description(string $id, string $language): ?string
    {
        $teaser = $this->store->published($id)->translations[$language]->teaser ?? null;

        return null === $teaser || '' === $teaser ? null : $teaser;
    }

    public function image(string $id, string $language): ?array
    {
        $image = $this->store->published($id)?->image;
        $media = $image['media'] ?? null;

        if (!\is_string($media) || '' === $media) {
            return null;
        }

        $alt = $image['alt'] ?? null;

        return \is_string($alt) ? ['media' => $media, 'alt' => $alt] : ['media' => $media];
    }
}
