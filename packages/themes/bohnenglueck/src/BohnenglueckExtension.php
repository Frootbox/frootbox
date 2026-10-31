<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\ThemeBohnenglueck;

use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;

final class BohnenglueckExtension implements Extension
{
    public function register(Registry $registry): void
    {
        // Temporary until pages arrive (M2, phase 3).
        $registry->get('/demo', DemoHandler::class);
    }
}
