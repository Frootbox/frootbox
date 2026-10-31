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
 * in too. It ends with the browser, with "stay signed in" it lasts long
 * (decision 0115). Either way the session itself expires on the server.
 */
final readonly class SessionCookie
{
    /** 400 days, the most browsers keep a cookie. */
    public const int REMEMBER = 400 * 86400;

    public function set(ResponseInterface $response, ServerRequestInterface $request, string $token, bool $remember = false): ResponseInterface
    {
        return $response->withAddedHeader('Set-Cookie', $remember ? self::cookie($request, $token, 'Max-Age=' . self::REMEMBER) : self::cookie($request, $token));
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
