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
#[AsAction('frootbox/people/person.unpublish', 'Takes a person offline; the person stays as a draft')]
final readonly class UnpublishPerson implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * @return Details<PersonData>
     */
    public function handle(PersonEditor $editor): Details
    {
        return $editor->unpublish('frootbox/people/person.unpublish', $this->id);
    }
}
