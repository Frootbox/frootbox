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
use Frootbox\Core\Account\ShowInvitation;
use Frootbox\Core\Account\SignedIn;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\AuthenticationException;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Routing\Router;
use Frootbox\Core\User\SetPassword;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * An invitation at <backend.path>/welcome/<token> (decision 0342): the
 * person chooses a password and is signed in. It only calls the actions.
 */
final readonly class InvitationHandler implements RequestHandlerInterface
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
        if (null !== $this->view->user()) {
            return $this->view->redirect($this->router->path('backend.dashboard'));
        }

        $token = $request->getAttribute('token');
        $token = \is_string($token) ? $token : '';
        $person = $this->runner->ask(new ShowInvitation($token));

        if (null === $person) {
            return $this->render($request, ['step' => 'invalid'], 404);
        }

        $context = ['step' => 'choose', 'person' => $person, 'token' => $token];

        if ('POST' !== $request->getMethod()) {
            return $this->render($request, $context);
        }

        $this->csrf->verifyOrigin($request);
        $body = $request->getParsedBody();
        $password = \is_array($body) && \is_string($body['password'] ?? null) ? $body['password'] : '';

        try {
            $this->runner->call('account.accept-invitation', ['token' => $token, 'password' => $password]);
        } catch (InvalidInputException $error) {
            if (isset($error->errors['/password'])) {
                return $this->render($request, $context + ['error' => $this->translator->get('The password needs at least {min} characters.', ['min' => SetPassword::MIN_LENGTH])], 422);
            }

            return $this->render($request, ['step' => 'invalid'], 404);
        }

        try {
            $device = mb_substr($request->getHeaderLine('User-Agent'), 0, 255);
            $signedIn = $this->runner->call('account.sign-in', ['email' => $person['email'], 'password' => $password, 'device' => '' === $device ? null : $device]);
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
        return $this->view->render($request, '@backend/welcome.twig', $context + ['days' => PasswordResets::INVITATION_DAYS, 'min' => SetPassword::MIN_LENGTH, 'error' => null], $status);
    }
}
