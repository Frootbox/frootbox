<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;

/**
 * @implements Action<null>
 */
#[AsAction('frootbox/people/location.delete', 'Deletes a location; blocks showing it show nothing then, people keep their other locations')]
final readonly class DeleteLocation implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    public function handle(LocationStore $store): null
    {
        $store->delete($this->id);

        return null;
    }
}
