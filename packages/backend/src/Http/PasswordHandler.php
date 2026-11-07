<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Account\PasswordResets;
use Frootbox\Core\Account\ShowPasswordReset;
use Frootbox\Core\Account\SignedIn;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\AuthenticationException;
use Frootbox\Core\Auth\TooManyAttemptsException;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Routing\Router;
use Frootbox\Core\User\SetPassword;
use Frootbox\Core\User\User;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A forgotten password (decision 0326): <backend.path>/password asks for
 * the email, <backend.path>/password/<token> sets the new password from
 * the link in the mail and signs in. It only calls the actions.
 */
final readonly class PasswordHandler implements RequestHandlerInterface
{
    public const string TOKEN = '[0-9]+\.[0-9]+\.[A-Za-z0-9_-]+';

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
        if (null !== $this->view->user()) {
            return $this->view->redirect($this->router->path('backend.dashboard'));
        }

        $token = $request->getAttribute('token');

        return \is_string($token) ? $this->reset($request, $token) : $this->request($request);
    }

    private function request(ServerRequestInterface $request): ResponseInterface
    {
        if ('POST' !== $request->getMethod()) {
            $state = $this->runner->ask(new ShowPasswordReset());

            return $this->render($request, ['step' => $state->available ? 'request' : 'unavailable', 'email' => '']);
        }

        $this->csrf->verifyOrigin($request);
        $email = trim($this->field($request, 'email'));

        try {
            $this->runner->call('account.request-password-reset', ['email' => $email]);
        } catch (TooManyAttemptsException $error) {
            return $this->render($request, ['step' => 'request', 'email' => $email, 'error' => $this->translator->get($error->template->text, $error->template->parameters)], 429)
                ->withHeader('Retry-After', (string) $error->retryAfter);
        } catch (InvalidInputException $error) {
            if (!isset($error->errors['/email'])) {
                return $this->render($request, ['step' => 'unavailable'], 422);
            }

            return $this->render($request, ['step' => 'request', 'email' => $email, 'error' => $this->translator->get('Enter a valid email.')], 422);
        }

        return $this->render($request, ['step' => 'sent', 'email' => $email]);
    }

    private function reset(ServerRequestInterface $request, string $token): ResponseInterface
    {
        $state = $this->runner->ask(new ShowPasswordReset($token));

        if (!$state->valid || null === $state->email) {
            return $this->render($request, ['step' => 'invalid'], 404);
        }

        if ('POST' !== $request->getMethod()) {
            return $this->render($request, ['step' => 'reset', 'email' => $state->email, 'token' => $token]);
        }

        $this->csrf->verifyOrigin($request);
        $password = $this->field($request, 'password');

        try {
            $user = $this->runner->call('account.reset-password', ['token' => $token, 'password' => $password]);
        } catch (InvalidInputException $error) {
            if (isset($error->errors['/password'])) {
                return $this->render($request, ['step' => 'reset', 'email' => $state->email, 'token' => $token, 'error' => $this->translator->get('The password needs at least {min} characters.', ['min' => SetPassword::MIN_LENGTH])], 422);
            }

            return $this->render($request, ['step' => 'invalid'], 404);
        }

        $email = $user instanceof User ? $user->email : null;

        try {
            $device = mb_substr($request->getHeaderLine('User-Agent'), 0, 255);
            $signedIn = null === $email ? null : $this->runner->call('account.sign-in', ['email' => $email, 'password' => $password, 'device' => '' === $device ? null : $device]);
        } catch (AuthenticationException|ActionException) {
            $signedIn = null;
        }

        if (!$signedIn instanceof SignedIn) {
            return $this->view->redirect($this->router->path('backend.login'));
        }

        return $this->cookie->set($this->view->redirect($this->router->path('backend.dashboard')), $request, $signedIn->token);
    }

    /**
     * @param array<string, mixed> $context
     */
    private function render(ServerRequestInterface $request, array $context, int $status = 200): ResponseInterface
    {
        return $this->view->render($request, '@backend/password.twig', $context + ['minutes' => PasswordResets::MINUTES, 'min' => SetPassword::MIN_LENGTH, 'error' => null], $status);
    }

    private function field(ServerRequestInterface $request, string $name): string
    {
        $body = $request->getParsedBody();

        return \is_array($body) && \is_string($body[$name] ?? null) ? $body[$name] : '';
    }
}
