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
 * @implements Action<Details<PersonData>|null>
 */
#[AsAction('frootbox/people/person.discard', 'Throws away the draft of a person; one never published is gone then')]
final readonly class DiscardPerson implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * @return Details<PersonData>|null
     */
    public function handle(PersonStore $store): ?Details
    {
        return $store->discard('frootbox/people/person.discard', $this->id);
    }
}
