<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Account\SignOut;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Signs out through account.sign-out and removes the cookie.
 */
final readonly class LogoutHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Csrf $csrf,
        private SessionCookie $cookie,
        private Router $router,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $this->csrf->verify($request);

        if (null !== $this->view->user()) {
            $this->runner->run(new SignOut());
        }

        return $this->cookie->clear($this->view->redirect($this->router->path('backend.login', ['signed-out' => 1])), $request);
    }
}
