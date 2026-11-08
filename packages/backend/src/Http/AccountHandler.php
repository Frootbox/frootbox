<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Account\ListLanguages;
use Frootbox\Core\Account\ListTokens;
use Frootbox\Core\Account\ShowAccount;
use Frootbox\Core\Account\ShowPasswordReset;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\AccessToken;
use Frootbox\Core\Auth\Oidc\ListIdentities;
use Frootbox\Core\Auth\Oidc\ListProviders;
use Frootbox\Core\Auth\TokenType;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The own account (decisions 0115, 0341): name and email, the language of the
 * backend (decision 0161), the password, the sessions and API tokens.
 * For everyone signed in.
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
            'languages' => $this->runner->ask(new ListLanguages()),
            'sessions' => array_values(array_filter($tokens, static fn(AccessToken $token): bool => TokenType::Session === $token->type)),
            'tokens' => array_values(array_filter($tokens, static fn(AccessToken $token): bool => TokenType::Api === $token->type)),
            'current' => $current,
            // Links to providers such as the hub (decision 0322).
            'identities' => $this->runner->ask(new ListIdentities()),
            'providers' => $this->runner->ask(new ListProviders()),
            // Whether a new email goes through a link in a mail (decision 0341).
            'mailLinks' => $this->runner->ask(new ShowPasswordReset())->available,
            'emailChanged' => isset($request->getQueryParams()['email-changed']),
            'oidcError' => \is_string($request->getQueryParams()['oidc-error'] ?? null) ? mb_substr($request->getQueryParams()['oidc-error'], 0, 300) : null,
        ]);
    }
}
