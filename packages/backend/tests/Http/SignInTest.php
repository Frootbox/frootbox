<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\LoginHandler;
use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(LoginHandler::class)]
#[CoversClass(SessionCookie::class)]
final class SignInTest extends BackendTestCase
{
    public function testStaySignedInKeepsTheCookie(): void
    {
        $this->createUser('jane@example.org', ['editor']);

        $short = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD]);
        self::assertStringNotContainsString('Max-Age', $short->getHeaderLine('Set-Cookie'), 'Ends with the browser.');

        $long = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD, 'remember' => '1']);
        self::assertSame(303, $long->getStatusCode());
        self::assertStringContainsString('; Max-Age=' . SessionCookie::REMEMBER, $long->getHeaderLine('Set-Cookie'));

        $form = $this->html($this->request('GET', '/cms/login'));
        self::assertStringContainsString('name="remember" value="1"', $form);
        self::assertStringContainsString('Angemeldet bleiben', $form);
    }

    public function testTooManyFailuresWait(): void
    {
        $this->createUser('jane@example.org', ['editor']);

        for ($i = 0; $i < 5; ++$i) {
            self::assertSame(422, $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => 'falsch'])->getStatusCode());
        }

        $response = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD, 'remember' => '1']);

        self::assertSame(429, $response->getStatusCode());
        self::assertSame('60', $response->getHeaderLine('Retry-After'));
        self::assertSame('', $response->getHeaderLine('Set-Cookie'), 'Even the right password waits.');
        self::assertStringContainsString('Zu viele Fehlversuche. Versuch es in einer Minute noch einmal.', $this->html($response));
        self::assertMatchesRegularExpression('/name="remember" value="1" checked/', $this->html($response), 'The choice stays.');

        $other = $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD], address: '198.51.100.9');
        self::assertSame(429, $other->getStatusCode(), 'The account waits on every address.');
    }

    protected function config(): array
    {
        return ['backend' => ['language' => 'de']];
    }
}
