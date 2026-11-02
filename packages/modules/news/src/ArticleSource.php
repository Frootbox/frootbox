<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Revision\Revisions;
use Frootbox\Core\Search\AsSearchSource;
use Frootbox\Core\Search\SearchEntry;
use Frootbox\Core\Search\SearchSource;
use Frootbox\Database\EntityNotFoundException;
use Frootbox\News\Article\ArticleStore;
use Frootbox\RichText\RichText;

/**
 * News articles in the search of the backend, as editors see them:
 * drafts first (decision 0217).
 */
#[AsSearchSource('frootbox/news/article', 'News')]
final readonly class ArticleSource implements SearchSource
{
    public function __construct(
        private ArticleStore $store,
        private RichText $richText,
    ) {}

    public function changed(string $table, array $row): array
    {
        $id = Revisions::TABLE === $table && ArticleStore::TYPE === ($row['type'] ?? null) ? $row['entity_id'] ?? null : null;

        return \is_string($id) ? [$id] : [];
    }

    public function items(): iterable
    {
        yield from $this->store->ids();
    }

    public function entries(array $items): iterable
    {
        foreach ($items as $id) {
            try {
                $data = $this->store->details($id)->current();
            } catch (EntityNotFoundException) {
                continue;
            }

            foreach ($data->translations as $language => $text) {
                yield new SearchEntry(
                    item: $id,
                    title: '' === $text->title ? $id : $text->title,
                    text: implode("\n", array_filter([$text->teaser, $this->richText->toText($text->text)], static fn(string $part): bool => '' !== trim($part))),
                    permission: 'frootbox/news/article.show',
                    language: $language,
                );
            }
        }
    }
}
