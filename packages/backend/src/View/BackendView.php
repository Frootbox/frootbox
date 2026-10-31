<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\Design\Design;
use Frootbox\Backend\I18n\Translator;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Auth\ActorType;
use Frootbox\Core\Config\Config;
use Frootbox\Core\ProjectPaths;
use Frootbox\Core\Routing\Route;
use Frootbox\Core\Routing\Router;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\StreamFactoryInterface;
use Twig\Environment as Twig;

/**
 * Renders backend views into responses. Every view gets the frame as
 * "fb" (see Frame) and builds on "@backend/layout.twig" or
 * "@backend/frame.twig".
 */
final class BackendView
{
    private ?Twig $twig = null;

    public function __construct(
        private readonly ViewLoader $loader,
        private readonly TwigExtension $extension,
        private readonly Config $config,
        private readonly ProjectPaths $paths,
        private readonly ResponseFactoryInterface $responses,
        private readonly StreamFactoryInterface $streams,
        private readonly CurrentContext $context,
        private readonly Router $router,
        private readonly Csrf $csrf,
        private readonly Design $design,
        private readonly Menu $menu,
        private readonly Head $head,
        private readonly Translator $translator,
    ) {}

    /**
     * @param array<string, mixed> $context
     */
    public function render(ServerRequestInterface $request, string $template, array $context = [], int $status = 200): ResponseInterface
    {
        $html = $this->twig()->render($template, ['fb' => $this->frame($request), ...$context]);

        return self::secure($this->responses->createResponse($status))
            ->withHeader('Content-Type', 'text/html; charset=utf-8')
            ->withBody($this->streams->createStream($html));
    }

    /**
     * A redirect after a form, e.g. to the dashboard after signing in.
     */
    public function redirect(string $url, int $status = 303): ResponseInterface
    {
        return self::secure($this->responses->createResponse($status))->withHeader('Location', $url);
    }

    /**
     * The user of the request, null for a guest.
     */
    public function user(): ?Actor
    {
        $actor = $this->context->get()->actor;

        return ActorType::User === $actor->type ? $actor : null;
    }

    /**
     * Null if a user is signed in, else the way to the sign-in, which
     * leads back here.
     */
    public function requireUser(ServerRequestInterface $request): ?ResponseInterface
    {
        if (null !== $this->user()) {
            return null;
        }

        $uri = $request->getUri();
        $back = $uri->getPath() . ('' === $uri->getQuery() ? '' : '?' . $uri->getQuery());

        return $this->redirect($this->router->path('backend.login', $back === $this->router->path('backend.dashboard') ? [] : ['next' => $back]), 302);
    }

    public function twig(): Twig
    {
        if (null !== $this->twig) {
            return $this->twig;
        }

        $development = $this->config->environment->isDevelopment();
        $this->twig = new Twig($this->loader, [
            'cache' => $development ? false : $this->paths->var('cache/backend/twig'),
            'auto_reload' => $development,
            'strict_variables' => $development,
            'autoescape' => 'html',
        ]);
        $this->twig->addExtension($this->extension);

        return $this->twig;
    }

    private function frame(ServerRequestInterface $request): Frame
    {
        $user = $this->user();
        $route = $request->getAttribute(Route::class);
        $csrf = null === $user ? null : $this->csrf->token($request);
        $site = $this->config->get('app.name');

        return new Frame(
            $this->translator->language(),
            $this->design->brand()->name,
            $this->design->logo(),
            $this->design->logo(dark: true),
            \is_string($site) ? $site : '',
            null === $user ? null : FrameUser::named($user->name),
            null === $user ? [] : $this->menu->groups($user, $route instanceof Route ? $route->name : null),
            $csrf,
            $this->head->html($csrf, null === $user ? null : substr($this->router->path('backend.action', ['name' => 'x']), 0, -1)),
        );
    }

    /**
     * Backend pages are never cached, never framed by other sites and
     * send no referrer to them.
     */
    private static function secure(ResponseInterface $response): ResponseInterface
    {
        return $response
            ->withHeader('Cache-Control', 'no-store')
            ->withHeader('X-Frame-Options', 'SAMEORIGIN')
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('Referrer-Policy', 'same-origin');
    }
}
