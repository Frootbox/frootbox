<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
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
