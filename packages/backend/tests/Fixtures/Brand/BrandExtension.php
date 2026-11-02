<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Fixtures\Brand;

use Frootbox\Backend\Brand;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;

/**
 * A white label: its own name, logo and a pale accent with too little
 * contrast, so the design page warns.
 */
final class BrandExtension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->add(Brand::class, new Brand(
            name: 'Acme CMS',
            logo: __DIR__ . '/assets/logo.svg',
            colors: ['accent' => '#ffd84d', 'accent-hover' => ['light' => '#ffcc00', 'dark' => '#ffe066']],
        ));
    }
}
