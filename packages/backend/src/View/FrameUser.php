<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

final readonly class FrameUser
{
    public function __construct(
        public string $name,
        public string $initials,
    ) {}

    public static function named(string $name): self
    {
        $words = preg_split('/\s+/u', trim($name), -1, \PREG_SPLIT_NO_EMPTY);
        $words = false === $words || [] === $words ? ['?'] : $words;
        $initials = mb_substr($words[0], 0, 1) . (\count($words) > 1 ? mb_substr($words[\count($words) - 1], 0, 1) : '');

        return new self($name, mb_strtoupper($initials));
    }
}
