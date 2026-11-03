<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\ListOf;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Action<Details<PersonData>>
 */
#[AsAction('frootbox/people/person.create', 'Creates a person as a draft; frootbox/people/person.publish puts the person online')]
final readonly class CreatePerson implements Action
{
    /**
     * @param array<mixed>      $translations
     * @param array<mixed>|null $image
     * @param list<string>|null $locations
     */
    public function __construct(
        #[Description('Given name, e.g. "Maria"')]
        public ?string $givenName = null,
        #[Description('Family name, e.g. "Rossi"')]
        public ?string $familyName = null,
        #[Description('Before the name, e.g. "Dr."')]
        public ?string $prefix = null,
        #[Description('Email address')]
        public ?string $email = null,
        #[Description('Phone number, e.g. "+49 40 123456"')]
        public ?string $phone = null,
        #[Description('A photo from the media library: {"media": "<id>", "alt": "…"}; {} removes it')]
        public ?array $image = null,
        #[ListOf('string')]
        #[Description('Ids of the locations the person works at, replacing the ones before')]
        public ?array $locations = null,
        #[Range(0, PersonData::ORDER_MAX)]
        #[Description('Smaller comes first in the team, then by family name; 0 by default')]
        public ?int $order = null,
        #[Description('Texts by language: {"de": {"role": "Röstmeisterin", "text": "…"}}')]
        public array $translations = [],
    ) {}

    /**
     * @return Details<PersonData>
     */
    public function handle(PersonEditor $editor, PersonStore $store): Details
    {
        return $store->save(Ulid::generate(), $editor->change('frootbox/people/person.create', new PersonData(), $this->givenName, $this->familyName, $this->prefix, $this->translations, $this->email, $this->phone, $this->image, $this->locations, $this->order));
    }
}
