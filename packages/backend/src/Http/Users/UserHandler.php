<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Users;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\User\ListRoles;
use Frootbox\Core\User\ShowUser;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new user or one to edit: name, email, status, roles, password and
 * deleting (decision 0115). Every form runs its own action.
 */
final readonly class UserHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private CurrentContext $context,
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

        foreach ($profile->roles as $assignment) {
            if (null === $assignment['scope']) {
                $global[] = $assignment['role'];
            } else {
                $scoped[] = $assignment;
            }
        }

        return $this->view->render($request, '@backend/users/edit.twig', [
            'profile' => $profile,
            'roles' => $roles,
            'titles' => RoleTitles::of($roles),
            'assigned' => $global,
            'scoped' => $scoped,
            'yourself' => $this->context->get()->actor->id === $profile->user->id,
        ]);
    }
}
