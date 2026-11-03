<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Language\Languages;
use Frootbox\People\Input;

/**
 * Applies changes to a location; what is null stays as it is.
 */
final readonly class LocationEditor
{
    public function __construct(private Languages $languages) {}

    /**
     * @param array<mixed>|null $translations {"de": {"name": "…", "hours": "…", "text": "…"}, "en": null}
     * @param array<mixed>|null $image
     *
     * @throws InvalidInputException
     */
    public function change(
        string $action,
        LocationData $current,
        ?array $translations = null,
        ?string $street = null,
        ?string $postalCode = null,
        ?string $city = null,
        ?string $country = null,
        ?string $phone = null,
        ?string $email = null,
        ?string $coordinates = null,
        ?array $image = null,
    ): LocationData {
        $input = new Input($action);
        $texts = $current->translations;

        foreach (null === $translations ? [] : $input->byLanguage($translations, $this->languages) as $language => $value) {
            if (null === $value) {
                unset($texts[$language]);

                continue;
            }

            $at = '/translations/' . $language;
            $before = $texts[$language] ?? new LocationText('');
            $texts[$language] = new LocationText(
                $input->text($value, 'name', $before->name, LocationText::NAME_LENGTH, $at),
                $input->text($value, 'hours', $before->hours, LocationText::HOURS_LENGTH, $at),
                $input->text($value, 'text', $before->text, LocationText::TEXT_LENGTH, $at),
            );
        }

        $data = new LocationData(
            $texts,
            $input->line($street, $current->street, 200, '/street'),
            $input->line($postalCode, $current->postalCode, 20, '/postalCode'),
            $input->line($city, $current->city, 100, '/city'),
            $input->line($country, $current->country, 100, '/country'),
            $input->phone($phone, $current->phone),
            $input->email($email, $current->email),
            $input->coordinates($coordinates, $current->coordinates),
            $input->image($image, $current->image),
        );
        $input->check();

        return $data;
    }
}
