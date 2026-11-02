<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Page\EditMode;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Switches the editing mode on the website on or off (decision 0119):
 * "on" is 1 or 0, "next" an optional path on this host to go to. It is a
 * setting of the view, not a change of data, so it is no action. The
 * cookie counts only for users who may see pages.
 */
final readonly class EditModeHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Csrf $csrf,
        private ResponseFactoryInterface $responses,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $this->csrf->verify($request);

        if (null === $this->view->user()) {
            throw new HttpException(401, 'Sign in to edit the website.');
        }

        $body = $request->getParsedBody();
        $body = \is_array($body) ? $body : [];
        $on = '1' === ($body['on'] ?? null);
        $next = $body['next'] ?? null;

        $response = self::isLocal($next) ? $this->view->redirect($next) : $this->responses->createResponse(204);

        return $response->withAddedHeader('Set-Cookie', self::cookie($request, $on));
    }

    /**
     * Only paths on this host, never "//other.example".
     *
     * @phpstan-assert-if-true string $next
     */
    private static function isLocal(mixed $next): bool
    {
        return \is_string($next) && str_starts_with($next, '/') && !str_starts_with($next, '//') && !str_contains($next, '\\');
    }

    private static function cookie(ServerRequestInterface $request, bool $on): string
    {
        $parts = [EditMode::COOKIE . '=' . ($on ? '1' : ''), 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=' . ($on ? SessionCookie::REMEMBER : 0)];

        if ('https' === $request->getUri()->getScheme()) {
            $parts[] = 'Secure';
        }

        return implode('; ', $parts);
    }
}
