<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Support\Message;
use Frootbox\People\Input;
use Frootbox\People\Location\LocationStore;

/**
 * Applies changes to a person; what is null stays as it is.
 */
final readonly class PersonEditor
{
    public const int MAX_LOCATIONS = 20;

    public function __construct(
        private Languages $languages,
        private LocationStore $locations,
    ) {}

    /**
     * @param array<mixed>|null $translations {"de": {"role": "…", "text": "…"}, "en": null}
     * @param array<mixed>|null $image
     * @param list<string>|null $locations
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
    ): PersonData {
        $input = new Input($action);
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
        );
        $input->check();

        return $data;
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
