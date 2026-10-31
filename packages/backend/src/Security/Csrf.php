<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Security;

use Frootbox\Core\Auth\AuthenticationMiddleware;
use Frootbox\Core\Http\Exception\HttpException;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Protects forms and requests of the backend against cross-site request
 * forgery (decision 0112). The token is a hash of the session token, so
 * the server needs no secret of its own and can compute it again for
 * every request. Forms send it as the field "_csrf", htmx and fetch() as
 * the header X-CSRF-Token. Every writing request must also come from the
 * same host (Origin, else Sec-Fetch-Site).
 */
final readonly class Csrf
{
    public const string FIELD = '_csrf';

    public const string HEADER = 'X-CSRF-Token';

    private const string PREFIX = 'frootbox-csrf';

    /**
     * The token for the session of the request, null without a session.
     */
    public function token(ServerRequestInterface $request): ?string
    {
        $session = $request->getCookieParams()[AuthenticationMiddleware::COOKIE] ?? null;

        return \is_string($session) && '' !== $session ? hash_hmac('sha256', self::PREFIX, $session) : null;
    }

    /**
     * Refuses a request with 403 unless it comes from the same host and,
     * with a session, carries its token.
     */
    public function verify(ServerRequestInterface $request): void
    {
        $this->verifyOrigin($request);
        $expected = $this->token($request);

        if (null === $expected) {
            return;
        }

        $body = $request->getParsedBody();
        $sent = \is_array($body) && \is_string($body[self::FIELD] ?? null) ? $body[self::FIELD] : $request->getHeaderLine(self::HEADER);

        if (!hash_equals($expected, $sent)) {
            throw new HttpException(403, 'The form has expired. Load the page again and try once more.');
        }
    }

    /**
     * Refuses a request with 403 unless it comes from the same host. Enough
     * for the sign-in, which has no session yet.
     */
    public function verifyOrigin(ServerRequestInterface $request): void
    {
        if (!self::sameOrigin($request)) {
            throw new HttpException(403, 'The request comes from another website.');
        }
    }

    private static function sameOrigin(ServerRequestInterface $request): bool
    {
        $origin = $request->getHeaderLine('Origin');

        if ('' !== $origin && 'null' !== $origin) {
            $host = parse_url($origin, \PHP_URL_HOST);

            return \is_string($host) && 0 === strcasecmp($host, $request->getUri()->getHost());
        }

        // Browsers without Origin on this request send Sec-Fetch-Site; "none" is typed in by the user.
        return \in_array($request->getHeaderLine('Sec-Fetch-Site'), ['', 'same-origin', 'none'], true);
    }
}
