<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\LoginHandler;
use Frootbox\Backend\Http\LogoutHandler;
use Frootbox\Backend\Http\OidcHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Auth\Oidc\OidcClient;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Hub\CompleteHub;
use Frootbox\Core\Hub\HubClient;
use Frootbox\Core\Hub\SwitchHub;
use Frootbox\Core\Security\Secrets;
use Frootbox\Core\Tests\Hub\FakeHub;
use Frootbox\Core\Tests\Hub\FakeOidcProvider;
use PHPUnit\Framework\Attributes\CoversClass;
use Psr\Http\Message\ResponseInterface;

#[CoversClass(OidcHandler::class)]
#[CoversClass(LoginHandler::class)]
#[CoversClass(LogoutHandler::class)]
final class OidcScreenTest extends BackendTestCase
{
    private FakeHub $hub;

    private FakeOidcProvider $oidc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hub = new FakeHub();
        $this->oidc = new FakeOidcProvider($this->hub);
        $this->container->set(HubClient::class, new HubClient($this->get(Config::class), $this->get(Secrets::class), $this->hub->client()));
        $this->container->set(OidcClient::class, $this->oidc->client());
        $this->runner()->run(new CompleteHub('K7Q2-M9XD'), Context::system());
        $this->runner()->run(new SwitchHub(login: true), Context::system());
    }

    public function testSignsInThroughTheHubFromTheButtonOnTheSignInPage(): void
    {
        $page = $this->html($this->request('GET', '/cms/login?next=/cms/pages'));
        self::assertStringContainsString('href="/cms/login/oidc/hub/start?next=%2Fcms%2Fpages"', $page);
        self::assertStringContainsString('Sign in with example.org', $page);
        self::assertStringContainsString('name="password"', $page, 'The password stays.');

        $session = $this->throughTheHub('/cms/login/oidc/hub/start?next=/cms/pages', '/cms/pages');

        $account = $this->html($this->request('GET', '/cms/account', session: $session));
        self::assertStringContainsString('Managed through example.org', $account);
        self::assertStringContainsString('through example.org', $account, 'The session shows its provider.');
    }

    public function testGoesBackSilentlyOnceAndNotAfterSigningOut(): void
    {
        $response = $this->request('GET', '/cms/login?next=/cms/media', cookies: [OidcHandler::PROVIDER_COOKIE => 'hub']);
        self::assertSame(302, $response->getStatusCode());
        self::assertSame('/cms/login/oidc/hub/start?prompt=none&next=%2Fcms%2Fmedia', $response->getHeaderLine('Location'));

        $start = $this->request('GET', $response->getHeaderLine('Location'));
        self::assertStringContainsString('prompt=none', $start->getHeaderLine('Location'));
        $cookies = self::cookies($start);

        // Not signed in at the hub any more: the sign-in page with the button first.
        $back = $this->request('GET', '/cms/login/oidc/hub?error=login_required&state=x', cookies: $cookies + [OidcHandler::PROVIDER_COOKIE => 'hub']);
        self::assertSame(302, $back->getStatusCode());
        self::assertSame('/cms/login?provider=hub&next=%2Fcms%2Fmedia', $back->getHeaderLine('Location'));
        $page = $this->html($this->request('GET', $back->getHeaderLine('Location'), cookies: [OidcHandler::PROVIDER_COOKIE => 'hub']));
        self::assertStringContainsString('Your session has ended. Sign in again with example.org.', $page, 'No loop.');

        $session = $this->throughTheHub('/cms/login/oidc/hub/start', '/cms');
        $out = $this->request('POST', '/cms/logout', ['_csrf' => $this->csrfFor($session)], session: $session);
        self::assertContains('fb_oidc=; Path=/cms; Max-Age=0; HttpOnly; SameSite=Lax', $out->getHeader('Set-Cookie'), 'Signing out forgets the provider.');
    }

    public function testRefusesAWayBackWithoutItsStateAndAStartFromAnotherIssuer(): void
    {
        $start = $this->request('GET', '/cms/login/oidc/hub/start');
        $back = $this->oidc->authorize($start->getHeaderLine('Location'));

        $response = $this->request('GET', '/cms/login/oidc/hub?code=' . $back['code'] . '&state=' . $back['state']);
        self::assertSame(422, $response->getStatusCode());
        self::assertStringContainsString('took too long or came from another window', $this->html($response));
        self::assertStringNotContainsString('frootbox_session=', $response->getHeaderLine('Set-Cookie'));

        self::assertSame(422, $this->request('GET', '/cms/login/oidc/hub/start?iss=https%3A%2F%2Fevil.example.org')->getStatusCode());
        self::assertSame(302, $this->request('GET', '/cms/login/oidc/hub/start?iss=' . rawurlencode(FakeHub::URL))->getStatusCode(), 'The hub starts it with its own issuer.');
        self::assertSame(422, $this->request('GET', '/cms/login/oidc/other/start')->getStatusCode());
    }

    public function testTheSuperuserLinksTheOwnAccountOnTheConnection(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $session = $this->signIn('root@example.org');

        $page = $this->html($this->request('GET', '/cms/hub', session: $session));
        self::assertStringContainsString('<fb-form action="system.hub-switch" refresh="hub"', $page);
        self::assertStringContainsString('name="maxRole"', $page);
        self::assertStringContainsString('Link your account once', $page);

        $this->oidc->person['email'] = 'root@example.org';
        $start = $this->request('POST', '/cms/login/oidc/hub/link', ['_csrf' => $this->csrfFor($session), 'next' => '/cms/hub'], session: $session);
        self::assertSame(303, $start->getStatusCode(), (string) $start->getBody());
        self::assertStringContainsString('prompt=login', $start->getHeaderLine('Location'));
        $back = $this->oidc->authorize($start->getHeaderLine('Location'));

        $done = $this->request('GET', '/cms/login/oidc/hub?code=' . $back['code'] . '&state=' . $back['state'], session: $session, cookies: self::cookies($start));
        self::assertSame(303, $done->getStatusCode(), (string) $done->getBody());
        self::assertSame('/cms/hub', $done->getHeaderLine('Location'));
        self::assertStringContainsString('Your account is linked with example.org.', $this->html($this->request('GET', '/cms/hub', session: $session)));

        self::assertSame(403, $this->request('POST', '/cms/login/oidc/hub/link', ['_csrf' => 'falsch'], session: $session)->getStatusCode());
    }

    protected function config(): array
    {
        return ['app' => ['name' => 'Bohnenglück', 'url' => 'https://www.bohnenglueck.de'], 'hub' => ['url' => FakeHub::URL]];
    }

    /**
     * Start, the hub, the way back; returns the session.
     */
    private function throughTheHub(string $start, string $next): string
    {
        $response = $this->request('GET', $start);
        self::assertSame(302, $response->getStatusCode(), (string) $response->getBody());
        self::assertStringStartsWith(FakeHub::URL . '/oidc/authorize?', $response->getHeaderLine('Location'));
        self::assertContains('Path=/cms/login/oidc/hub', array_map(static fn(string $line): string => explode('; ', $line)[1] ?? '', $response->getHeader('Set-Cookie')));
        $back = $this->oidc->authorize($response->getHeaderLine('Location'));

        $done = $this->request('GET', '/cms/login/oidc/hub?code=' . $back['code'] . '&state=' . $back['state'], cookies: self::cookies($response));
        self::assertSame(303, $done->getStatusCode(), (string) $done->getBody());
        self::assertSame($next, $done->getHeaderLine('Location'));
        $cookies = self::cookies($done);
        self::assertSame('hub', $cookies[OidcHandler::PROVIDER_COOKIE] ?? null);
        self::assertSame('', $cookies[OidcHandler::STATE_COOKIE] ?? null, 'The state is gone.');
        self::assertArrayHasKey('frootbox_session', $cookies);

        return $cookies['frootbox_session'];
    }

    /**
     * @return array<string, string>
     */
    private static function cookies(ResponseInterface $response): array
    {
        $cookies = [];

        foreach ($response->getHeader('Set-Cookie') as $line) {
            [$name, $value] = explode('=', explode(';', $line, 2)[0], 2) + [1 => ''];
            $cookies[$name] = rawurldecode($value);
        }

        return $cookies;
    }
}
