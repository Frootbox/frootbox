<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend;

use Frootbox\Backend\Http\DashboardHandler;
use Frootbox\Backend\Http\DesignHandler;
use Frootbox\Backend\Http\LoginHandler;
use Frootbox\Backend\Http\LogoutHandler;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;

/**
 * The backend below backend.path, default /cms (decisions 0110 to 0114).
 * It is only a user interface: what its screens read or change are
 * queries and actions of the core and the modules.
 */
final class BackendExtension implements Extension
{
    public const string ROOT = __DIR__ . '/..';

    public function register(Registry $registry): void
    {
        $registry->mount('backend.path', '/cms')
            ->get('/', DashboardHandler::class, 'backend.dashboard')
            ->route(['GET', 'POST'], '/login', LoginHandler::class, 'backend.login')
            ->post('/logout', LogoutHandler::class, 'backend.logout')
            ->get('/design', DesignHandler::class, 'backend.design');

        $registry->import('lit', 'assets/build/lit.js');
        $registry->import('htmx.org', 'assets/build/htmx.js');
        $registry->import('@frootbox/ui', 'assets/build/ui.js');

        $registry->add(Screen::class, new Screen('Dashboard', 'backend.dashboard', Screen::CONTENT, 'dashboard', order: 0));
        $registry->add(Screen::class, new Screen('Design system', 'backend.design', Screen::ADMINISTRATION, 'palette', DesignHandler::PERMISSION, order: 900, development: true));
    }
}
