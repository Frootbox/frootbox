<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\QueryHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(QueryHandler::class)]
final class QueryHandlerTest extends BackendTestCase
{
    public function testRunsAQueryWithTheSession(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $response = $this->request('GET', '/cms/queries/user.list', session: $session);

        self::assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $body = json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($body);
        self::assertIsArray($body['data']);
        self::assertCount(1, $body['data']);
    }

    public function testRefusesWhatTheUserMayNotSee(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $response = $this->request('GET', '/cms/queries/user.list', session: $session);

        self::assertSame(403, $response->getStatusCode());
        self::assertSame('application/problem+json', $response->getHeaderLine('Content-Type'));
        self::assertStringContainsString('Dafür fehlt Dir das Recht „user.list“.', (string) $response->getBody());
    }

    public function testOnlyQueriesAndOnlyWithASession(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        self::assertSame(401, $this->request('GET', '/cms/queries/user.list')->getStatusCode());
        self::assertSame(404, $this->request('GET', '/cms/queries/user.create', session: $session)->getStatusCode());
        self::assertSame(404, $this->request('GET', '/cms/queries/acme/nothing.list', session: $session)->getStatusCode());
        self::assertSame(405, $this->request('POST', '/cms/queries/user.list', session: $session)->getStatusCode());
    }

    protected function config(): array
    {
        return ['backend' => ['language' => 'de']];
    }
}
