<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Query<Details<PersonData>>
 */
#[AsQuery('frootbox/people/person.show', 'Returns a person with its draft and its published version')]
final readonly class ShowPerson implements Query
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
        return $store->details($this->id);
    }
}
