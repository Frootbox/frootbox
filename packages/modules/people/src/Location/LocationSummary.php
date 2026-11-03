<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\People\Status;

/**
 * A location in the list.
 */
final readonly class LocationSummary
{
    /**
     * @param list<string> $languages
     */
    public function __construct(
        public string $id,
        public Status $status,
        public string $name,
        public string $city,
        public array $languages,
    ) {}
}
