<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend;

use Frootbox\Backend\Http\Access\AccessHandler;
use Frootbox\Backend\Http\AccountHandler;
use Frootbox\Backend\Http\ActionHandler;
use Frootbox\Backend\Http\BackendErrorPage;
use Frootbox\Backend\Http\Comments\CommentsHandler;
use Frootbox\Backend\Http\DashboardHandler;
use Frootbox\Backend\Http\DesignHandler;
use Frootbox\Backend\Http\EditModeHandler;
use Frootbox\Backend\Http\Help\HelpHandler;
use Frootbox\Backend\Http\Jobs\JobsHandler;
use Frootbox\Backend\Http\LoginHandler;
use Frootbox\Backend\Http\LogoutHandler;
use Frootbox\Backend\Http\Media\MediaHandler;
use Frootbox\Backend\Http\Media\UploadHandler;
use Frootbox\Backend\Http\Navigations\NavigationsHandler;
use Frootbox\Backend\Http\Pages\NewPageHandler;
use Frootbox\Backend\Http\Pages\PagesHandler;
use Frootbox\Backend\Http\PreviewActionHandler;
use Frootbox\Backend\Http\QueryHandler;
use Frootbox\Backend\Http\Redirects\RedirectsHandler;
use Frootbox\Backend\Http\Search\SearchHandler;
use Frootbox\Backend\Http\Settings\SettingsHandler;
use Frootbox\Backend\Http\Theme\ThemeHandler;
use Frootbox\Backend\Http\Users\RoleHandler;
use Frootbox\Backend\Http\Users\RolesHandler;
use Frootbox\Backend\Http\Users\UserHandler;
use Frootbox\Backend\Http\Users\UsersHandler;
use Frootbox\Backend\View\EditorBar;
use Frootbox\Backend\View\PreviewNote;
use Frootbox\Core\Api\ApiHandler;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\View\BuildingHead;

/**
 * The backend below backend.path, default /cms (decisions 0110 to 0114).
 * It is only a user interface: what its screens read or change are
 * queries and actions of the core and the modules.
 */
final class BackendExtension implements Extension
{
    public const string ROOT = __DIR__ . '/..';

    /** An id of a page or another record, e.g. in /cms/pages/{id} */
    private const string ULID = '[0-7][0-9A-HJKMNP-TV-Z]{25}';

    public function register(Registry $registry): void
    {
        // Errors below backend.path show inside the backend (decision 0132).
        $registry->errorPage(BackendErrorPage::class);

        $registry->mount('backend.path', '/cms')
            ->get('/', DashboardHandler::class, 'backend.dashboard')
            ->route(['GET', 'POST'], '/login', LoginHandler::class, 'backend.login')
            ->post('/logout', LogoutHandler::class, 'backend.logout')
            ->post('/actions/' . ApiHandler::NAME, ActionHandler::class, 'backend.action')
            ->get('/queries/' . ApiHandler::NAME, QueryHandler::class, 'backend.query')
            // For the note of a preview, e.g. comments (decision 0156).
            ->post('/preview/actions/' . ApiHandler::NAME, PreviewActionHandler::class, 'backend.preview.action')
            ->get('/preview/queries/' . ApiHandler::NAME, PreviewActionHandler::class, 'backend.preview.query')
            ->post('/edit-mode', EditModeHandler::class, 'backend.edit-mode')
            ->get('/design', DesignHandler::class, 'backend.design')
            ->get('/account', AccountHandler::class, 'backend.account')
            ->get('/search', SearchHandler::class, 'backend.search')
            ->get('/help', HelpHandler::class, 'backend.help')
            ->get('/help/{id:[a-z0-9][a-z0-9/-]*}', HelpHandler::class, 'backend.help.show')
            ->get('/pages', PagesHandler::class, 'backend.pages')
            ->get('/pages/new', NewPageHandler::class, 'backend.pages.new')
            ->get('/pages/{id:' . self::ULID . '}', PagesHandler::class, 'backend.pages.show')
            ->get('/navigations', NavigationsHandler::class, 'backend.navigations')
            ->get('/navigations/{name:[a-z][a-z0-9-]{0,63}}', NavigationsHandler::class, 'backend.navigations.show')
            ->get('/media', MediaHandler::class, 'backend.media')
            ->get('/media/{id:' . self::ULID . '}', MediaHandler::class, 'backend.media.show')
            ->post('/uploads', UploadHandler::class, 'backend.uploads')
            ->get('/redirects', RedirectsHandler::class, 'backend.redirects')
            ->get('/access', AccessHandler::class, 'backend.access')
            ->get('/comments', CommentsHandler::class, 'backend.comments')
            ->get('/theme', ThemeHandler::class, 'backend.theme')
            ->get('/users', UsersHandler::class, 'backend.users')
            ->get('/users/new', UserHandler::class, 'backend.users.new')
            ->get('/users/{id:\d+}', UserHandler::class, 'backend.users.show')
            ->get('/roles', RolesHandler::class, 'backend.roles')
            ->get('/roles/new', RoleHandler::class, 'backend.roles.new')
            ->get('/roles/{name:[a-z][a-z0-9-]*}', RoleHandler::class, 'backend.roles.show')
            ->get('/settings', SettingsHandler::class, 'backend.settings')
            ->get('/jobs', JobsHandler::class, 'backend.jobs');

        $registry->listen(BuildingHead::class, EditorBar::class);
        $registry->listen(BuildingHead::class, PreviewNote::class);

        $registry->import('lit', 'assets/build/lit.js');
        $registry->import('htmx.org', 'assets/build/htmx.js');
        $registry->import('@frootbox/ui', 'assets/build/ui.js');

        $registry->add(Screen::class, new Screen('Dashboard', 'backend.dashboard', Screen::CONTENT, 'dashboard', order: 0));
        $registry->add(Screen::class, new Screen('Pages', 'backend.pages', Screen::CONTENT, 'pages', PagesHandler::PERMISSION, order: 10));
        $registry->add(Screen::class, new Screen('Media', 'backend.media', Screen::CONTENT, 'image', MediaHandler::PERMISSION, order: 20));
        $registry->add(Screen::class, new Screen('Comments', 'backend.comments', Screen::CONTENT, 'comment', CommentsHandler::PERMISSION, order: 30, count: 'comment.count'));
        $registry->add(Screen::class, new Screen('Design', 'backend.theme', Screen::WEBSITE, 'palette', ThemeHandler::PERMISSION, order: 10));
        $registry->add(Screen::class, new Screen('Navigations', 'backend.navigations', Screen::WEBSITE, 'navigation', NavigationsHandler::PERMISSION, order: 20));
        $registry->add(Screen::class, new Screen('Redirects', 'backend.redirects', Screen::WEBSITE, 'redirect', RedirectsHandler::PERMISSION, order: 30));
        $registry->add(Screen::class, new Screen('Access', 'backend.access', Screen::WEBSITE, 'lock', AccessHandler::PERMISSION, order: 40));
        $registry->add(Screen::class, new Screen('Users', 'backend.users', Screen::ADMINISTRATION, 'users', UsersHandler::PERMISSION, order: 100));
        $registry->add(Screen::class, new Screen('Roles', 'backend.roles', Screen::ADMINISTRATION, 'shield', RolesHandler::PERMISSION, order: 110));
        $registry->add(Screen::class, new Screen('Settings', 'backend.settings', Screen::ADMINISTRATION, 'settings', SettingsHandler::PERMISSION, order: 120));
        $registry->add(Screen::class, new Screen('Jobs', 'backend.jobs', Screen::ADMINISTRATION, 'clock', JobsHandler::PERMISSION, order: 130));
        $registry->add(Screen::class, new Screen('Design system', 'backend.design', Screen::ADMINISTRATION, 'palette', DesignHandler::PERMISSION, order: 900, development: true));

        // Where hits of the search open, and what it offers to do (decision 0217).
        $registry->add(SearchLink::class, new SearchLink('page', 'backend.pages.show', 'id', 'pages'));
        $registry->add(SearchLink::class, new SearchLink('medium', 'backend.media.show', 'id', 'image'));
        $registry->add(SearchLink::class, new SearchLink('navigation', 'backend.navigations.show', 'name', 'navigation'));
        $registry->add(SearchLink::class, new SearchLink('site', 'backend.theme', null, 'palette'));
        $registry->add(SearchLink::class, new SearchLink('redirect', 'backend.redirects', null, 'redirect'));
        $registry->add(SearchLink::class, new SearchLink('user', 'backend.users.show', 'id', 'users'));
        $registry->add(SearchLink::class, new SearchLink('role', 'backend.roles.show', 'name', 'shield'));
        $registry->add(SearchLink::class, new SearchLink('help', 'backend.help.show', 'id', 'info'));
        $registry->add(SearchCommand::class, new SearchCommand('New page', 'backend.pages.new', 'page.create'));
        $registry->add(SearchCommand::class, new SearchCommand('Upload files', 'backend.media', 'media.create'));
        $registry->add(SearchCommand::class, new SearchCommand('New user', 'backend.users.new', 'user.create'));
        $registry->add(SearchCommand::class, new SearchCommand('New role', 'backend.roles.new', 'role.create'));
    }
}
