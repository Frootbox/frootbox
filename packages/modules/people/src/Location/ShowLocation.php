<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Query<Details<LocationData>>
 */
#[AsQuery('frootbox/people/location.show', 'Returns a location with its draft and its published version')]
final readonly class ShowLocation implements Query
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * @return Details<LocationData>
     */
    public function handle(LocationStore $store): Details
    {
        return $store->details($this->id);
    }
}
