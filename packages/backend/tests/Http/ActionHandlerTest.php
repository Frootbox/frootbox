<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\ActionHandler;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(ActionHandler::class)]
final class ActionHandlerTest extends BackendTestCase
{
    public function testRunsAnActionWithTheSession(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $body = $this->action('user.create', ['name' => 'Erika', 'email' => 'erika@example.org', 'password' => 'a long password', 'roles' => ['editor']], $session);

        self::assertIsArray($body['data']);
        self::assertSame(['user', 'roles', 'hasPassword'], array_keys($body['data']));
        self::assertSame([['role' => 'editor', 'scope' => null]], $body['data']['roles']);
    }

    public function testErrorsAreGermanAndAtTheirField(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $body = $this->action('user.create', ['name' => '', 'email' => 'nope', 'password' => 'short'], $session, 422);

        self::assertSame('Prüf die markierten Felder.', $body['detail']);
        self::assertSame('invalid-input', $body['code']);
        self::assertSame([
            ['pointer' => '/email', 'message' => 'muss eine E-Mail-Adresse sein.'],
            ['pointer' => '/name', 'message' => 'ist ein Pflichtfeld.'],
            ['pointer' => '/password', 'message' => 'muss mindestens 10 Zeichen lang sein.'],
        ], $body['errors']);
    }

    public function testMessagesOfActionsAreTranslated(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $body = $this->action('role.delete', ['name' => 'admin'], $session, 422);
        self::assertSame('Die Rolle „admin“ lässt sich nicht löschen.', $body['detail']);
    }

    public function testRefusesWhatTheUserMayNotDo(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $response = $this->request('POST', '/cms/actions/user.create', session: $session, headers: [Csrf::HEADER => $this->csrfFor($session)], json: ['name' => 'Erika', 'email' => 'erika@example.org']);

        self::assertSame(403, $response->getStatusCode());
        self::assertSame('application/problem+json', $response->getHeaderLine('Content-Type'));
        self::assertSame('', $response->getHeaderLine('WWW-Authenticate'));
        self::assertStringContainsString('Dafür fehlt Dir das Recht „user.create“.', (string) $response->getBody());
    }

    public function testNeedsTheSessionAndItsToken(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');
        $input = ['name' => 'Erika', 'email' => 'erika@example.org'];

        self::assertSame(401, $this->request('POST', '/cms/actions/user.create', json: $input)->getStatusCode());
        self::assertSame(403, $this->request('POST', '/cms/actions/user.create', session: $session, json: $input)->getStatusCode());
        self::assertSame(403, $this->request('POST', '/cms/actions/user.create', session: $session, headers: [Csrf::HEADER => $this->csrfFor($session), 'Origin' => 'https://evil.example'], json: $input)->getStatusCode());
        self::assertSame(405, $this->request('GET', '/cms/actions/user.create', session: $session)->getStatusCode());
    }

    public function testOnlyActions(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $this->action('user.list', [], $session, 404);
        $this->action('acme/nothing.create', [], $session, 404);
    }

    public function testTakesAFormWithTheTokenAsField(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');
        $form = http_build_query(['name' => 'Erika', 'email' => 'erika@example.org', Csrf::FIELD => $this->csrfFor($session)]);

        $response = $this->request('POST', '/cms/actions/user.create', [Csrf::FIELD => $this->csrfFor($session)], $session, ['Content-Type' => 'application/x-www-form-urlencoded', 'Accept' => 'application/json'], raw: $form);

        self::assertSame(200, $response->getStatusCode(), (string) $response->getBody());
    }

    protected function config(): array
    {
        return ['backend' => ['language' => 'de']];
    }
}
