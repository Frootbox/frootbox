<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

/**
 * A kind of mark on text, e.g. "bold" or "link".
 */
interface MarkType
{
    public function name(): string;

    /**
     * Allowed attributes. Others are ignored.
     *
     * @return array<string, Attribute>
     */
    public function attributes(): array;

    /**
     * @param array<string, string|int|null> $attributes Checked values of attributes()
     */
    public function open(array $attributes): string;

    /**
     * @param array<string, string|int|null> $attributes
     */
    public function close(array $attributes): string;
}
