<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\People\Store;

/**
 * @extends Store<LocationData>
 */
final readonly class LocationStore extends Store
{
    public const string TYPE = 'frootbox/people/location';

    public function type(): string
    {
        return self::TYPE;
    }

    protected function data(array $data): LocationData
    {
        return LocationData::fromArray($data);
    }
}
