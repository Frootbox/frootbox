<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\AccountHandler;
use Frootbox\Backend\Http\Users\RoleHandler;
use Frootbox\Backend\Http\Users\RolesHandler;
use Frootbox\Backend\Http\Users\RoleTitles;
use Frootbox\Backend\Http\Users\UserHandler;
use Frootbox\Backend\Http\Users\UsersHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\Device;
use Frootbox\Backend\View\TwigExtension;
use Frootbox\Core\Action\Context;
use Frootbox\Core\User\CreateRole;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(AccountHandler::class)]
#[CoversClass(UsersHandler::class)]
#[CoversClass(UserHandler::class)]
#[CoversClass(RolesHandler::class)]
#[CoversClass(RoleHandler::class)]
#[CoversClass(RoleTitles::class)]
#[CoversClass(TwigExtension::class)]
#[CoversClass(Device::class)]
final class ScreensTest extends BackendTestCase
{
    public function testAdminsManageUsersAndRoles(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $editor = $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('admin@example.org');

        $list = $this->html($this->request('GET', '/cms/users', session: $session));
        self::assertStringContainsString('href="/cms/users/new"', $list);
        self::assertStringContainsString('href="/cms/users/' . $editor . '"', $list);
        self::assertStringContainsString('href="/cms/roles"', $list, 'The menu leads to the roles.');

        $new = $this->html($this->request('GET', '/cms/users/new', session: $session));
        self::assertStringContainsString('<fb-form action="user.create" next="/cms/users/{user.id}"', $new);
        self::assertStringContainsString('data-fb-generate="field-password"', $new);
        self::assertStringContainsString('<meta name="fb-actions" content="/cms/actions/">', $new);

        $edit = $this->html($this->request('GET', '/cms/users/' . $editor, session: $session));
        self::assertStringContainsString('<fb-form action="user.set-roles"', $edit);
        self::assertMatchesRegularExpression('/name="roles\[\]" value="editor" checked/', $edit);
        self::assertStringContainsString('commandfor="fb-delete-user" command="show-modal"', $edit);

        $roles = $this->html($this->request('GET', '/cms/roles', session: $session));
        self::assertStringContainsString('href="/cms/roles/editor"', $roles);
        self::assertStringContainsString('href="/cms/roles/new"', $roles);

        $role = $this->html($this->request('GET', '/cms/roles/editor', session: $session));
        self::assertStringContainsString('<fb-form action="role.update"', $role);
        self::assertStringContainsString("page.*\nmedia.*", $role);
        self::assertStringContainsString('<code class="fb-list__title">user.set-roles</code>', $role, 'Every permission to look up.');
        self::assertStringContainsString('commandfor="fb-delete-role" command="show-modal"', $role);

        self::assertStringNotContainsString('command="show-modal"', $this->html($this->request('GET', '/cms/roles/admin', session: $session)), 'The admin role stays.');
        self::assertSame(404, $this->request('GET', '/cms/roles/nothing', session: $session)->getStatusCode());
        self::assertSame(200, $this->request('GET', '/cms/roles/new', session: $session)->getStatusCode());
    }

    public function testNobodyDeletesThemselves(): void
    {
        $admin = $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');
        $html = $this->html($this->request('GET', '/cms/users/' . $admin, session: $session));

        self::assertStringNotContainsString('fb-delete-user', $html);
        self::assertStringContainsString('<input type="hidden" name="active" value="1" data-type="boolean">', $html);
    }

    public function testShowsOnlyWhatTheUserMayDo(): void
    {
        $this->runner()->run(new CreateRole('viewer', 'Viewer', ['user.list', 'user.show', 'role.list']), Context::system());
        $this->createUser('viewer@example.org', ['viewer']);
        $other = $this->createUser('other@example.org', ['editor']);
        $session = $this->signIn('viewer@example.org');

        $list = $this->html($this->request('GET', '/cms/users', session: $session));
        self::assertStringNotContainsString('/cms/users/new', $list);

        $edit = $this->html($this->request('GET', '/cms/users/' . $other, session: $session));
        self::assertStringNotContainsString('<fb-form action="user.set-roles"', $edit);
        self::assertStringNotContainsString('user.set-password', $edit);
        self::assertStringNotContainsString('fb-delete-user', $edit);
        self::assertStringContainsString('disabled', $edit);
    }

    public function testEditorsSeeNeitherUsersNorRoles(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        self::assertStringNotContainsString('href="/cms/users"', $this->html($this->request('GET', '/cms', session: $session)));
        self::assertSame(403, $this->request('GET', '/cms/users', session: $session)->getStatusCode());
        self::assertSame(403, $this->request('GET', '/cms/roles/editor', session: $session)->getStatusCode());
        self::assertSame(302, $this->request('GET', '/cms/users')->getStatusCode(), 'Guests go to the sign-in.');
    }

    public function testTheAccountShowsSessionsAndTokens(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $first = $this->signIn('editor@example.org');
        $session = $this->signIn('editor@example.org');
        unset($first);

        $html = $this->html($this->request('GET', '/cms/account', session: $session));

        self::assertStringContainsString('<fb-form action="account.change-password" reset', $html);
        self::assertStringContainsString('<fb-form action="account.create-token" show="fb-new-token"', $html);
        self::assertSame(1, substr_count($html, 'This device'), 'The own session is marked.');
        self::assertSame(1, substr_count($html, '<fb-form action="account.revoke-token"'), 'Only the other session can be ended here.');
        self::assertStringContainsString('href="/cms/account"', $html, 'The name in the sidebar leads here.');
    }

    public function testNamesTheDevice(): void
    {
        self::assertSame('Chrome · macOS', Device::describe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'));
        self::assertSame('Safari · iPhone', Device::describe('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'));
        self::assertSame('Edge · Windows', Device::describe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'));
        self::assertSame('Firefox · Linux', Device::describe('Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0'));
        self::assertNull(Device::describe('curl/8.0'));
        self::assertNull(Device::describe(null));
    }
}
