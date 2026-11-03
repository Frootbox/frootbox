<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use DateTimeImmutable;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Revision\Revisions;
use Frootbox\Core\Revision\RevisionStatus;
use Frootbox\Core\Url\Urls;
use Frootbox\Database\EntityNotFoundException;

/**
 * Drafts and published versions of entries in revisions (decision 0231).
 * There are no tables: a website has a few dozen entries at most, so lists
 * and filters read all published ones.
 */
final readonly class EntryStore
{
    public const string TYPE = 'frootbox/collections/entry';

    /** The group of categories of the entries (decision 0233) */
    public const string CATEGORIES = 'frootbox/collections/categories';

    public function __construct(
        private Revisions $revisions,
        private Urls $urls,
        private Languages $languages,
    ) {}

    public static function target(string $id): string
    {
        return self::TYPE . ':' . $id;
    }

    public function draft(string $id): ?EntryData
    {
        $revision = $this->revisions->draft(self::TYPE, $id);

        return null === $revision ? null : $this->load($revision->data);
    }

    public function published(string $id): ?EntryData
    {
        $revision = $this->revisions->published(self::TYPE, $id);

        return null === $revision ? null : $this->load($revision->data);
    }

    /**
     * The draft, else the published version.
     *
     * @throws EntityNotFoundException
     */
    public function current(string $id): EntryData
    {
        return $this->draft($id) ?? $this->published($id) ?? throw EntityNotFoundException::for(self::TYPE, $id);
    }

    /**
     * @throws EntityNotFoundException
     */
    public function details(string $id, bool $urls = false): EntryDetails
    {
        $draft = $this->revisions->draft(self::TYPE, $id);
        $published = $this->revisions->published(self::TYPE, $id);

        if (null === $draft && null === $published) {
            throw EntityNotFoundException::for(self::TYPE, $id);
        }

        $data = null === $published ? null : $this->load($published->data);
        $addresses = [];

        foreach ($urls && null !== $data ? array_keys($data->translations) : [] as $language) {
            $path = $this->urls->path(self::target($id), $language);

            if (null !== $path) {
                $addresses[$language] = $path;
            }
        }

        return new EntryDetails(
            $id,
            match (true) {
                null === $published => EntryStatus::Draft,
                null === $draft => EntryStatus::Published,
                default => EntryStatus::Changed,
            },
            $published?->version,
            null === $draft ? null : $this->load($draft->data),
            $data,
            $draft?->publishAt,
            $published?->unpublishAt,
            $addresses,
        );
    }

    /**
     * The ids of all entries with a draft or a published version.
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

    /**
     * The published entries by position, with the same position the newest first (decision 0246); with a space only its entries.
     *
     * @return list<PublishedEntry>
     */
    public function allPublished(?string $space = null): array
    {
        $entries = [];

        foreach ($this->revisions->fetch(['where' => ['type' => self::TYPE, 'status' => RevisionStatus::Published->value], 'order' => 'id']) as $revision) {
            if (null !== $space && $space !== EntryData::fromArray($revision->data)->space) {
                continue;
            }

            $entries[] = new PublishedEntry(
                $revision->entityId,
                $this->load($revision->data),
                $this->posted($revision->entityId) ?? $revision->publishedAt ?? $revision->createdAt,
                $revision->unpublishAt,
            );
        }

        usort($entries, static fn(PublishedEntry $a, PublishedEntry $b): int => [$a->data->order, $b->posted, $b->id] <=> [$b->data->order, $a->posted, $a->id]);

        return $entries;
    }

    /**
     * One published entry, null if it is not online.
     */
    public function find(string $id): ?PublishedEntry
    {
        $revision = $this->revisions->published(self::TYPE, $id);

        return null === $revision ? null : new PublishedEntry($id, $this->load($revision->data), $this->posted($id) ?? $revision->publishedAt ?? $revision->createdAt, $revision->unpublishAt);
    }

    /**
     * When the entry was first published: the first version.
     */
    private function posted(string $id): ?DateTimeImmutable
    {
        return $this->revisions->version(self::TYPE, $id, 1)?->publishedAt;
    }

    /**
     * The texts in the order of the languages, the same on every database.
     *
     * @param array<mixed> $data
     */
    private function load(array $data): EntryData
    {
        if (\is_array($data['translations'] ?? null)) {
            $data['translations'] = $this->languages->sort($data['translations']);
        }

        return EntryData::fromArray($data);
    }
}
