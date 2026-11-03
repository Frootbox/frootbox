<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Revision\Revisions;
use Frootbox\Core\Revision\RevisionStatus;
use Frootbox\Core\Revision\RevisionStore;
use Frootbox\Database\EntityNotFoundException;

/**
 * Drafts and published versions of people or locations in revisions
 * (decision 0226). There are no tables; the website reads the published
 * versions, the backend the drafts first.
 *
 * @template T of Data
 */
abstract readonly class Store
{
    public function __construct(
        private Revisions $revisions,
        private RevisionStore $store,
        private Languages $languages,
    ) {}

    /**
     * The type in revisions, e.g. "frootbox/people/person".
     */
    abstract public function type(): string;

    /**
     * @param array<mixed> $data
     *
     * @return T
     */
    abstract protected function data(array $data): Data;

    /**
     * The texts in the order of the languages, the same on every database.
     *
     * @param array<mixed> $data
     *
     * @return T
     */
    private function load(array $data): Data
    {
        if (\is_array($data['translations'] ?? null)) {
            $data['translations'] = $this->languages->sort($data['translations']);
        }

        return $this->data($data);
    }

    /**
     * @return T|null
     */
    public function draft(string $id): ?Data
    {
        $revision = $this->revisions->draft($this->type(), $id);

        return null === $revision ? null : $this->load($revision->data);
    }

    /**
     * @return T|null
     */
    public function published(string $id): ?Data
    {
        $revision = $this->revisions->published($this->type(), $id);

        return null === $revision ? null : $this->load($revision->data);
    }

    /**
     * The draft, else the published version.
     *
     * @return T
     *
     * @throws EntityNotFoundException
     */
    public function current(string $id): Data
    {
        return $this->draft($id) ?? $this->published($id) ?? throw EntityNotFoundException::for($this->type(), $id);
    }

    /**
     * @return Details<T>
     *
     * @throws EntityNotFoundException
     */
    public function details(string $id): Details
    {
        $draft = $this->revisions->draft($this->type(), $id);
        $published = $this->revisions->published($this->type(), $id);

        if (null === $draft && null === $published) {
            throw EntityNotFoundException::for($this->type(), $id);
        }

        return new Details(
            $id,
            match (true) {
                null === $published => Status::Draft,
                null === $draft => Status::Published,
                default => Status::Changed,
            },
            $published?->version,
            null === $draft ? null : $this->load($draft->data),
            null === $published ? null : $this->load($published->data),
        );
    }

    /**
     * The ids of all with a draft or a published version.
     *
     * @return list<string>
     */
    public function ids(): array
    {
        $ids = [];

        foreach ($this->revisions->fetch(['where' => ['type' => $this->type(), 'status' => [RevisionStatus::Draft->value, RevisionStatus::Published->value]], 'order' => 'id']) as $revision) {
            $ids[$revision->entityId] = true;
        }

        return array_keys($ids);
    }

    /**
     * The published versions by id.
     *
     * @return array<string, T>
     */
    public function allPublished(): array
    {
        $all = [];

        foreach ($this->revisions->fetch(['where' => ['type' => $this->type(), 'status' => RevisionStatus::Published->value], 'order' => 'id']) as $revision) {
            $all[$revision->entityId] = $this->load($revision->data);
        }

        return $all;
    }

    /**
     * Saves a draft. Drafts may be unfinished (decision 0101).
     *
     * @param T $data
     *
     * @return Details<T>
     */
    public function save(string $id, Data $data): Details
    {
        $this->store->saveDraft($this->type(), $id, $data->toArray());

        return $this->details($id);
    }

    /**
     * Publishes the draft once it is complete.
     *
     * @return Details<T>
     *
     * @throws InvalidInputException
     * @throws EntityNotFoundException
     */
    public function publish(string $action, string $id): Details
    {
        $draft = $this->draft($id);

        if (null === $draft) {
            $this->details($id);

            throw new InvalidInputException($action, ['/id' => 'There is no draft to publish.']);
        }

        $errors = $draft->incomplete();

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        $this->store->publish($this->type(), $id);

        return $this->details($id);
    }

    /**
     * Removes the draft; one never published is gone then.
     *
     * @return Details<T>|null
     *
     * @throws InvalidInputException
     * @throws EntityNotFoundException
     */
    public function discard(string $action, string $id): ?Details
    {
        $this->details($id);

        if (null === $this->draft($id)) {
            throw new InvalidInputException($action, ['/id' => 'There is no draft.']);
        }

        $this->store->discard($this->type(), $id);

        return null === $this->published($id) ? null : $this->details($id);
    }

    /**
     * Deletes the draft and takes the published version offline. The
     * versions stay.
     *
     * @throws EntityNotFoundException
     */
    public function delete(string $id): void
    {
        $this->details($id);
        $this->store->discard($this->type(), $id);
        $this->store->archive($this->type(), $id);
    }
}
