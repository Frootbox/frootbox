<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Core\Support\Message;

/**
 * A person or a location as its draft or published version holds it.
 */
interface Data
{
    /**
     * @param array<mixed> $data
     */
    public static function fromArray(array $data): static;

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array;

    /**
     * What publishing needs that a draft may leave out (decision 0101).
     *
     * @return array<string, Message> by JSON pointer
     */
    public function incomplete(): array;
}
