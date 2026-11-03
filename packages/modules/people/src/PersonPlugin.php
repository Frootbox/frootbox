<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Core\Language\Languages;
use Frootbox\Core\Plugin\Offer;
use Frootbox\Core\Plugin\Plugin;
use Frootbox\People\Person\PersonStore;

/**
 * The people as a plugin (decisions 0232, 0242): a page that shows a
 * space lists its people at plugin(); with details on, each published
 * person has a profile below that page, with one slug in every language.
 * The role and the photo describe the profile for search engines and
 * sharing (decision 0223).
 */
final readonly class PersonPlugin implements Plugin
{
    public const string LIST_BLOCK = 'frootbox/people/PersonList';

    public function __construct(
        private PersonStore $store,
        private Languages $languages,
    ) {}

    public function type(): string
    {
        return PersonStore::TYPE;
    }

    public function label(): string
    {
        return 'People';
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
        $codes = array_map(static fn($language): string => $language->code, $this->languages->all());

        foreach ($this->store->allPublished() as $id => $person) {
            if ($space === $person->space && '' !== $person->slug) {
                yield $id => array_fill_keys($codes, $person->slug);
            }
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
        $name = $this->store->published($id)?->name();

        return null === $name || '' === $name ? null : $name;
    }

    public function description(string $id, string $language): ?string
    {
        $role = $this->store->published($id)?->text($language)->role;

        return null === $role || '' === $role ? null : $role;
    }

    public function image(string $id, string $language): ?array
    {
        $person = $this->store->published($id);
        $media = $person?->media();

        if (null === $person || null === $media) {
            return null;
        }

        $alt = $person->image['alt'] ?? null;

        return \is_string($alt) && '' !== $alt ? ['media' => $media, 'alt' => $alt] : ['media' => $media, 'alt' => $person->name()];
    }
}
