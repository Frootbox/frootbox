<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use Frootbox\Core\Revision\Revisions;
use Frootbox\Core\Revision\RevisionStatus;
use Frootbox\Core\Url\Urls;
use Frootbox\Database\EntityNotFoundException;

/**
 * Reads the drafts and published versions of articles from revisions.
 */
final readonly class ArticleStore
{
    public const string TYPE = 'frootbox/news/article';

    /** The group of categories of the news (decision 0233) */
    public const string CATEGORIES = 'frootbox/news/categories';

    public function __construct(
        private Revisions $revisions,
        private Urls $urls,
    ) {}

    public static function target(string $id): string
    {
        return self::TYPE . ':' . $id;
    }

    public function draft(string $id): ?ArticleData
    {
        $revision = $this->revisions->draft(self::TYPE, $id);

        return null === $revision ? null : ArticleData::fromArray($revision->data);
    }

    public function published(string $id): ?ArticleData
    {
        $revision = $this->revisions->published(self::TYPE, $id);

        return null === $revision ? null : ArticleData::fromArray($revision->data);
    }

    /**
     * The draft, else the published version.
     *
     * @throws EntityNotFoundException
     */
    public function current(string $id): ArticleData
    {
        return $this->draft($id) ?? $this->published($id) ?? throw EntityNotFoundException::for(Articles::TABLE, $id);
    }

    /**
     * @throws EntityNotFoundException
     */
    public function details(string $id, bool $urls = false): ArticleDetails
    {
        $draft = $this->revisions->draft(self::TYPE, $id);
        $published = $this->revisions->published(self::TYPE, $id);

        if (null === $draft && null === $published) {
            throw EntityNotFoundException::for(Articles::TABLE, $id);
        }

        $status = match (true) {
            null === $published => ArticleStatus::Draft,
            null === $draft => ArticleStatus::Published,
            default => ArticleStatus::Changed,
        };
        $data = null === $published ? null : ArticleData::fromArray($published->data);
        $addresses = [];

        foreach ($urls && null !== $data ? array_keys($data->translations) : [] as $language) {
            $path = $this->urls->path(self::target($id), $language);

            if (null !== $path) {
                $addresses[$language] = $path;
            }
        }

        return new ArticleDetails(
            $id,
            $status,
            $published?->version,
            null === $draft ? null : ArticleData::fromArray($draft->data),
            $data,
            $draft?->publishAt,
            $published?->unpublishAt,
            $addresses,
        );
    }

    /**
     * The ids of all articles with a draft or a published version.
     *
     * @return list<string>
     */
    public function ids(): array
    {
        $ids = [];

        foreach ($this->revisions->fetch(['where' => ['type' => self::TYPE, 'status' => [RevisionStatus::Draft->value, RevisionStatus::Published->value]], 'order' => 'id']) as $revision) {
            $ids[$revision->entityId] = true;
        }

        return array_keys($ids);
    }
}
