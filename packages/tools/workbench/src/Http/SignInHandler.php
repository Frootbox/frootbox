<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Workbench\Http;

use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Account\SignedIn;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Routing\Router;
use Frootbox\Workbench\Build\BuildRuns;
use Frootbox\Workbench\SignIn\SignInWithTicket;
use Frootbox\Workbench\Workbench;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use UnexpectedValueException;

/**
 * GET /_workbench/sign-in?ticket=… (decision 0329): redeems the ticket
 * from the start page of the workbench, puts the session into the cookie
 * like the sign-in of the backend and opens the dashboard.
 */
final readonly class SignInHandler implements RequestHandlerInterface
{
    public const string PATH = '/_workbench/sign-in';

    public function __construct(
        private Runner $runner,
        private SessionCookie $cookie,
        private BackendView $view,
        private Router $router,
        private Config $config,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $ticket = $request->getQueryParams()['ticket'] ?? null;
        $device = mb_substr($request->getHeaderLine('User-Agent'), 0, 255);

        try {
            $signedIn = $this->runner->call(SignInWithTicket::NAME, ['ticket' => \is_string($ticket) ? $ticket : '', 'device' => '' === $device ? null : $device]);
        } catch (ActionException $error) {
            return $this->problem($request, $error->getMessage())->withHeader('Referrer-Policy', 'no-referrer');
        }

        if (!$signedIn instanceof SignedIn) {
            throw new UnexpectedValueException(SignInWithTicket::NAME . ' returned no session.');
        }

        $response = $this->view->redirect($this->router->path('backend.dashboard'));

        return $this->cookie->set($response, $request, $signedIn->token, remember: true)->withHeader('Referrer-Policy', 'no-referrer');
    }

    private function problem(ServerRequestInterface $request, string $message): ResponseInterface
    {
        $root = $this->config->env(BuildRuns::ROOT);
        $workbench = null === $root || '' === $root ? null : Workbench::fromRoot($root);
        $back = null === $workbench ? '' : \sprintf(' <a href="%s/">Back to the workbench</a>', Pages::e(\sprintf(Front::origin($request), $workbench->config->domain)));

        return Pages::page(403, 'Not signed in', '<h1>Not signed in</h1><p>' . Pages::e($message) . $back . '</p>');
    }
}
