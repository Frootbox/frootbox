<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Action<Details<PersonData>>
 */
#[AsAction('frootbox/people/person.publish', 'Puts the draft of a person online, wherever a block shows it')]
final readonly class PublishPerson implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * @return Details<PersonData>
     */
    public function handle(PersonStore $store): Details
    {
        return $store->publish('frootbox/people/person.publish', $this->id);
    }
}
