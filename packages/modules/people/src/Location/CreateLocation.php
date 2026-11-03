<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Action<Details<LocationData>>
 */
#[AsAction('frootbox/people/location.create', 'Creates a location as a draft; frootbox/people/location.publish puts it online')]
final readonly class CreateLocation implements Action
{
    /**
     * @param array<mixed>      $translations
     * @param array<mixed>|null $image
     */
    public function __construct(
        #[Description('Texts by language: {"de": {"name": "Café am Hafen", "hours": "Mo–Fr 8–18 Uhr", "text": "…"}}')]
        public array $translations,
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
        return $store->save(Ulid::generate(), $editor->change('frootbox/people/location.create', new LocationData(), $this->translations, $this->street, $this->postalCode, $this->city, $this->country, $this->phone, $this->email, $this->coordinates, $this->image));
    }
}
