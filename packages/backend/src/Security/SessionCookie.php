<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Security;

use Frootbox\Core\Auth\AuthenticationMiddleware;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * The cookie of a browser session (decision 0112): HttpOnly, SameSite=Lax,
 * Secure under HTTPS, for the whole website, so the edit mode is signed
 * in too. It ends with the browser; the session itself expires on the
 * server.
 */
final readonly class SessionCookie
{
    public function set(ResponseInterface $response, ServerRequestInterface $request, string $token): ResponseInterface
    {
        return $response->withAddedHeader('Set-Cookie', self::cookie($request, $token));
    }

    public function clear(ResponseInterface $response, ServerRequestInterface $request): ResponseInterface
    {
        return $response->withAddedHeader('Set-Cookie', self::cookie($request, '', 'Max-Age=0'));
    }

    private static function cookie(ServerRequestInterface $request, string $value, string ...$extra): string
    {
        $parts = [AuthenticationMiddleware::COOKIE . '=' . rawurlencode($value), 'Path=/', 'HttpOnly', 'SameSite=Lax', ...$extra];

        if ('https' === $request->getUri()->getScheme()) {
            $parts[] = 'Secure';
        }

        return implode('; ', $parts);
    }
}
