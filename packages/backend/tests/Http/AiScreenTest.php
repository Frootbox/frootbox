<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use DateTimeImmutable;
use Frootbox\Backend\Http\Ai\AiHandler;
use Frootbox\Backend\Screen;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\Menu;
use Frootbox\Core\Action\Channel;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Ai\Provider;
use Frootbox\Core\Ai\Usage;
use Frootbox\Core\Ai\UsageLog;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\Tests\Fixtures\Ai\FakeAi;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(AiHandler::class)]
#[CoversClass(Menu::class)]
#[CoversClass(Screen::class)]
final class AiScreenTest extends BackendTestCase
{
    protected function setUp(): void
    {
        FakeAi::reset();
        parent::setUp();
    }

    public function testWithoutAProviderTheScreenIsNotInTheMenu(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $html = $this->html($this->request('GET', '/cms', session: $this->signIn('root@example.org')));

        self::assertStringContainsString('href="/cms/hub"', $html);
        self::assertStringNotContainsString('href="/cms/ai"', $html);
    }

    public function testShowsTheProviderTheCostsAndTheTest(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');
        $log = $this->get(UsageLog::class);
        $context = new Context(Actor::user(1, 'Jane Doe'), Channel::Web);
        $log->record($context, 'acme/fake-ai', 'field.rewrite', new Usage('fake-large', 1000, 200), 8_000, new DateTimeImmutable('first day of this month 10:00'));
        $log->record($context, 'acme/fake-ai', 'test', new Usage('fake-small', 10, 10), 6, new DateTimeImmutable('first day of this month 11:00'));

        $html = $this->html($this->request('GET', '/cms/ai', session: $session));

        self::assertStringContainsString('href="/cms/ai"', $html, 'In the menu with a provider.');
        self::assertStringContainsString('Fake Large', $html);
        self::assertStringContainsString('From the module', $html, 'Where the prices come from.');
        self::assertStringContainsString('<fb-form action="ai.test" show="ai-test-result" refresh="ai-usage">', $html);
        self::assertStringContainsString('$0.01', $html, '8,006 millionths of a dollar.');
        self::assertStringContainsString('Connection test', $html);
        self::assertStringContainsString('field.rewrite', $html);
        self::assertStringContainsString('less than $0.01', $html, 'The test alone.');
        self::assertStringContainsString('1,000 tokens in, 200 out', $html);

        $result = $this->action('ai.test', [], $session);
        self::assertIsArray($result['data'] ?? null);
        self::assertSame('Hallo Welt.', $result['data']['text'] ?? null);
    }

    public function testEditorsDoNotSeeIt(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        self::assertStringNotContainsString('href="/cms/ai"', $this->html($this->request('GET', '/cms', session: $session)));
        self::assertSame(403, $this->request('GET', '/cms/ai', session: $session)->getStatusCode());
    }

    public function testTheChartHasEveryDayUpToToday(): void
    {
        $days = AiHandler::days('2026-11', ['2026-11-02' => 3], new DateTimeImmutable('2026-11-03'));

        self::assertSame([['date' => '2026-11-01', 'calls' => 0], ['date' => '2026-11-02', 'calls' => 3], ['date' => '2026-11-03', 'calls' => 0]], $days);
        self::assertCount(31, AiHandler::days('2026-10', [], new DateTimeImmutable('2026-11-03')));
    }

    protected function register(Registry $registry): void
    {
        if ('testWithoutAProviderTheScreenIsNotInTheMenu' !== $this->name()) {
            $registry->forPackage('acme/fake-ai', static fn() => $registry->add(Provider::class, new Provider('acme/fake-ai', 'Fake', FakeAi::class)));
        }
    }
}
