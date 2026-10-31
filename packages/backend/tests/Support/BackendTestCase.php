<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Support;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Auth\AuthenticationMiddleware;
use Frootbox\Core\Error\ErrorMiddleware;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Http\MiddlewareDispatcher;
use Frootbox\Core\Page\PageHandler;
use Frootbox\Core\Routing\RoutingMiddleware;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Frootbox\Core\User\CreateUser;
use Nyholm\Psr7\ServerRequest;
use Psr\Http\Message\ResponseInterface;

/**
 * An installation with the backend that answers requests like
 * Application::handle(): errors, authentication, routing, pages.
 */
abstract class BackendTestCase extends NotesTestCase
{
    protected const string PASSWORD = 'kaffeebohne42';

    protected const string HOST = 'https://example.org';

    protected function setUp(): void
    {
        parent::setUp();
        $this->get(CurrentContext::class)->set(Context::guest());
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend()], 'backend-tests');
    }

    protected static function backend(): ExtensionPackage
    {
        return ExtensionPackage::fromManifest('frootbox/backend', (string) realpath(BackendExtension::ROOT));
    }

    /**
     * @param list<string> $roles
     */
    protected function createUser(string $email, array $roles): int
    {
        return $this->runner()->run(new CreateUser($email, 'Jane Doe', self::PASSWORD, $roles), Context::system())->user->id;
    }

    /**
     * Signs in through the form and returns the session token.
     */
    protected function signIn(string $email): string
    {
        $response = $this->request('POST', '/cms/login', ['email' => $email, 'password' => self::PASSWORD]);
        self::assertSame(303, $response->getStatusCode(), (string) $response->getBody());
        self::assertSame(1, preg_match('/^frootbox_session=([^;]+);/', $response->getHeaderLine('Set-Cookie'), $match));

        return rawurldecode($match[1]);
    }

    /**
     * A request as a browser sends it: same origin unless headers say else.
     *
     * @param array<string, string>|null $body    form fields of a POST
     * @param array<string, string>      $headers
     * @param array<string, mixed>|null  $json    a JSON body, as <fb-form> sends it
     * @param string|null                $raw     the body as it is, e.g. an encoded form
     * @param array<string, string>      $cookies more cookies, e.g. of the editing mode
     */
    protected function request(string $method, string $path, ?array $body = null, ?string $session = null, array $headers = [], ?array $json = null, string $address = '192.0.2.1', ?string $raw = null, array $cookies = []): ResponseInterface
    {
        if (null !== $json) {
            $headers += ['Content-Type' => 'application/json', 'Accept' => 'application/json'];
        }

        $request = new ServerRequest($method, self::HOST . $path, ['Sec-Fetch-Site' => 'same-origin', ...$headers], null === $json ? $raw : json_encode($json, \JSON_THROW_ON_ERROR), '1.1', ['REMOTE_ADDR' => $address]);
        parse_str((string) parse_url($path, \PHP_URL_QUERY), $query);
        $request = $request->withQueryParams($query);

        if (null !== $body) {
            $request = $request->withParsedBody($body);
        }

        if (null !== $session) {
            $cookies[AuthenticationMiddleware::COOKIE] = $session;
        }

        $request = $request->withCookieParams($cookies);

        // Every request starts as a guest, like a new PHP process.
        $this->get(CurrentContext::class)->set(Context::guest());

        $middleware = [$this->get(ErrorMiddleware::class), $this->get(AuthenticationMiddleware::class), $this->get(RoutingMiddleware::class)];

        return new MiddlewareDispatcher($middleware, $this->get(PageHandler::class))->handle($request);
    }

    protected function csrfFor(string $session): string
    {
        $token = new Csrf()->token(new ServerRequest('GET', '/')->withCookieParams([AuthenticationMiddleware::COOKIE => $session]));
        self::assertNotNull($token);

        return $token;
    }

    protected function html(ResponseInterface $response): string
    {
        return (string) $response->getBody();
    }

    /**
     * Runs an action like <fb-form>: JSON with the CSRF token in the header.
     *
     * @param array<string, mixed> $input
     *
     * @return array<mixed> the decoded answer
     */
    protected function action(string $name, array $input, string $session, int $status = 200): array
    {
        $response = $this->request('POST', '/cms/actions/' . $name, session: $session, headers: [Csrf::HEADER => $this->csrfFor($session)], json: $input);
        self::assertSame($status, $response->getStatusCode(), (string) $response->getBody());
        $body = json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($body);

        return $body;
    }
}
