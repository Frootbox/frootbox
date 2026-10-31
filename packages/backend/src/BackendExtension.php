<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend;

use Frootbox\Backend\Http\AccountHandler;
use Frootbox\Backend\Http\ActionHandler;
use Frootbox\Backend\Http\DashboardHandler;
use Frootbox\Backend\Http\DesignHandler;
use Frootbox\Backend\Http\LoginHandler;
use Frootbox\Backend\Http\LogoutHandler;
use Frootbox\Backend\Http\Users\RoleHandler;
use Frootbox\Backend\Http\Users\RolesHandler;
use Frootbox\Backend\Http\Users\UserHandler;
use Frootbox\Backend\Http\Users\UsersHandler;
use Frootbox\Core\Api\ApiHandler;
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
            ->post('/actions/' . ApiHandler::NAME, ActionHandler::class, 'backend.action')
            ->get('/design', DesignHandler::class, 'backend.design')
            ->get('/account', AccountHandler::class, 'backend.account')
            ->get('/users', UsersHandler::class, 'backend.users')
            ->get('/users/new', UserHandler::class, 'backend.users.new')
            ->get('/users/{id:\d+}', UserHandler::class, 'backend.users.show')
            ->get('/roles', RolesHandler::class, 'backend.roles')
            ->get('/roles/new', RoleHandler::class, 'backend.roles.new')
            ->get('/roles/{name:[a-z][a-z0-9-]*}', RoleHandler::class, 'backend.roles.show');

        $registry->import('lit', 'assets/build/lit.js');
        $registry->import('htmx.org', 'assets/build/htmx.js');
        $registry->import('@frootbox/ui', 'assets/build/ui.js');

        $registry->add(Screen::class, new Screen('Dashboard', 'backend.dashboard', Screen::CONTENT, 'dashboard', order: 0));
        $registry->add(Screen::class, new Screen('Users', 'backend.users', Screen::ADMINISTRATION, 'users', UsersHandler::PERMISSION, order: 100));
        $registry->add(Screen::class, new Screen('Roles', 'backend.roles', Screen::ADMINISTRATION, 'shield', RolesHandler::PERMISSION, order: 110));
        $registry->add(Screen::class, new Screen('Design system', 'backend.design', Screen::ADMINISTRATION, 'palette', DesignHandler::PERMISSION, order: 900, development: true));
    }
}
