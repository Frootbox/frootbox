<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Users;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\User\ListRoles;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The list of roles with their level (role.list).
 */
final readonly class RolesHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'role.list';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $roles = $this->runner->ask(new ListRoles())->all();
        usort($roles, static fn($a, $b): int => [$b->level, $a->name] <=> [$a->level, $b->name]);

        return $this->view->render($request, '@backend/users/roles.twig', ['roles' => $roles]);
    }
}
