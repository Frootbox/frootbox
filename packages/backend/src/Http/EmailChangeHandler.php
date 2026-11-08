<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Account\EmailChanges;
use Frootbox\Core\Account\ShowEmailChange;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The link to confirm a new email at <backend.path>/email/<token>
 * (decision 0341). Opening it shows the address; only the button
 * confirms, since some mail programs open links ahead.
 */
final readonly class EmailChangeHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Csrf $csrf,
        private Router $router,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $token = $request->getAttribute('token');
        $token = \is_string($token) ? $token : '';
        $email = $this->runner->ask(new ShowEmailChange($token));

        if (null === $email) {
            return $this->render($request, ['step' => 'invalid'], 404);
        }

        if ('POST' !== $request->getMethod()) {
            return $this->render($request, ['step' => 'confirm', 'email' => $email, 'token' => $token]);
        }

        $this->csrf->verifyOrigin($request);

        try {
            $this->runner->call('account.confirm-email-change', ['token' => $token]);
        } catch (InvalidInputException) {
            return $this->render($request, ['step' => 'taken', 'email' => $email], 409);
        }

        if (null !== $this->view->user()) {
            return $this->view->redirect($this->router->path('backend.account') . '?email-changed=1');
        }

        return $this->view->redirect($this->router->path('backend.login') . '?' . http_build_query(['email' => $email, 'changed' => 'email']));
    }

    /**
     * @param array<string, mixed> $context
     */
    private function render(ServerRequestInterface $request, array $context, int $status = 200): ResponseInterface
    {
        return $this->view->render($request, '@backend/email-change.twig', $context + ['hours' => EmailChanges::HOURS], $status);
    }
}
