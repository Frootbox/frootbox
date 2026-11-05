<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Hub\HubHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Hub\CompleteHub;
use Frootbox\Core\Hub\ConnectHub;
use Frootbox\Core\Hub\HubClient;
use Frootbox\Core\Security\Secrets;
use Frootbox\Core\Tests\Hub\FakeHub;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(HubHandler::class)]
final class HubScreenTest extends BackendTestCase
{
    private FakeHub $hub;

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hub = new FakeHub();
        $this->container->set(HubClient::class, new HubClient($this->get(Config::class), $this->get(Secrets::class), $this->hub->client()));
        $this->createUser('root@example.org', ['superuser']);
        $this->session = $this->signIn('root@example.org');
    }

    public function testOffersToConnectAndShowsWhatTheHubWouldSee(): void
    {
        $html = $this->html($this->request('GET', '/cms/hub', session: $this->session));

        self::assertStringContainsString('<fb-form action="system.hub-connect" next="' . FakeHub::URL . '/connect/{id}">', $html);
        self::assertStringContainsString('<input type="hidden" name="return" value="https://www.bohnenglueck.de/cms/hub">', $html);
        self::assertStringContainsString('Connect with example.org', $html);
        self::assertStringContainsString('<code>schema</code>', $html, 'What the hub would read, before connecting.');
        self::assertStringContainsString('<code>extensions</code>', $html);
    }

    public function testCompletesWithTheCodeTheBrowserBringsBack(): void
    {
        $request = $this->runner()->run(new ConnectHub(return: 'https://www.bohnenglueck.de/cms/hub'), Context::system());
        self::assertSame('https://www.bohnenglueck.de/cms/hub', $this->hub->last('POST', '/connect/v1/requests')['return']);

        $waiting = $this->html($this->request('GET', '/cms/hub', session: $this->session));
        self::assertStringContainsString('Waiting for confirmation', $waiting);
        self::assertStringContainsString('href="' . $request->url . '"', $waiting);
        self::assertStringNotContainsString('system.hub-complete', $waiting);

        self::assertStringNotContainsString('system.hub-complete', $this->html($this->request('GET', '/cms/hub?request=req_another0000&code=ABCD-1234', session: $this->session)), 'Only for the open request.');

        $back = $this->html($this->request('GET', '/cms/hub?request=' . $request->id . '&code=ABCD-1234', session: $this->session));
        self::assertStringContainsString('<fb-form action="system.hub-complete" next="/cms/hub"', $back);
        self::assertStringContainsString('<input type="hidden" name="code" value="ABCD-1234">', $back);

        $this->action('system.hub-complete', ['code' => 'ABCD-1234', 'request' => $request->id], $this->session);
        $connected = $this->html($this->request('GET', '/cms/hub', session: $this->session));
        self::assertStringContainsString('Herr und Frau Pixel', $connected);
        self::assertStringContainsString('<fb-form action="system.hub-switch"', $connected);
        self::assertStringContainsString('https://www.bohnenglueck.de/api/v1/status.show', $connected);
        self::assertStringContainsString('id="hub-disconnect"', $connected);
    }

    public function testWithTheStatusOffTheHubSeesOnlyTheConnection(): void
    {
        $this->runner()->run(new CompleteHub('K7Q2-M9XD', status: false), Context::system());

        $html = $this->html($this->request('GET', '/cms/hub', session: $this->session));
        self::assertStringContainsString('sees nothing but the connection', $html);
        self::assertStringNotContainsString('<code>schema</code>', $html);
    }

    public function testOnlySuperusersSeeIt(): void
    {
        $this->createUser('admin@example.org', ['admin']);

        self::assertSame(403, $this->request('GET', '/cms/hub', session: $this->signIn('admin@example.org'))->getStatusCode());
    }

    protected function config(): array
    {
        return ['app' => ['name' => 'Bohnenglück', 'url' => 'https://www.bohnenglueck.de'], 'hub' => ['url' => FakeHub::URL]];
    }
}
