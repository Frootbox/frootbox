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

    /** The group of categories of the people (decisions 0233, 0242) */
    public const string CATEGORIES = 'frootbox/people/categories';

    public function type(): string
    {
        return self::TYPE;
    }

    protected function data(array $data): PersonData
    {
        return PersonData::fromArray($data);
    }
}
