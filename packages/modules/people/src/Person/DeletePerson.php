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

/**
 * @implements Action<null>
 */
#[AsAction('frootbox/people/person.delete', 'Deletes a person; blocks showing the person show nothing then')]
final readonly class DeletePerson implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    public function handle(PersonEditor $editor): null
    {
        $editor->delete($this->id);

        return null;
    }
}
