<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\ListOf;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;

/**
 * @implements Action<EntryDetails>
 */
#[AsAction('frootbox/collections/entry.create', 'Creates an entry of a collection as a draft; frootbox/collections/entry.publish puts it online')]
final readonly class CreateEntry implements Action, Scoped
{
    private const string NAME = 'frootbox/collections/entry.create';

    /**
     * @param array<mixed>      $translations
     * @param array<mixed>|null $image
     * @param list<string>      $categories
     * @param list<string>      $tags
     * @param array<mixed>      $fields
     */
    public function __construct(
        #[Description('Title, slug, teaser and text by language: {"de": {"title": "Haus am See", "teaser": "…", "text": {"type": "doc", "content": []}}}. The slug is made from the title if left out.')]
        public array $translations,
        #[Description('An image from the media library: {"media": "<id>", "alt": "…"}')]
        public ?array $image = null,
        #[Length(1, 64)]
        #[Description('The collection, a space of the plugin: "default" for the first one; see space.list with type "frootbox/collections/entry"')]
        public string $space = Space::DEFAULT,
        #[Range(min: -10000, max: 10000)]
        #[Description('Smaller ones come first; with the same position the newest first')]
        public int $order = 0,
        #[ListOf('string')]
        #[Description('Ids of categories, see category-group.list and category.list')]
        public array $categories = [],
        #[ListOf('string')]
        #[Description('Ids, keys or labels of tags; a new word becomes a tag unless only presets count, see tag.choices')]
        public array $tags = [],
        #[Description('Further fields of the theme and of the collection, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one; see object.fields with the space')]
        public array $fields = [],
    ) {}

    /**
     * The collection it is created in (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [SpaceScopes::space(EntryStore::TYPE, $this->space)];
    }

    public function handle(EntryEditor $editor): EntryDetails
    {
        $data = new EntryData(
            [] === $this->image ? null : $this->image,
            $editor->translations(self::NAME, $this->translations),
            $this->space,
            $this->order,
            $editor->categories(self::NAME, $this->categories),
            $editor->tags(self::NAME, $this->space, $this->tags),
            $editor->fields(self::NAME, $this->space, [], $this->fields),
        );

        return $editor->saveDraft(self::NAME, Ulid::generate(), $data);
    }
}
