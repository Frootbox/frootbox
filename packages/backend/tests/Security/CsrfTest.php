<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Security;

use Frootbox\Backend\Security\Csrf;
use Frootbox\Core\Http\Exception\HttpException;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

#[CoversClass(Csrf::class)]
final class CsrfTest extends TestCase
{
    public function testTheTokenBelongsToTheSession(): void
    {
        $csrf = new Csrf();

        self::assertNull($csrf->token(self::request()));
        self::assertSame(hash_hmac('sha256', 'frootbox-csrf', 'fbs_one'), $csrf->token(self::request(session: 'fbs_one')));
        self::assertNotSame($csrf->token(self::request(session: 'fbs_one')), $csrf->token(self::request(session: 'fbs_two')));
    }

    public function testAcceptsTheTokenAsFieldOrHeader(): void
    {
        $csrf = new Csrf();
        $token = (string) $csrf->token(self::request(session: 'fbs_one'));

        $csrf->verify(self::request(session: 'fbs_one', body: [Csrf::FIELD => $token]));
        $csrf->verify(self::request(session: 'fbs_one', headers: [Csrf::HEADER => $token]));
        // Without a session there is nothing to steal, only the origin counts.
        $csrf->verify(self::request());
        $this->addToAssertionCount(3);
    }

    public function testRefusesAMissingOrWrongToken(): void
    {
        $this->assertRefused(self::request(session: 'fbs_one'), 'The form has expired.');
        $this->assertRefused(self::request(session: 'fbs_one', body: [Csrf::FIELD => 'wrong']), 'The form has expired.');
    }

    public function testRefusesOtherOrigins(): void
    {
        $csrf = new Csrf();
        $csrf->verifyOrigin(self::request(headers: ['Origin' => 'https://EXAMPLE.org']));
        $csrf->verifyOrigin(self::request(headers: ['Sec-Fetch-Site' => 'none']));
        $csrf->verifyOrigin(self::request());
        $this->addToAssertionCount(3);

        $this->assertRefused(self::request(headers: ['Origin' => 'https://evil.example']), 'another website');
        $this->assertRefused(self::request(headers: ['Sec-Fetch-Site' => 'cross-site']), 'another website');
        $this->assertRefused(self::request(headers: ['Origin' => 'null', 'Sec-Fetch-Site' => 'same-site']), 'another website');
    }

    private function assertRefused(ServerRequestInterface $request, string $message): void
    {
        try {
            new Csrf()->verify($request);
            self::fail('The request was accepted.');
        } catch (HttpException $error) {
            self::assertSame(403, $error->status);
            self::assertStringContainsString($message, $error->getMessage());
        }
    }

    /**
     * @param array<string, string>|null $body
     * @param array<string, string>      $headers
     */
    private static function request(?string $session = null, ?array $body = null, array $headers = []): ServerRequestInterface
    {
        $request = new ServerRequest('POST', 'https://example.org/cms/logout', $headers);
        $request = null === $body ? $request : $request->withParsedBody($body);

        return null === $session ? $request : $request->withCookieParams(['frootbox_session' => $session]);
    }
}
