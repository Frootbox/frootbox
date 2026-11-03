<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Spaces;

use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Plugin\ListPlugins;
use Frootbox\Core\Plugin\SpaceList;
use Frootbox\Core\Plugin\SpaceSummary;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "Spaces" (decision 0242): each plugin with its spaces, the
 * page that shows each and how many objects each holds; renaming,
 * deleting and adding through space.update, space.delete and
 * space.create.
 */
final readonly class SpacesHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'plugin.assign';

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

        return $this->view->render($request, '@backend/spaces/list.twig', [
            'plugins' => array_map(static fn(SpaceList $list): array => [
                'type' => $list->type,
                'label' => $list->label,
                'several' => $list->several,
                'spaces' => array_map(static fn(SpaceSummary $space): array => [
                    'space' => $space,
                    'page' => null === $space->pageId || null === $tree || !$tree->has($space->pageId) ? null : ['id' => $space->pageId, 'title' => $tree->row($space->pageId)['title'], 'path' => $tree->row($space->pageId)['path']],
                ], $list->items),
            ], $this->runner->ask(new ListPlugins())),
        ]);
    }
}
