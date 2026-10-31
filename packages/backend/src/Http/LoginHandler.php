<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\I18n\Translator;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Account\SignedIn;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\AuthenticationException;
use Frootbox\Core\Auth\TooManyAttemptsException;
use Frootbox\Core\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use UnexpectedValueException;

/**
 * The sign-in at <backend.path>/login (decision 0112). It only calls
 * account.sign-in and puts the session into the cookie.
 */
final readonly class LoginHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Csrf $csrf,
        private SessionCookie $cookie,
        private Router $router,
        private Translator $translator,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $next = $this->next($request);

        if (null !== $this->view->user()) {
            return $this->view->redirect($next);
        }

        if ('POST' !== $request->getMethod()) {
            return $this->form($request, $next, '', signedOut: isset($request->getQueryParams()['signed-out']));
        }

        $this->csrf->verifyOrigin($request);
        $body = $request->getParsedBody();
        $email = \is_array($body) && \is_string($body['email'] ?? null) ? trim($body['email']) : '';
        $password = \is_array($body) && \is_string($body['password'] ?? null) ? $body['password'] : '';
        $remember = \is_array($body) && '1' === ($body['remember'] ?? null);
        $device = mb_substr($request->getHeaderLine('User-Agent'), 0, 255);
        $input = ['email' => $email, 'password' => $password, 'device' => '' === $device ? null : $device, 'remember' => $remember];

        try {
            // The context of the request: it knows the address for the throttle.
            $signedIn = $this->runner->call('account.sign-in', $input);
        } catch (AuthenticationException|InvalidInputException) {
            return $this->form($request, $next, $email, $remember, $this->translator->get('The email or the password is wrong.'), 422);
        } catch (TooManyAttemptsException $error) {
            $response = $this->form($request, $next, $email, $remember, $this->translator->get($error->template->text, $error->template->parameters), 429);

            return $response->withHeader('Retry-After', (string) $error->retryAfter);
        }

        if (!$signedIn instanceof SignedIn) {
            throw new UnexpectedValueException('account.sign-in returned no session.');
        }

        return $this->cookie->set($this->view->redirect($next), $request, $signedIn->token, $remember);
    }

    private function form(ServerRequestInterface $request, string $next, string $email, bool $remember = false, ?string $error = null, int $status = 200, bool $signedOut = false): ResponseInterface
    {
        return $this->view->render($request, '@backend/login.twig', [
            'email' => $email,
            'remember' => $remember,
            'error' => $error,
            'signed_out' => $signedOut,
            'next' => $next === $this->router->path('backend.dashboard') ? null : $next,
        ], $status);
    }

    /**
     * Where to go after signing in: a path in the backend, else the
     * dashboard. Never another host.
     */
    private function next(ServerRequestInterface $request): string
    {
        $body = $request->getParsedBody();
        $next = (\is_array($body) ? $body['next'] ?? null : null) ?? $request->getQueryParams()['next'] ?? null;
        $home = $this->router->path('backend.dashboard');

        return \is_string($next) && 1 === preg_match('~^/[^/\\\\]~', $next . 'x') && str_starts_with($next, $home)
            ? $next
            : $home;
    }
}
