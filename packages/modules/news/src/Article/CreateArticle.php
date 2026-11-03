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
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\ListOf;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;

/**
 * @implements Action<ArticleDetails>
 */
#[AsAction('frootbox/news/article.create', 'Creates a news article as a draft; frootbox/news/article.publish puts it online')]
final readonly class CreateArticle implements Action, Scoped
{
    /**
     * @param array<mixed>      $translations
     * @param array<mixed>|null $image
     * @param list<string>      $categories
     * @param list<string>      $tags
     * @param array<mixed>      $fields
     */
    public function __construct(
        #[Description('Title, slug, teaser and text by language: {"de": {"title": "Neue Sorten", "teaser": "…", "text": {"type": "doc", "content": []}}}. The slug is made from the title if left out.')]
        public array $translations,
        #[Description('The date shown with the article and its place in lists, e.g. "2026-11-02T09:00:00+01:00"; left out for now')]
        public ?DateTimeImmutable $date = null,
        #[Description('An image from the media library: {"media": "<id>", "alt": "…"}')]
        public ?array $image = null,
        #[ListOf('string')]
        #[Description('Ids of categories')]
        public array $categories = [],
        #[Length(1, 64)]
        #[Description('The space of the news, "default" for the default one; see space.list')]
        public string $space = Space::DEFAULT,
        #[ListOf('string')]
        #[Description('Ids, keys or labels of tags; a new word becomes a tag unless only presets count, see tag.choices')]
        public array $tags = [],
        #[Description('Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one; see object.fields')]
        public array $fields = [],
    ) {}

    /**
     * The space it is created in (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [SpaceScopes::space(ArticleStore::TYPE, $this->space)];
    }

    public function handle(ArticleEditor $editor): ArticleDetails
    {
        $data = new ArticleData(
            $this->date ?? new DateTimeImmutable(),
            [] === $this->image ? null : $this->image,
            $editor->categories('frootbox/news/article.create', $this->categories),
            $editor->translations('frootbox/news/article.create', $this->translations),
            $this->space,
            $editor->tags('frootbox/news/article.create', $this->space, $this->tags),
            $editor->fields('frootbox/news/article.create', [], $this->fields),
        );

        return $editor->saveDraft('frootbox/news/article.create', Ulid::generate(), $data);
    }
}
