<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\PageStatus;
use Frootbox\Core\Page\PageTreeNode;
use Frootbox\Core\Page\ShowPageTree;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The first screen after signing in: a greeting, the way to the website
 * and the pages with changes that are not published yet.
 */
final readonly class DashboardHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Languages $languages,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $user = $this->view->user();

        if (null === $user) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        try {
            $pending = $this->pending($this->runner->ask(new ShowPageTree()));
        } catch (AccessDeniedException) {
            $pending = null;
        }

        return $this->view->render($request, '@backend/dashboard.twig', [
            'name' => explode(' ', trim($user->name))[0],
            'pending' => $pending,
        ]);
    }

    /**
     * @param list<PageTreeNode> $nodes
     *
     * @return list<array{title: string, status: string}>
     */
    private function pending(array $nodes): array
    {
        $language = $this->languages->default()->code;
        $pending = [];

        foreach ($nodes as $node) {
            if (PageStatus::Published !== $node->status) {
                $pending[] = ['title' => $node->titles[$language] ?? array_first($node->titles) ?? $node->id, 'status' => $node->status->value];
            }

            $pending = [...$pending, ...$this->pending($node->children)];
        }

        return $pending;
    }
}
