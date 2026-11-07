<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Security\SessionCookie;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\Oidc\CompleteSignIn;
use Frootbox\Core\Auth\Oidc\LinkAccount;
use Frootbox\Core\Auth\Oidc\ListProviders;
use Frootbox\Core\Auth\Oidc\ProviderInfo;
use Frootbox\Core\Auth\Oidc\StartedSignIn;
use Frootbox\Core\Auth\Oidc\StartSignIn;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use UnexpectedValueException;

/**
 * Signing in through a provider such as the hub (decision 0322), below
 * <backend.path>/login/oidc/{provider}. It only calls the actions and
 * keeps their state in cookies:
 *
 * - …/start: account.oidc-start, also the start from the provider
 *   (OIDC Core 4, with iss), and the silent sign-in with prompt=none.
 * - …/link (POST): account.oidc-link from My account or the connection.
 * - the way back: account.oidc-complete, then the session cookie.
 *
 * A cookie remembers the provider of the last sign-in, so the sign-in
 * page goes there silently once when a session ends. Signing out forgets
 * it.
 */
final readonly class OidcHandler implements RequestHandlerInterface
{
    public const string STATE_COOKIE = 'fb_oidc_state';

    public const string NEXT_COOKIE = 'fb_oidc_next';

    public const string PROVIDER_COOKIE = 'fb_oidc';

    /** Answers to prompt=none that mean "not signed in there". */
    private const array SILENT_ERRORS = ['login_required', 'interaction_required', 'consent_required', 'account_selection_required'];

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
        $provider = $request->getAttribute('provider');

        if (!\is_string($provider)) {
            throw new UnexpectedValueException('The route has no provider.');
        }

        $path = $request->getUri()->getPath();

        return match (true) {
            str_ends_with($path, '/link') => $this->link($request, $provider),
            str_ends_with($path, '/start') => $this->start($request, $provider),
            default => $this->complete($request, $provider),
        };
    }

    private function start(ServerRequestInterface $request, string $key): ResponseInterface
    {
        $query = $request->getQueryParams();
        $next = $this->next($query['next'] ?? $query['target_link_uri'] ?? null);

        if (null !== $this->view->user()) {
            return $this->view->redirect($next ?? $this->router->path('backend.dashboard'));
        }

        $provider = $this->provider($key);
        $issuer = $query['iss'] ?? null;

        // Started by the provider: only with its own issuer (OIDC Core 4).
        if (null === $provider || (null !== $issuer && $issuer !== $provider->issuer)) {
            return $this->failed($request, $this->translator->get('Signing in with "{provider}" is not available here.', ['provider' => $key]));
        }

        $prompt = 'none' === ($query['prompt'] ?? null) ? 'none' : null;

        try {
            $started = $this->runner->run(new StartSignIn($key, $next, $prompt));
        } catch (ActionException $error) {
            return $this->failed($request, $this->translator->get($error->template->text, $error->template->parameters));
        }

        return $this->away($request, $started, $next, 302);
    }

    private function link(ServerRequestInterface $request, string $key): ResponseInterface
    {
        $this->csrf->verify($request);

        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $body = $request->getParsedBody();
        $next = $this->next(\is_array($body) ? $body['next'] ?? null : null) ?? $this->router->path('backend.account');

        try {
            $started = $this->runner->run(new LinkAccount($key, $next));
        } catch (ActionException $error) {
            return $this->view->redirect($next . (str_contains($next, '?') ? '&' : '?') . 'oidc-error=' . rawurlencode($this->translator->get($error->template->text, $error->template->parameters)));
        }

        return $this->away($request, $started, $next, 303);
    }

    private function complete(ServerRequestInterface $request, string $key): ResponseInterface
    {
        $query = $request->getQueryParams();
        $cookies = $request->getCookieParams();
        $next = $this->next($cookies[self::NEXT_COOKIE] ?? null);
        $error = $query['error'] ?? null;
        $title = $this->provider($key)->title ?? $key;

        if (\is_string($error)) {
            // The silent sign-in found nobody: the sign-in page with the button first.
            if (\in_array($error, self::SILENT_ERRORS, true)) {
                return $this->forget($request, $this->view->redirect($this->router->path('backend.login', array_filter(['provider' => $key, 'next' => $next], static fn(?string $value): bool => null !== $value)), 302));
            }

            return $this->failed($request, $this->translator->get('{provider} did not sign you in.', ['provider' => $title]));
        }

        $code = $query['code'] ?? null;
        $state = $query['state'] ?? null;
        $stored = $cookies[self::STATE_COOKIE] ?? null;

        if (!\is_string($code) || !\is_string($state) || !\is_string($stored) || '' === $stored) {
            return $this->failed($request, $this->translator->get('The sign-in took too long or came from another window. Please try again.'));
        }

        $device = mb_substr($request->getHeaderLine('User-Agent'), 0, 255);

        try {
            $completed = $this->runner->run(new CompleteSignIn($key, $code, $state, $stored, '' === $device ? null : mb_substr($device, 0, 255)));
        } catch (ActionException $error) {
            return $this->failed($request, $this->translator->get($error->template->text, $error->template->parameters));
        }

        $next = $this->next($completed->next) ?? $next;

        if ($completed->linked || null === $completed->token) {
            return $this->forget($request, $this->view->redirect($next ?? $this->router->path('backend.account')));
        }

        $response = $this->cookie->set($this->view->redirect($next ?? $this->router->path('backend.dashboard')), $request, $completed->token);
        $response = $response->withAddedHeader('Set-Cookie', $this->cookieLine($request, self::PROVIDER_COOKIE, $key, $this->router->path('backend.dashboard'), SessionCookie::REMEMBER));

        return $this->forget($request, $response);
    }

    /**
     * The sign-in page with the error, without the state of the sign-in.
     */
    private function failed(ServerRequestInterface $request, string $message): ResponseInterface
    {
        $response = $this->view->render($request, '@backend/login.twig', [
            'email' => '',
            'remember' => false,
            'error' => $message,
            'signed_out' => false,
            'next' => null,
            'providers' => $this->runner->ask(new ListProviders()),
            'provider' => null,
        ], 422);

        return $this->forget($request, $response);
    }

    private function away(ServerRequestInterface $request, StartedSignIn $started, ?string $next, int $status): ResponseInterface
    {
        $path = $this->router->path('backend.oidc', ['provider' => $started->provider]);
        $seconds = $started->minutes * 60;

        return $this->view->redirect($started->url, $status)
            ->withAddedHeader('Set-Cookie', $this->cookieLine($request, self::STATE_COOKIE, $started->stored, $path, $seconds))
            ->withAddedHeader('Set-Cookie', $this->cookieLine($request, self::NEXT_COOKIE, $next ?? '', $path, null === $next ? 0 : $seconds));
    }

    private function forget(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $provider = $request->getAttribute('provider');
        $path = $this->router->path('backend.oidc', ['provider' => \is_string($provider) ? $provider : 'hub']);

        return $response
            ->withAddedHeader('Set-Cookie', $this->cookieLine($request, self::STATE_COOKIE, '', $path, 0))
            ->withAddedHeader('Set-Cookie', $this->cookieLine($request, self::NEXT_COOKIE, '', $path, 0));
    }

    private function provider(string $key): ?ProviderInfo
    {
        foreach ($this->runner->ask(new ListProviders()) as $provider) {
            if ($provider->key === $key) {
                return $provider;
            }
        }

        return null;
    }

    private function next(mixed $next): ?string
    {
        $home = $this->router->path('backend.dashboard');

        return \is_string($next) && LoginHandler::isBackendPath($next, $home) ? $next : null;
    }

    /**
     * HttpOnly, SameSite=Lax so the way back from the provider brings it,
     * Secure under HTTPS.
     */
    private function cookieLine(ServerRequestInterface $request, string $name, string $value, string $path, int $seconds): string
    {
        $parts = [$name . '=' . rawurlencode($value), 'Path=' . $path, 'Max-Age=' . $seconds, 'HttpOnly', 'SameSite=Lax'];

        if ('https' === $request->getUri()->getScheme()) {
            $parts[] = 'Secure';
        }

        return implode('; ', $parts);
    }
}
