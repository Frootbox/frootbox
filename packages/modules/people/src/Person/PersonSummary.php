<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\People\Status;

/**
 * A person in the list.
 */
final readonly class PersonSummary
{
    /**
     * @param list<string> $languages
     */
    public function __construct(
        public string $id,
        public Status $status,
        public string $name,
        public string $role,
        public array $languages,
    ) {}
}
