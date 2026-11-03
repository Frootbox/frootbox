<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

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
use Frootbox\People\Details;
use Frootbox\People\Input;
use Frootbox\People\Location\LocationStore;

/**
 * Applies changes to a person; what is null stays as it is. Publishing,
 * taking offline and deleting bring categories, tags, further fields and
 * the addresses of the profiles up to date (decision 0242).
 */
final readonly class PersonEditor
{
    public const int MAX_LOCATIONS = 20;

    public function __construct(
        private Languages $languages,
        private LocationStore $locations,
        private PersonStore $store,
        private RevisionStore $revisions,
        private MediaEditor $media,
        private AddressSync $addresses,
        private PluginSpaces $spaces,
        private ObjectCategories $categories,
        private ObjectTags $tags,
        private ObjectFields $fields,
    ) {}

    /**
     * @param array<mixed>|null $translations {"de": {"role": "…", "text": "…"}, "en": null}
     * @param array<mixed>|null $image
     * @param list<string>|null $locations
     * @param list<string>|null $categories
     * @param list<string>|null $tags
     * @param array<mixed>|null $fields
     *
     * @throws InvalidInputException
     */
    public function change(
        string $action,
        PersonData $current,
        ?string $givenName = null,
        ?string $familyName = null,
        ?string $prefix = null,
        ?array $translations = null,
        ?string $email = null,
        ?string $phone = null,
        ?array $image = null,
        ?array $locations = null,
        ?int $order = null,
        ?string $space = null,
        ?string $slug = null,
        ?array $categories = null,
        ?array $tags = null,
        ?array $fields = null,
        string $id = '',
    ): PersonData {
        $input = new Input($action);
        $space ??= $current->space;
        $texts = $current->translations;

        foreach (null === $translations ? [] : $input->byLanguage($translations, $this->languages) as $language => $value) {
            if (null === $value) {
                unset($texts[$language]);

                continue;
            }

            $at = '/translations/' . $language;
            $before = $texts[$language] ?? new PersonText();
            $texts[$language] = new PersonText(
                $input->text($value, 'role', $before->role, PersonText::ROLE_LENGTH, $at),
                $input->text($value, 'text', $before->text, PersonText::TEXT_LENGTH, $at),
            );
        }

        if (!$this->spaces->exists(PersonStore::TYPE, $space)) {
            $input->error('/space', new Message('There is no such space of the people.'));
        }

        $data = new PersonData(
            $input->line($givenName, $current->givenName, 100, '/givenName'),
            $input->line($familyName, $current->familyName, 100, '/familyName'),
            $input->line($prefix, $current->prefix, 40, '/prefix'),
            $input->email($email, $current->email),
            $input->phone($phone, $current->phone),
            $input->image($image, $current->image),
            null === $locations ? $current->locations : $this->locations($input, $locations),
            null === $order ? $current->order : max(0, min(PersonData::ORDER_MAX, $order)),
            $texts,
            $space,
            $current->slug,
            null === $categories ? $current->categories : $this->categories->check($action, PersonStore::TYPE, $categories),
            null === $tags ? $current->tags : $this->tags->check($action, PersonStore::TYPE, $space, $tags),
            null === $fields ? $current->fields : $this->fields->check($action, PersonStore::TYPE, $current->fields, $fields),
        );
        $data = $data->withSlug($this->slug($input, $current, $data, $slug, $id));
        $input->check();

        return $data;
    }

    /**
     * Publishes the drafts of people together, once each is complete and
     * no other person has its slug.
     *
     * @param list<string> $ids
     *
     * @return list<Details<PersonData>>
     *
     * @throws InvalidInputException
     * @throws EntityNotFoundException
     */
    public function publish(string $action, array $ids): array
    {
        $ids = array_values(array_unique($ids));

        if ([] === $ids) {
            throw new InvalidInputException($action, ['/ids' => 'needs at least one person id.']);
        }

        $errors = [];
        $drafts = [];
        $taken = $this->slugs($ids, true);

        foreach ($ids as $index => $id) {
            $draft = $this->store->draft($id);

            if (null === $draft) {
                $this->store->details($id);
                $errors['/ids/' . $index] = new Message('The person {id} has no draft to publish.', ['id' => $id]);

                continue;
            }

            foreach ($draft->incomplete() as $pointer => $message) {
                $errors['/ids/' . $index . $pointer] = $message;
            }

            if ('' !== $draft->slug && isset($taken[$draft->slug])) {
                $errors['/ids/' . $index . '/slug'] = new Message('Another person has the slug "{slug}" already.', ['slug' => $draft->slug]);
            }

            $taken[$draft->slug] = true;
            $drafts[$id] = $draft;
        }

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        $media = [];

        foreach ($drafts as $id => $draft) {
            $this->revisions->publish(PersonStore::TYPE, $id);
            $this->categories->sync(PersonStore::TYPE, $id, $draft->categories);
            $this->tags->sync(PersonStore::TYPE, $id, $draft->tags);
            $this->fields->sync(PersonStore::TYPE, $id, $draft->fields);

            if (null !== $draft->media()) {
                $media[] = $draft->media();
            }
        }

        // The photo becomes public with the first published person that shows it.
        $this->media->makePublic($media);
        $this->addresses->sync();

        return array_map($this->store->details(...), $ids);
    }

    /**
     * Takes a person offline; the person stays as a draft.
     *
     * @return Details<PersonData>
     *
     * @throws InvalidInputException
     * @throws EntityNotFoundException
     */
    public function unpublish(string $action, string $id): Details
    {
        $this->store->details($id);
        $published = $this->store->published($id) ?? throw new InvalidInputException($action, ['/id' => new Message('The person {id} is not published.', ['id' => $id])]);

        if (null === $this->store->draft($id)) {
            $this->revisions->saveDraft(PersonStore::TYPE, $id, $published->toArray());
        }

        $this->revisions->archive(PersonStore::TYPE, $id);
        $this->forget($id);

        return $this->store->details($id);
    }

    /**
     * Deletes the draft and takes the published version offline. The
     * versions stay.
     *
     * @throws EntityNotFoundException
     */
    public function delete(string $id): void
    {
        $published = null !== $this->store->published($id);
        $this->store->delete($id);

        if ($published) {
            $this->forget($id);
        }
    }

    /**
     * Without a published version: no categories, tags, fields and address.
     */
    private function forget(string $id): void
    {
        $this->categories->clear(PersonStore::TYPE, $id);
        $this->tags->clear(PersonStore::TYPE, $id);
        $this->fields->clear(PersonStore::TYPE, $id);
        $this->addresses->sync();
    }

    /**
     * The slug of a person: one given, else the one before; one that came
     * from the name follows the name (decision 0242).
     */
    private function slug(Input $input, PersonData $current, PersonData $data, ?string $given, string $id): string
    {
        $automatic = null === $given && ('' === $current->slug || $current->slug === $current->nameSlug());
        $slug = null === $given ? ($automatic ? $data->nameSlug() : $current->slug) : trim($given);

        if ('' === $slug) {
            // Empty takes the slug from the name again.
            $automatic = true;
            $slug = $data->nameSlug();
        }

        if ('' === $slug) {
            return '';
        }

        $taken = $this->slugs('' === $id ? [] : [$id], false);

        if ($automatic) {
            // One from the name finds a free one: "lukas-hansen-2".
            $base = mb_substr($slug, 0, Slug::MAX_LENGTH - 4);

            for ($number = 2; isset($taken[$slug]); ++$number) {
                $slug = $base . '-' . $number;
            }

            return $slug;
        }

        if (mb_strlen($slug) > Slug::MAX_LENGTH || !Slug::isValid($slug)) {
            $input->error('/slug', new Message('must be at most {max} lower-case letters, digits and hyphens, e.g. "maria-rossi".', ['max' => Slug::MAX_LENGTH]));
        } elseif (isset($taken[$slug])) {
            $input->error('/slug', new Message('Another person has the slug "{slug}" already.', ['slug' => $slug]));
        }

        return $slug;
    }

    /**
     * The slugs other people hold: when publishing those that are
     * published, else also those of drafts. Slugs hold across all spaces
     * (decision 0236).
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
                if ('' !== $data->slug) {
                    $slugs[$data->slug] = true;
                }
            }
        }

        return $slugs;
    }

    /**
     * Known locations only, each once.
     *
     * @param list<string> $ids
     *
     * @return list<string>
     */
    private function locations(Input $input, array $ids): array
    {
        $known = $this->locations->ids();

        foreach ($ids as $index => $id) {
            if (!\in_array($id, $known, true)) {
                $input->error('/locations/' . $index, new Message('There is no location "{id}".', ['id' => $id]));
            }
        }

        if (\count($ids) > self::MAX_LOCATIONS) {
            $input->error('/locations', new Message('may have at most {count} locations.', ['count' => self::MAX_LOCATIONS]));
        }

        return array_values(array_unique($ids));
    }
}
