<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Account\ListTokens;
use Frootbox\Core\Account\ShowAccount;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\AccessToken;
use Frootbox\Core\Auth\TokenType;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The own account (decision 0115): name and email, the password, the
 * sessions and API tokens. For everyone signed in.
 */
final readonly class AccountHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private CurrentContext $context,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $tokens = $this->runner->ask(new ListTokens());
        $current = $this->context->get()->tokenId;

        return $this->view->render($request, '@backend/account.twig', [
            'profile' => $this->runner->ask(new ShowAccount()),
            'sessions' => array_values(array_filter($tokens, static fn(AccessToken $token): bool => TokenType::Session === $token->type)),
            'tokens' => array_values(array_filter($tokens, static fn(AccessToken $token): bool => TokenType::Api === $token->type)),
            'current' => $current,
        ]);
    }
}
