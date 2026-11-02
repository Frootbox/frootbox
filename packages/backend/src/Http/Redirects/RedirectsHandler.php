<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Redirects;

use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Url\ListNotFound;
use Frootbox\Core\Url\ListRedirects;
use Frootbox\Core\Url\Redirect;
use Frootbox\Core\Url\Target;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Manual redirects and the paths that found nothing (decision 0116).
 */
final readonly class RedirectsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'redirect.list';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Languages $languages,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        try {
            $tree = PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
        } catch (AccessDeniedException) {
            $tree = null;
        }

        try {
            $notFound = $this->runner->ask(new ListNotFound());
        } catch (AccessDeniedException) {
            $notFound = null;
        }

        return $this->view->render($request, '@backend/redirects/list.twig', [
            'redirects' => array_map(fn(Redirect $redirect): array => [
                'redirect' => $redirect,
                'page' => null === $redirect->target ? null : $this->page($redirect->target, $tree),
            ], $this->runner->ask(new ListRedirects())),
            'not_found' => $notFound,
            'pages' => null === $tree ? [] : array_map(static fn(array $option): array => [...$option, 'value' => Target::PAGE . ':' . $option['value']], $tree->options()),
        ]);
    }

    /**
     * Title and path of the page a redirect leads to, null if it is gone.
     *
     * @return array{title: string, path: string}|null
     */
    private function page(string $target, ?PageTree $tree): ?array
    {
        $parsed = Target::tryParse($target);

        if (null === $parsed || null === $tree || !$tree->has($parsed->id)) {
            return null;
        }

        $row = $tree->row($parsed->id);

        return ['title' => $row['title'], 'path' => $row['path']];
    }
}
