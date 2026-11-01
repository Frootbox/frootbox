<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\I18n\Translator;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Error\ErrorPage;
use Frootbox\Core\Routing\Route;
use Frootbox\Core\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;
use Throwable;

/**
 * Errors below backend.path inside the backend (decision 0132): with the
 * menu for a signed-in user, a plain text and a way on. Technical details
 * only in development.
 */
final readonly class BackendErrorPage implements ErrorPage
{
    public function __construct(
        private BackendView $view,
        private Router $router,
        private Translator $translator,
    ) {}

    public function render(ServerRequestInterface $request, int $status, Throwable $throwable, bool $showDetails): ?string
    {
        $base = rtrim($this->router->path('backend.dashboard'), '/');
        $path = $request->getUri()->getPath();

        if ($path !== $base && !str_starts_with($path, $base . '/')) {
            return null;
        }

        // The route marks the current entry of the menu, e.g. "Pages" for /cms/pages/<id>.
        try {
            $match = $this->router->match($request->getMethod(), $path);
        } catch (Throwable) {
            $match = null;
        }

        if (null !== $match) {
            $request = $request->withAttribute(Route::class, $match->route);
        }

        $query = $request->getUri()->getQuery();
        $kind = match (true) {
            404 === $status, 410 === $status => 'missing',
            403 === $status => 'forbidden',
            $status >= 500 => 'failed',
            default => 'other',
        };
        [$icon, $title, $text] = match ($kind) {
            'missing' => ['search', 'This does not exist (anymore)', 'It may have been deleted, or the link is out of date.'],
            'forbidden' => ['lock', 'You may not open this', 'Your role does not allow it. Ask someone who manages users and roles.'],
            'failed' => ['warning', 'Something went wrong', 'Try it again in a moment. If it keeps happening, the error is in the log.'],
            default => ['alert', 'That did not work', 'Go back and try again.'],
        };

        return $this->view->html($request, null === $this->view->user() ? '@backend/error-guest.twig' : '@backend/error.twig', [
            'error' => [
                'status' => $status,
                'kind' => $kind,
                'icon' => $icon,
                'title' => $this->translator->get($title),
                'text' => $this->translator->get($text),
                'path' => $path,
                'again' => $path . ('' === $query ? '' : '?' . $query),
                'details' => $showDetails ? self::details($throwable) : [],
            ],
        ]);
    }

    /**
     * @return list<array{class: string, message: string, file: string, line: int, trace: string}>
     */
    private static function details(Throwable $throwable): array
    {
        $details = [];

        for ($current = $throwable; null !== $current; $current = $current->getPrevious()) {
            $details[] = [
                'class' => $current::class,
                'message' => $current->getMessage(),
                'file' => $current->getFile(),
                'line' => $current->getLine(),
                'trace' => $current->getTraceAsString(),
            ];
        }

        return $details;
    }
}
