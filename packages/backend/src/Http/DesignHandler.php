<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Design\Design;
use Frootbox\Backend\Design\Token;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Auth\Permissions;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Http\Exception\HttpException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The design page at <backend.path>/design (decision 0113): every token
 * and every building block in all variants, light and dark side by side,
 * made from the real components. While developing everyone signed in sees
 * it, live only who has "system.design" (superusers).
 */
final readonly class DesignHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'system.design';

    public function __construct(
        private BackendView $view,
        private Design $design,
        private Permissions $permissions,
        private Environment $environment,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $user = $this->view->user();

        if (null === $user) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        if (!$this->environment->isDevelopment() && !$this->permissions->allows($user, self::PERMISSION)) {
            throw new HttpException(403, 'Only superusers see the design page.');
        }

        $tokens = $this->design->tokens();

        return $this->view->render($request, '@backend/design.twig', [
            'brand_tokens' => $tokens->byCategory(Token::BRAND),
            'system_tokens' => $tokens->byCategory(Token::SYSTEM),
            'contrasts' => $tokens->contrasts(),
            'brand' => $this->design->brand(),
        ]);
    }
}
