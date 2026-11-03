<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Users;

use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Plugin\ListAllSpaces;
use Frootbox\Core\Plugin\SpaceScope;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Core\User\ListRoles;
use Frootbox\Core\User\ShowUser;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new user or one to edit: name, email, status, roles, roles within
 * branches of the page tree (decision 0118), password and deleting
 * (decision 0115). Every form runs its own action.
 */
final readonly class UserHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private CurrentContext $context,
        private Languages $languages,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $id = $request->getAttribute('id');
        $roles = $this->runner->ask(new ListRoles())->all();

        if (null === $id) {
            return $this->view->render($request, '@backend/users/new.twig', ['roles' => $roles]);
        }

        $profile = $this->runner->ask(new ShowUser(is_numeric($id) ? (int) $id : 0));
        $global = [];
        $scoped = [];
        $inSpaces = [];

        $tree = $this->tree();
        $spaces = $this->runner->ask(new ListAllSpaces());
        $titles = array_column(array_map(static fn(SpaceScope $space): array => [$space->scope, $space->title], $spaces), 1, 0);

        foreach ($profile->roles as $assignment) {
            if (null === $assignment['scope']) {
                $global[] = $assignment['role'];

                continue;
            }

            $scope = Scope::fromString($assignment['scope']);

            // Roles within a space of a plugin (decision 0245), with its name; null if it is gone.
            if (null !== $scope && SpaceScopes::KIND === $scope->kind) {
                $inSpaces[] = [...$assignment, 'space' => $titles[$assignment['scope']] ?? null];

                continue;
            }

            // The title of the page, null if it is gone or of another kind.
            $page = null !== $scope && 'page' === $scope->kind && null !== $tree && $tree->has($scope->id) ? $tree->row($scope->id) : null;
            $scoped[] = [...$assignment, 'page' => null === $page ? null : ['title' => $page['title'], 'path' => $page['path']]];
        }

        return $this->view->render($request, '@backend/users/edit.twig', [
            'profile' => $profile,
            'roles' => $roles,
            'titles' => RoleTitles::of($roles),
            'assigned' => $global,
            'scoped' => $scoped,
            'inSpaces' => $inSpaces,
            'spaces' => array_map(static fn(SpaceScope $space): array => ['value' => $space->scope, 'label' => $space->title], $spaces),
            'pages' => null === $tree ? [] : array_map(static fn(array $option): array => [...$option, 'value' => 'page:' . $option['value']], $tree->options()),
            'yourself' => $this->context->get()->actor->id === $profile->user->id,
        ]);
    }

    /**
     * The pages to give roles for, null without the right to see them.
     */
    private function tree(): ?PageTree
    {
        try {
            return PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
        } catch (AccessDeniedException) {
            return null;
        }
    }
}
