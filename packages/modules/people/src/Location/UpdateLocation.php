<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Action<Details<LocationData>>
 */
#[AsAction('frootbox/people/location.update', 'Changes the draft of a location; what is left out stays as it is')]
final readonly class UpdateLocation implements Action
{
    /**
     * @param array<mixed>|null $translations
     * @param array<mixed>|null $image
     */
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
        #[Description('Changes by language, e.g. {"de": {"hours": "…"}, "en": null}: texts left out stay, null removes a language')]
        public ?array $translations = null,
        #[Description('Street and number, e.g. "Hafenstraße 12"')]
        public ?string $street = null,
        #[Description('Postcode, e.g. "20457"')]
        public ?string $postalCode = null,
        #[Description('Town, e.g. "Hamburg"')]
        public ?string $city = null,
        #[Description('Country, left out in the own country')]
        public ?string $country = null,
        #[Description('Phone number, e.g. "+49 40 123456"')]
        public ?string $phone = null,
        #[Description('Email address')]
        public ?string $email = null,
        #[Description('Latitude and longitude for the map, e.g. "53.5444, 9.9663"')]
        public ?string $coordinates = null,
        #[Description('An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it')]
        public ?array $image = null,
    ) {}

    /**
     * @return Details<LocationData>
     */
    public function handle(LocationEditor $editor, LocationStore $store): Details
    {
        return $store->save($this->id, $editor->change('frootbox/people/location.update', $store->current($this->id), $this->translations, $this->street, $this->postalCode, $this->city, $this->country, $this->phone, $this->email, $this->coordinates, $this->image));
    }
}
