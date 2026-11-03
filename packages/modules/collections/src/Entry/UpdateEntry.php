<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\ListOf;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;

/**
 * @implements Action<EntryDetails>
 */
#[AsAction('frootbox/collections/entry.update', 'Changes the draft of an entry of a collection; what is left out stays as it is')]
final readonly class UpdateEntry implements Action, Scoped
{
    private const string NAME = 'frootbox/collections/entry.update';

    /**
     * @param array<mixed>|null $translations
     * @param array<mixed>|null $image
     * @param list<string>|null $categories
     * @param list<string>|null $tags
     * @param array<mixed>|null $fields
     */
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
        #[Description('Changes by language, e.g. {"de": {"title": "Haus am See"}, "en": null}: fields left out stay, null removes a language')]
        public ?array $translations = null,
        #[Description('An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it, left out keeps it')]
        public ?array $image = null,
        #[Range(min: -10000, max: 10000)]
        #[Description('Smaller ones come first; with the same position the newest first')]
        public ?int $order = null,
        #[ListOf('string')]
        #[Description('Ids of categories, replacing the ones before')]
        public ?array $categories = null,
        #[ListOf('string')]
        #[Description('Ids, keys or labels of tags, replacing the ones before; a new word becomes a tag unless only presets count')]
        public ?array $tags = null,
        #[Description('Further fields of the theme and of the collection, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one, the others stay; see object.fields with the space; left out keeps them')]
        public ?array $fields = null,
        #[Description('The collection to move it to; with publishing its address moves below the page of that collection and the old one redirects')]
        public ?string $space = null,
    ) {}

    /**
     * The entry and, when it moves, the new collection (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        $scopes = [SpaceScopes::object(EntryStore::TYPE, $this->id)];

        // Moving needs the rights in the new collection too (decision 0244).
        if (null !== $this->space) {
            $scopes[] = SpaceScopes::space(EntryStore::TYPE, $this->space);
        }

        return $scopes;
    }

    public function handle(EntryEditor $editor, EntryStore $store): EntryDetails
    {
        $current = $store->current($this->id);
        $data = new EntryData(
            match (true) {
                null === $this->image => $current->image,
                [] === $this->image => null,
                default => $this->image,
            },
            null === $this->translations ? $current->translations : $editor->translations(self::NAME, $this->translations, $current->translations),
            $this->space ?? $current->space,
            $this->order ?? $current->order,
            null === $this->categories ? $current->categories : $editor->categories(self::NAME, $this->categories),
            null === $this->tags ? $current->tags : $editor->tags(self::NAME, $this->space ?? $current->space, $this->tags),
            null === $this->fields ? $current->fields : $editor->fields(self::NAME, $this->space ?? $current->space, $current->fields, $this->fields),
        );

        return $editor->saveDraft(self::NAME, $this->id, $data);
    }
}
