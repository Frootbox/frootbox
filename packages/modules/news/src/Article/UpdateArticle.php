<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\ListOf;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;

/**
 * @implements Action<ArticleDetails>
 */
#[AsAction('frootbox/news/article.update', 'Changes the draft of a news article; what is left out stays as it is')]
final readonly class UpdateArticle implements Action
{
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
        #[Description('Changes by language, e.g. {"de": {"title": "Neue Sorten"}, "en": null}: fields left out stay, null removes a language')]
        public ?array $translations = null,
        public ?DateTimeImmutable $date = null,
        #[Description('An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it, left out keeps it')]
        public ?array $image = null,
        #[ListOf('string')]
        #[Description('Ids of categories, replacing the ones before')]
        public ?array $categories = null,
        #[ListOf('string')]
        #[Description('Ids, keys or labels of tags, replacing the ones before; a new word becomes a tag unless only presets count')]
        public ?array $tags = null,
        #[Description('Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one, the others stay; see object.fields; left out keeps them')]
        public ?array $fields = null,
    ) {}

    public function handle(ArticleEditor $editor, ArticleStore $store): ArticleDetails
    {
        $current = $store->current($this->id);

        $data = $current->with(
            $this->date,
            match (true) {
                null === $this->image => false,
                [] === $this->image => null,
                default => $this->image,
            },
            null === $this->categories ? null : $editor->categories('frootbox/news/article.update', $this->categories),
            null === $this->translations ? null : $editor->translations('frootbox/news/article.update', $this->translations, $current->translations),
            null === $this->tags ? null : $editor->tags('frootbox/news/article.update', $current->space, $this->tags),
            null === $this->fields ? null : $editor->fields('frootbox/news/article.update', $current->fields, $this->fields),
        );

        return $editor->saveDraft('frootbox/news/article.update', $this->id, $data);
    }
}
