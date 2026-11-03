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
use Frootbox\People\Details;

/**
 * @implements Action<Details<LocationData>|null>
 */
#[AsAction('frootbox/people/location.discard', 'Throws away the draft of a location; one never published is gone then')]
final readonly class DiscardLocation implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * @return Details<LocationData>|null
     */
    public function handle(LocationStore $store): ?Details
    {
        return $store->discard('frootbox/people/location.discard', $this->id);
    }
}
