<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Plugin\SpaceRights;

/**
 * @implements Query<ArticleList>
 */
#[AsQuery('frootbox/news/article.list', 'Lists the news articles with drafts and published ones, newest first')]
final readonly class ListArticles implements Query, Scoped
{
    public function __construct(
        #[Description('Language of the titles; left out for the first language of the website')]
        public ?string $language = null,
        #[Description('Only articles whose title holds this text')]
        #[Length(max: 100)]
        public ?string $search = null,
        #[Range(min: 1)]
        public int $page = 1,
        #[Range(min: 1, max: 200)]
        public int $perPage = 50,
        #[Description('Only the articles of this space; left out for all')]
        public ?string $space = null,
    ) {}

    /**
     * A role within a space is enough, the list shows only what lies within (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [];
    }

    public function handle(ArticleStore $store, Languages $languages, SpaceRights $rights): ArticleList
    {
        $language = null !== $this->language && $languages->has($this->language) ? $this->language : $languages->default()->code;
        $search = mb_strtolower(trim($this->search ?? ''));
        $items = [];
        // Only the spaces with a role there (decision 0245), null for all.
        $within = $rights->within(ArticleStore::TYPE, 'frootbox/news/article.list');

        foreach ($store->ids() as $id) {
            $details = $store->details($id);
            $data = $details->current();

            if (null !== $this->space && $data->space !== $this->space) {
                continue;
            }

            if (null !== $within && !\in_array($data->space, $within, true)) {
                continue;
            }

            $text = $data->translations[$language] ?? ($data->translations === [] ? null : array_values($data->translations)[0]);
            $title = $text->title ?? '';

            if ('' !== $search && !str_contains(mb_strtolower($title), $search)) {
                continue;
            }

            $items[] = new ArticleSummary($id, $details->status, $title, $data->date, array_keys($data->translations), $details->publishAt, $details->unpublishAt);
        }

        usort($items, static fn(ArticleSummary $a, ArticleSummary $b): int => [$b->date, $b->id] <=> [$a->date, $a->id]);
        $pages = max(1, (int) ceil(\count($items) / $this->perPage));

        return new ArticleList(\array_slice($items, ($this->page - 1) * $this->perPage, $this->perPage), \count($items), $this->page, $pages);
    }
}
