<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Media\MediaEditor;
use Frootbox\Core\Page\Slug;
use Frootbox\Core\Plugin\PluginSpaces;
use Frootbox\Core\Revision\RevisionStore;
use Frootbox\Core\Support\Message;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Url\AddressSync;
use Frootbox\Database\EntityNotFoundException;
use Frootbox\RichText\RichText;

/**
 * Changes articles like PageEditor changes pages (decision 0219): every
 * change goes into the draft, publishing writes it into the tables. The
 * actions of the news call it.
 */
final readonly class ArticleEditor
{
    public const int TITLE_LENGTH = 300;

    public const int TEASER_LENGTH = 1000;

    private const string MEDIA_PATTERN = '/^[0-9A-HJKMNP-TV-Z]{26}$/';

    public function __construct(
        private ArticleStore $store,
        private RevisionStore $revisions,
        private Articles $articles,
        private ArticleTranslations $translations,
        private ObjectCategories $categories,
        private ObjectTags $tags,
        private MediaEditor $media,
        private RichText $richText,
        private AddressSync $addresses,
        private Languages $languages,
        private PluginSpaces $spaces,
    ) {}

    /**
     * Checks a draft and saves it. Drafts may be unfinished: an empty
     * title only counts when publishing (decision 0101).
     *
     * @throws InvalidInputException
     */
    public function saveDraft(string $action, string $id, ArticleData $data): ArticleDetails
    {
        $errors = $this->check($id, $data, false);

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        $this->revisions->saveDraft(ArticleStore::TYPE, $id, $data->toArray());

        return $this->store->details($id);
    }

    /**
     * Applies translations from an action to the current ones. A language
     * set to null is removed; fields left out are kept. A new language
     * without a slug gets one from its title.
     *
     *     {"de": {"title": "Neue Sorten", "teaser": "…"}, "en": null}
     *
     * @param array<mixed>               $input
     * @param array<string, ArticleText> $current
     *
     * @return array<string, ArticleText>
     *
     * @throws InvalidInputException
     */
    public function translations(string $action, array $input, array $current = []): array
    {
        if ([] !== $input && array_is_list($input)) {
            throw new InvalidInputException($action, ['/translations' => 'must be an object by language code, e.g. {"de": {"title": "Neue Sorten"}}.']);
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

            foreach (['title', 'slug', 'teaser'] as $key) {
                if (\array_key_exists($key, $value) && !\is_string($value[$key])) {
                    $errors[$at . '/' . $key] = 'must be a text.';
                }
            }

            if (\array_key_exists('text', $value) && !\is_array($value['text'])) {
                $errors[$at . '/text'] = 'must be rich text as Tiptap JSON, e.g. {"type": "doc", "content": []}.';
            }

            if (isset($errors[$at . '/title']) || isset($errors[$at . '/slug']) || isset($errors[$at . '/teaser']) || isset($errors[$at . '/text'])) {
                continue;
            }

            $before = $current[$language] ?? null;
            $title = \is_string($value['title'] ?? null) ? trim($value['title']) : $before->title ?? '';
            $slug = \is_string($value['slug'] ?? null) ? trim($value['slug']) : $before->slug ?? '';

            if ('' === $slug && (null === $before || !\array_key_exists('slug', $value))) {
                $slug = Slug::fromTitle($title, $language);
            }

            $current[$language] = new ArticleText(
                $title,
                $slug,
                \is_string($value['teaser'] ?? null) ? trim($value['teaser']) : $before->teaser ?? '',
                \is_array($value['text'] ?? null) ? $value['text'] : $before->text ?? ArticleText::EMPTY_TEXT,
            );
        }

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        return $current;
    }

    /**
     * Publishes the drafts of articles together.
     *
     * @param list<string> $ids
     *
     * @return list<ArticleDetails>
     *
     * @throws InvalidInputException
     */
    public function publish(string $action, array $ids): array
    {
        $ids = array_values(array_unique($ids));

        if ([] === $ids) {
            throw new InvalidInputException($action, ['/ids' => 'needs at least one article id.']);
        }

        $errors = [];
        $drafts = [];

        foreach ($ids as $index => $id) {
            $draft = $this->store->draft($id);

            if (null === $draft) {
                $errors['/ids/' . $index] = \sprintf('The article %s has no draft to publish.', $id);

                continue;
            }

            $drafts[$id] = $draft;

            foreach ($this->check($id, $draft, true, $ids) as $pointer => $message) {
                $errors['/ids/' . $index . $pointer] = $message;
            }
        }

        // Two articles of the same batch may not take the same address.
        $taken = [];

        foreach ($drafts as $id => $draft) {
            foreach ($draft->translations as $language => $text) {
                $key = $language . '|' . $text->slug;

                if (isset($taken[$key])) {
                    $errors['/ids/' . array_search($id, $ids, true) . '/translations/' . $language . '/slug'] = new Message('Another article has the slug "{slug}" already.', ['slug' => $text->slug]);
                }

                $taken[$key] = true;
            }
        }

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        $media = [];

        foreach ($drafts as $id => $draft) {
            $this->write($id, $draft);
            $this->revisions->publish(ArticleStore::TYPE, $id);

            if (null !== $draft->media()) {
                $media[] = $draft->media();
            }
        }

        // Media become public with the first published article that uses them.
        $this->media->makePublic($media);
        $this->addresses->sync();

        return array_map($this->store->details(...), $ids);
    }

    /**
     * Takes an article offline; it stays as a draft.
     *
     * @throws InvalidInputException
     */
    public function unpublish(string $action, string $id): ArticleDetails
    {
        $published = $this->store->published($id) ?? throw new InvalidInputException($action, ['/id' => \sprintf('The article %s is not published.', $id)]);

        if (null === $this->store->draft($id)) {
            $this->revisions->saveDraft(ArticleStore::TYPE, $id, $published->toArray());
        }

        $this->removeRows($id);
        $this->revisions->archive(ArticleStore::TYPE, $id);
        $this->addresses->sync();

        return $this->store->details($id);
    }

    /**
     * Removes the draft. An article that was never published is gone then.
     *
     * @return ArticleDetails|null null if the article is gone
     *
     * @throws InvalidInputException
     */
    public function discard(string $action, string $id): ?ArticleDetails
    {
        if (null === $this->store->draft($id)) {
            throw new InvalidInputException($action, ['/id' => 'The article has no draft.']);
        }

        $this->revisions->discard(ArticleStore::TYPE, $id);

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

        $this->removeRows($id);
        $this->revisions->discard(ArticleStore::TYPE, $id);
        $this->revisions->archive(ArticleStore::TYPE, $id);

        if ($published) {
            $this->addresses->sync();
        }
    }

    /**
     * Plans when the draft is published and when the article goes offline.
     *
     * @throws InvalidInputException
     * @throws EntityNotFoundException
     */
    public function schedule(string $action, string $id, ?DateTimeImmutable $publishAt, ?DateTimeImmutable $unpublishAt): ArticleDetails
    {
        $this->store->details($id);
        $errors = [];

        if (!$this->revisions->publishAt(ArticleStore::TYPE, $id, $publishAt) && null !== $publishAt) {
            $errors['/publishAt'] = 'The article has no draft to publish.';
        }

        if (!$this->revisions->unpublishAt(ArticleStore::TYPE, $id, $unpublishAt) && null !== $unpublishAt) {
            $errors['/unpublishAt'] = 'The article is not published.';
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
     * The categories of an action's input, each must be one of a group
     * for articles (decision 0233). Categories deleted later simply drop
     * out when publishing.
     *
     * @param list<string> $ids
     *
     * @return list<string>
     *
     * @throws InvalidInputException
     */
    public function categories(string $action, array $ids): array
    {
        return $this->categories->check($action, ArticleStore::TYPE, $ids);
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
        return $this->tags->check($action, ArticleStore::TYPE, $space, $entries);
    }

    /**
     * The errors of an article by JSON pointer.
     *
     * @param list<string> $batch Articles published together, their slugs are checked among themselves
     *
     * @return array<string, string|Message>
     */
    private function check(string $id, ArticleData $data, bool $publishing, array $batch = []): array
    {
        $errors = [];

        if ([] === $data->translations) {
            $errors['/translations'] = 'needs at least one language, e.g. {"de": {"title": "Neue Sorten"}}.';
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
                $errors[$at . '/slug'] = new Message('Another article has the slug "{slug}" already.', ['slug' => $text->slug]);
            }

            if (mb_strlen($text->teaser) > self::TEASER_LENGTH) {
                $errors[$at . '/teaser'] = new Message('must be at most {max} characters.', ['max' => self::TEASER_LENGTH]);
            }

            foreach ($this->richText->validate($text->text) as $violation) {
                $errors[$at . '/text' . $violation->pointer] = $violation->message;
            }
        }

        if (!$this->spaces->exists(ArticleStore::TYPE, $data->space)) {
            $errors['/space'] = 'There is no such space of the news.';
        }

        if (null !== $data->image && (null === $data->media() || 1 !== preg_match(self::MEDIA_PATTERN, $data->media()))) {
            $errors['/image'] = 'must be an image as {"media": "<id>", "alt": "…"}.';
        }

        return $errors;
    }

    /**
     * The slugs other articles hold, as "language|slug": when publishing
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

    private function write(string $id, ArticleData $data): void
    {
        $values = ['date' => $data->date, 'image' => $data->image, 'space' => $data->space];

        if (null === $this->articles->fetchById($id)) {
            $this->articles->insert(['id' => $id, ...$values]);
        } else {
            $this->articles->update($id, $values);
        }

        $existing = $this->translations->of($id);

        foreach ($data->translations as $language => $text) {
            $row = ['title' => $text->title, 'slug' => $text->slug, 'teaser' => $text->teaser, 'text' => $text->text];

            if (isset($existing[$language])) {
                $this->translations->update($existing[$language]->id, $row);
            } else {
                $this->translations->insert(['articleId' => $id, 'language' => $language, ...$row]);
            }
        }

        foreach (array_diff_key($existing, $data->translations) as $removed) {
            $this->translations->delete($removed->id);
        }

        $this->categories->sync(ArticleStore::TYPE, $id, $data->categories);
        $this->tags->sync(ArticleStore::TYPE, $id, $data->tags);
    }

    private function removeRows(string $id): void
    {
        foreach ($this->translations->of($id) as $translation) {
            $this->translations->delete($translation->id);
        }

        $this->categories->clear(ArticleStore::TYPE, $id);
        $this->tags->clear(ArticleStore::TYPE, $id);
        $this->articles->delete($id);
    }
}
