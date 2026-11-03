<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use DateTimeImmutable;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Media\MediaEditor;
use Frootbox\Core\ObjectField\ObjectFields;
use Frootbox\Core\Page\Slug;
use Frootbox\Core\Plugin\PluginSpaces;
use Frootbox\Core\Revision\RevisionStore;
use Frootbox\Core\Support\Message;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Url\AddressSync;
use Frootbox\Database\EntityNotFoundException;
use Frootbox\RichText\RichText;

/**
 * Changes entries (decision 0231): every change goes into the draft,
 * publishing puts it online and gives it its address. The actions of the
 * entries call it.
 */
final readonly class EntryEditor
{
    public const int TITLE_LENGTH = 300;

    public const int TEASER_LENGTH = 1000;

    public function __construct(
        private EntryStore $store,
        private RevisionStore $revisions,
        private MediaEditor $media,
        private RichText $richText,
        private AddressSync $addresses,
        private Languages $languages,
        private PluginSpaces $spaces,
        private ObjectCategories $categories,
        private ObjectTags $tags,
        private ObjectFields $fields,
    ) {}

    /**
     * Checks a draft and saves it. Drafts may be unfinished: an empty
     * title only counts when publishing (decision 0101).
     *
     * @throws InvalidInputException
     */
    public function saveDraft(string $action, string $id, EntryData $data): EntryDetails
    {
        $errors = $this->check($id, $data, false);

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        $this->revisions->saveDraft(EntryStore::TYPE, $id, $data->toArray());

        return $this->store->details($id);
    }

    /**
     * Applies translations from an action to the current ones. A language
     * set to null is removed; fields left out are kept. A new language
     * without a slug gets one from its title.
     *
     *     {"de": {"title": "Haus am See", "teaser": "…"}, "en": null}
     *
     * @param array<mixed>           $input
     * @param array<string, EntryText> $current
     *
     * @return array<string, EntryText>
     *
     * @throws InvalidInputException
     */
    public function translations(string $action, array $input, array $current = []): array
    {
        if ([] !== $input && array_is_list($input)) {
            throw new InvalidInputException($action, ['/translations' => 'must be an object by language code, e.g. {"de": {"title": "Haus am See"}}.']);
        }

        $errors = [];

        foreach ($input as $language => $value) {
            $language = (string) $language;
            $at = '/translations/' . $language;

            if (null === $value) {
                unset($current[$language]);

                continue;
            }

            if (!\is_array($value) || ([] !== $value && array_is_list($value))) {
                $errors[$at] = 'must be an object with "title" and optionally "slug", "teaser" and "text".';

                continue;
            }

            $wrong = false;

            foreach (['title', 'slug', 'teaser'] as $key) {
                if (\array_key_exists($key, $value) && !\is_string($value[$key])) {
                    $errors[$at . '/' . $key] = 'must be a text.';
                    $wrong = true;
                }
            }

            if (\array_key_exists('text', $value) && !\is_array($value['text'])) {
                $errors[$at . '/text'] = 'must be rich text as Tiptap JSON, e.g. {"type": "doc", "content": []}.';
                $wrong = true;
            }

            if ($wrong) {
                continue;
            }

            $before = $current[$language] ?? null;
            $title = \is_string($value['title'] ?? null) ? trim($value['title']) : $before->title ?? '';
            $slug = \is_string($value['slug'] ?? null) ? trim($value['slug']) : $before->slug ?? '';

            if ('' === $slug && (null === $before || !\array_key_exists('slug', $value))) {
                $slug = Slug::fromTitle($title, $language);
            }

            $current[$language] = new EntryText(
                $title,
                $slug,
                \is_string($value['teaser'] ?? null) ? trim($value['teaser']) : $before->teaser ?? '',
                \is_array($value['text'] ?? null) ? $value['text'] : $before->text ?? EntryText::EMPTY_TEXT,
            );
        }

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        return $current;
    }

    /**
     * The categories of an action's input, each must be one of a group
     * for entries (decision 0233). Categories deleted later simply drop out
     * when publishing.
     *
     * @param list<string> $ids
     *
     * @return list<string>
     *
     * @throws InvalidInputException
     */
    public function categories(string $action, array $ids): array
    {
        return $this->categories->check($action, EntryStore::TYPE, $ids);
    }

    /**
     * The further fields of an action's input after those of the draft
     * (decision 0240), checked against the views of the theme.
     *
     * @param array<mixed> $current
     * @param array<mixed> $input
     *
     * @return array<string, mixed>
     *
     * @throws InvalidInputException
     */
    public function fields(string $action, array $current, array $input): array
    {
        return $this->fields->check($action, EntryStore::TYPE, $current, $input);
    }

    /**
     * The tags of an action's input (decision 0239): ids, keys or labels;
     * presets of the space and new words become tags here, unless only
     * the presets count.
     *
     * @param list<string> $entries
     *
     * @return list<string>
     *
     * @throws InvalidInputException
     */
    public function tags(string $action, string $space, array $entries): array
    {
        return $this->tags->check($action, EntryStore::TYPE, $space, $entries);
    }

    /**
     * Publishes the drafts of entries together.
     *
     * @param list<string> $ids
     *
     * @return list<EntryDetails>
     *
     * @throws InvalidInputException
     */
    public function publish(string $action, array $ids): array
    {
        $ids = array_values(array_unique($ids));

        if ([] === $ids) {
            throw new InvalidInputException($action, ['/ids' => 'needs at least one entry id.']);
        }

        $errors = [];
        $drafts = [];

        foreach ($ids as $index => $id) {
            $draft = $this->store->draft($id);

            if (null === $draft) {
                $errors['/ids/' . $index] = \sprintf('The entry %s has no draft to publish.', $id);

                continue;
            }

            $drafts[$id] = $draft;

            foreach ($this->check($id, $draft, true, $ids) as $pointer => $message) {
                $errors['/ids/' . $index . $pointer] = $message;
            }
        }

        // Two entries of the same batch may not take the same address.
        $taken = [];

        foreach ($drafts as $id => $draft) {
            foreach ($draft->translations as $language => $text) {
                $key = $language . '|' . $text->slug;

                if (isset($taken[$key])) {
                    $errors['/ids/' . array_search($id, $ids, true) . '/translations/' . $language . '/slug'] = new Message('Another entry has the slug "{slug}" already.', ['slug' => $text->slug]);
                }

                $taken[$key] = true;
            }
        }

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        $media = [];

        foreach ($drafts as $id => $draft) {
            $this->revisions->publish(EntryStore::TYPE, $id);
            $this->categories->sync(EntryStore::TYPE, $id, $draft->categories);
            $this->tags->sync(EntryStore::TYPE, $id, $draft->tags);
            $this->fields->sync(EntryStore::TYPE, $id, $draft->fields);

            if (null !== $draft->media()) {
                $media[] = $draft->media();
            }
        }

        // Media become public with the first published entry that uses them.
        $this->media->makePublic($media);
        $this->addresses->sync();

        return array_map($this->store->details(...), $ids);
    }

    /**
     * Takes an entry offline; it stays as a draft.
     *
     * @throws InvalidInputException
     */
    public function unpublish(string $action, string $id): EntryDetails
    {
        $published = $this->store->published($id) ?? throw new InvalidInputException($action, ['/id' => \sprintf('The entry %s is not published.', $id)]);

        if (null === $this->store->draft($id)) {
            $this->revisions->saveDraft(EntryStore::TYPE, $id, $published->toArray());
        }

        $this->revisions->archive(EntryStore::TYPE, $id);
        $this->categories->clear(EntryStore::TYPE, $id);
        $this->tags->clear(EntryStore::TYPE, $id);
        $this->fields->clear(EntryStore::TYPE, $id);
        $this->addresses->sync();

        return $this->store->details($id);
    }

    /**
     * Removes the draft. An entry that was never published is gone then.
     *
     * @return EntryDetails|null null if the entry is gone
     *
     * @throws InvalidInputException
     */
    public function discard(string $action, string $id): ?EntryDetails
    {
        if (null === $this->store->draft($id)) {
            throw new InvalidInputException($action, ['/id' => 'The entry has no draft.']);
        }

        $this->revisions->discard(EntryStore::TYPE, $id);

        return null === $this->store->published($id) ? null : $this->store->details($id);
    }

    /**
     * Deletes the published state and the draft. The versions stay.
     *
     * @throws EntityNotFoundException
     */
    public function delete(string $id): void
    {
        $this->store->details($id);
        $published = null !== $this->store->published($id);

        $this->revisions->discard(EntryStore::TYPE, $id);
        $this->revisions->archive(EntryStore::TYPE, $id);
        $this->categories->clear(EntryStore::TYPE, $id);
        $this->tags->clear(EntryStore::TYPE, $id);
        $this->fields->clear(EntryStore::TYPE, $id);

        if ($published) {
            $this->addresses->sync();
        }
    }

    /**
     * Plans when the draft is published and when the entry goes offline.
     *
     * @throws InvalidInputException
     * @throws EntityNotFoundException
     */
    public function schedule(string $action, string $id, ?DateTimeImmutable $publishAt, ?DateTimeImmutable $unpublishAt): EntryDetails
    {
        $this->store->details($id);
        $errors = [];

        if (!$this->revisions->publishAt(EntryStore::TYPE, $id, $publishAt) && null !== $publishAt) {
            $errors['/publishAt'] = 'The entry has no draft to publish.';
        }

        if (!$this->revisions->unpublishAt(EntryStore::TYPE, $id, $unpublishAt) && null !== $unpublishAt) {
            $errors['/unpublishAt'] = 'The entry is not published.';
        }

        if (null !== $publishAt && null !== $unpublishAt && $unpublishAt <= $publishAt) {
            $errors['/unpublishAt'] = 'must be after "publishAt".';
        }

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        return $this->store->details($id);
    }

    /**
     * The errors of an entry by JSON pointer.
     *
     * @param list<string> $batch Entries published together, their slugs are checked among themselves
     *
     * @return array<string, string|Message>
     */
    private function check(string $id, EntryData $data, bool $publishing, array $batch = []): array
    {
        $errors = [];

        if ([] === $data->translations) {
            $errors['/translations'] = 'needs at least one language, e.g. {"de": {"title": "Haus am See"}}.';
        }

        $slugs = $this->slugs([$id, ...$batch], $publishing);

        foreach ($data->translations as $language => $text) {
            $at = '/translations/' . $language;

            if (!$this->languages->has($language)) {
                $errors[$at] = new Message('"{language}" is no language of the website.', ['language' => $language]);

                continue;
            }

            if ('' === $text->title && $publishing) {
                $errors[$at . '/title'] = 'is required.';
            } elseif (mb_strlen($text->title) > self::TITLE_LENGTH) {
                $errors[$at . '/title'] = new Message('must be at most {max} characters.', ['max' => self::TITLE_LENGTH]);
            }

            if ('' === $text->slug) {
                if ($publishing || '' !== $text->title) {
                    $errors[$at . '/slug'] = 'is required.';
                }
            } elseif (mb_strlen($text->slug) > Slug::MAX_LENGTH || 1 !== preg_match('/' . Slug::PATTERN . '/u', $text->slug)) {
                $errors[$at . '/slug'] = new Message('must be at most {max} lower-case letters, digits and hyphens, e.g. "neue-sorten".', ['max' => Slug::MAX_LENGTH]);
            } elseif (isset($slugs[$language . '|' . $text->slug])) {
                $errors[$at . '/slug'] = new Message('Another entry has the slug "{slug}" already.', ['slug' => $text->slug]);
            }

            if (mb_strlen($text->teaser) > self::TEASER_LENGTH) {
                $errors[$at . '/teaser'] = new Message('must be at most {max} characters.', ['max' => self::TEASER_LENGTH]);
            }

            foreach ($this->richText->validate($text->text) as $violation) {
                $errors[$at . '/text' . $violation->pointer] = $violation->message;
            }
        }

        if (!$this->spaces->exists(EntryStore::TYPE, $data->space)) {
            $errors['/space'] = 'There is no such collection.';
        }

        if (null !== $data->image && (null === $data->media() || 1 !== preg_match(EntryData::ID_PATTERN, $data->media()))) {
            $errors['/image'] = 'must be an image as {"media": "<id>", "alt": "…"}.';
        }

        return $errors;
    }

    /**
     * The slugs other entries hold, as "language|slug": when publishing
     * those that are published, else also those of drafts.
     *
     * @param list<string> $except
     *
     * @return array<string, true>
     */
    private function slugs(array $except, bool $published): array
    {
        $slugs = [];

        foreach ($this->store->ids() as $id) {
            if (\in_array($id, $except, true)) {
                continue;
            }

            foreach (array_filter([$this->store->published($id), $published ? null : $this->store->draft($id)]) as $data) {
                foreach ($data->translations as $language => $text) {
                    $slugs[$language . '|' . $text->slug] = true;
                }
            }
        }

        return $slugs;
    }
}
