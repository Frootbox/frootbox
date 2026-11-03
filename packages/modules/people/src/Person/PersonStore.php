<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\People\Store;

/**
 * @extends Store<PersonData>
 */
final readonly class PersonStore extends Store
{
    public const string TYPE = 'frootbox/people/person';

    public function type(): string
    {
        return self::TYPE;
    }

    protected function data(array $data): PersonData
    {
        return PersonData::fromArray($data);
    }
}
