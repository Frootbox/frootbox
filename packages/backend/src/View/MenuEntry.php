<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

final readonly class MenuEntry
{
    public function __construct(
        public string $label,
        public string $url,
        public string $icon,
        public bool $current,
    ) {}
}
