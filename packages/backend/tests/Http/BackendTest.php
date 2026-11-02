<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Http\DashboardHandler;
use Frootbox\Backend\Http\LoginHandler;
use Frootbox\Backend\Http\LogoutHandler;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\BackendView;
use Frootbox\Backend\View\Frame;
use Frootbox\Backend\View\Head;
use Frootbox\Backend\View\Menu;
use Frootbox\Core\Auth\AccessTokens;
use Frootbox\Core\Auth\TokenType;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(BackendExtension::class)]
#[CoversClass(LoginHandler::class)]
#[CoversClass(LogoutHandler::class)]
#[CoversClass(DashboardHandler::class)]
#[CoversClass(BackendView::class)]
#[CoversClass(SessionCookie::class)]
#[CoversClass(Csrf::class)]
#[CoversClass(Frame::class)]
#[CoversClass(Head::class)]
#[CoversClass(Menu::class)]
final class BackendTest extends BackendTestCase
{
    public function testGuestsGoToTheSignIn(): void
    {
        $dashboard = $this->request('GET', '/cms');
        self::assertSame(302, $dashboard->getStatusCode());
        self::assertSame('/cms/login', $dashboard->getHeaderLine('Location'));

        $design = $this->request('GET', '/cms/design?x=1');
        self::assertSame('/cms/login?next=%2Fcms%2Fdesign%3Fx%3D1', $design->getHeaderLine('Location'));

        $login = $this->request('GET', '/cms/login');
        $html = $this->html($login);
        self::assertSame(200, $login->getStatusCode());
        self::assertSame('no-store', $login->getHeaderLine('Cache-Control'));
        self::assertSame('SAMEORIGIN', $login->getHeaderLine('X-Frame-Options'));
        self::assertStringContainsString('<title>Sign in · Frootbox</title>', $html);
        self::assertStringContainsString('name="email"', $html);
        self::assertStringContainsString('autocomplete="current-password"', $html);
    }

    public function testSignsInAndShowsTheFrame(): void
    {
        $this->createUser('jane@example.org', ['editor']);

        $response = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD, 'next' => '/cms/design']);
        self::assertSame(303, $response->getStatusCode());
        self::assertSame('/cms/design', $response->getHeaderLine('Location'));
        self::assertMatchesRegularExpression('/^frootbox_session=[^;]+; Path=\/; HttpOnly; SameSite=Lax; Secure$/', $response->getHeaderLine('Set-Cookie'));

        $session = $this->signIn('jane@example.org');
        $html = $this->html($this->request('GET', '/cms', session: $session));

        self::assertStringContainsString('<html lang="en"', $html);
        self::assertStringContainsString('Hello, Jane', $html);
        self::assertStringContainsString('<script type="importmap">', $html);
        self::assertStringContainsString('"lit":"/assets/frootbox/backend/assets/build/lit.js?v=', $html);
        self::assertStringContainsString('@layer reset, tokens, base, components, screens, extensions;', $html);
        self::assertStringContainsString('--fb-accent:#8637ff;', $html);
        self::assertStringContainsString('<fb-theme-switch', $html);
        self::assertStringContainsString('aria-current="page"', $html);
        self::assertStringContainsString('name="_csrf" value="' . $this->csrfFor($session) . '"', $html);

        // Signed in, the sign-in leads on.
        self::assertSame('/cms', $this->request('GET', '/cms/login', session: $session)->getHeaderLine('Location'));
    }

    public function testRefusesWrongPasswordsAndOtherHosts(): void
    {
        $this->createUser('jane@example.org', ['editor']);

        $wrong = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => 'falsch']);
        self::assertSame(422, $wrong->getStatusCode());
        self::assertSame('', $wrong->getHeaderLine('Set-Cookie'));
        self::assertStringContainsString('value="jane@example.org"', $this->html($wrong), 'The email stays in the form.');

        $foreign = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD], headers: ['Origin' => 'https://evil.example']);
        self::assertSame(403, $foreign->getStatusCode());

        $away = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD, 'next' => '//evil.example/cms']);
        self::assertSame('/cms', $away->getHeaderLine('Location'), 'After signing in only paths in the backend.');
    }

    public function testSignsOutOnlyWithTheToken(): void
    {
        $this->createUser('jane@example.org', ['editor']);
        $session = $this->signIn('jane@example.org');

        self::assertSame(403, $this->request('POST', '/cms/logout', [], $session)->getStatusCode());
        self::assertSame(403, $this->request('POST', '/cms/logout', [Csrf::FIELD => 'wrong'], $session)->getStatusCode());
        self::assertSame(200, $this->request('GET', '/cms', session: $session)->getStatusCode(), 'The session is still valid.');

        $response = $this->request('POST', '/cms/logout', [Csrf::FIELD => $this->csrfFor($session)], $session);
        self::assertSame(303, $response->getStatusCode());
        self::assertSame('/cms/login?signed-out=1', $response->getHeaderLine('Location'));
        self::assertStringContainsString('Max-Age=0', $response->getHeaderLine('Set-Cookie'));
        self::assertSame(302, $this->request('GET', '/cms', session: $session)->getStatusCode(), 'The session has ended.');
    }

    public function testTheCookieTakesNoApiToken(): void
    {
        $user = $this->createUser('jane@example.org', ['editor']);
        $token = $this->get(AccessTokens::class)->issue($user, TokenType::Api)->token;

        self::assertSame(302, $this->request('GET', '/cms', session: $token)->getStatusCode());
    }
}
