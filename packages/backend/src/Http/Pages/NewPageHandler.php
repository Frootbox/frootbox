<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Pages;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Component\LayoutSummary;
use Frootbox\Core\Component\ListLayouts;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\ShowPageTree;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new page as a draft in the default language: title, address, parent
 * and layout (decision 0116). ?parent=<id> chooses the parent, without
 * pages the new one becomes the start page.
 */
final readonly class NewPageHandler implements RequestHandlerInterface
{
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

        $tree = PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
        $parent = $request->getQueryParams()['parent'] ?? null;
        $parent = \is_string($parent) && $tree->inside($parent) ? $parent : $tree->first();
        $layouts = $this->runner->ask(new ListLayouts());
        $language = $this->languages->default();
        $uri = $request->getUri();
        $port = $uri->getPort();
        $host = $language->domain ?? $uri->getHost() . (null === $port ? '' : ':' . $port);

        // The address starts with the path of the parent, the field follows the choice.
        $prefix = static fn(string $id): string => $host . rtrim($language->path($tree->path($id, $language->code)), '/') . '/';
        $parents = array_map(static fn(array $option): array => [...$option, 'attrs' => ['data-prefix' => $prefix($option['value'])]], $tree->options());

        return $this->view->render($request, '@backend/pages/new.twig', [
            'parents' => $parents,
            'parent' => $parent,
            'prefix' => null === $parent ? $host . '/' : $prefix($parent),
            'layouts' => array_map(static fn(LayoutSummary $layout): array => ['value' => $layout->name, 'title' => $layout->title, 'text' => $layout->description], array_values(array_filter($layouts, static fn(LayoutSummary $layout): bool => $layout->offered))),
            'suggested' => null === $parent ? null : $tree->layoutBelow($parent),
            'language' => $language,
        ]);
    }
}
