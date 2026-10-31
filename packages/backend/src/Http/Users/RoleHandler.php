<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Users;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\User\DeleteRole;
use Frootbox\Core\User\ListPermissions;
use Frootbox\Core\User\ListRoles;
use Frootbox\Core\User\Role;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new role or one to edit (decision 0115). The rules are text, one per
 * line, with the list of every permission below to look them up.
 */
final readonly class RoleHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $name = $request->getAttribute('name');
        $role = null;

        if (\is_string($name)) {
            $matches = array_filter($this->runner->ask(new ListRoles())->all(), static fn(Role $role): bool => $role->name === $name);
            $role = array_first($matches) ?? throw new HttpException(404, \sprintf('There is no role "%s".', $name));
        }

        return $this->view->render($request, '@backend/users/role.twig', [
            'role' => $role,
            'permissions' => $this->runner->ask(new ListPermissions()),
            'protected' => null !== $role && \in_array($role->name, DeleteRole::PROTECTED, true),
        ]);
    }
}
