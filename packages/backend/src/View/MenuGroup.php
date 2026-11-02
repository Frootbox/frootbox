<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

final readonly class MenuGroup
{
    /**
     * @param list<MenuEntry> $entries
     */
    public function __construct(
        public string $label,
        public array $entries,
    ) {}
}
