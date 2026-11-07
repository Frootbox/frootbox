<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Workbench\SignIn;

use Frootbox\Core\Account\SignedIn;
use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\ConflictException;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Sensitive;
use Frootbox\Core\Auth\AccessTokens;
use Frootbox\Core\Auth\AuthenticationException;
use Frootbox\Core\Auth\TokenType;
use Frootbox\Core\Config\Config;
use Frootbox\Core\User\RoleAssignments;
use Frootbox\Core\User\Roles;
use Frootbox\Core\User\User;
use Frootbox\Core\User\UserKind;
use Frootbox\Core\User\Users;
use Frootbox\Workbench\Build\BuildRuns;
use Frootbox\Workbench\Workbench;

/**
 * Signs in with a one-time ticket from the start page of the workbench as
 * the oldest active superuser (decision 0329). Only in the workbench and
 * only from this computer.
 *
 * @implements Action<SignedIn>
 */
#[AsAction(self::NAME, 'Signs in as the superuser with a one-time ticket from the start page of the workbench. Only in the workbench and from this computer', public: true, undoable: false)]
final readonly class SignInWithTicket implements Action
{
    public const string NAME = 'frootbox/workbench/account.sign-in';

    public function __construct(
        #[Sensitive]
        #[Length(min: 1, max: 200)]
        public string $ticket,
        #[Length(max: 255)]
        public ?string $device = null,
    ) {}

    public function handle(Config $config, CurrentContext $context, Users $users, Roles $roles, RoleAssignments $assignments, AccessTokens $tokens): SignedIn
    {
        $root = $config->env(BuildRuns::ROOT);
        $project = $config->env(BuildRuns::PROJECT);

        if (null === $root || null === $project || '' === $root || '' === $project) {
            throw new ConflictException('This website does not run in the workbench.');
        }

        if (!SignInTickets::isLocal($context->get()->address)) {
            throw new AuthenticationException('Signing in from the workbench works only on this computer.');
        }

        if (!new SignInTickets(Workbench::fromRoot($root)->config)->redeem($project, $this->ticket)) {
            throw new AuthenticationException('The link is used or expired. Start again on the start page of the workbench.');
        }

        $user = self::superuser($users, $roles, $assignments) ?? throw new ConflictException('This website has no active superuser to sign in as.');
        $issued = $tokens->issue($user->id, TokenType::Session, $this->device, remember: true);

        return new SignedIn($issued->token, $issued->accessToken, $user);
    }

    private static function superuser(Users $users, Roles $roles, RoleAssignments $assignments): ?User
    {
        $role = $roles->findByName('superuser');

        if (null === $role) {
            return null;
        }

        foreach ($assignments->fetch(['where' => ['roleId' => $role->id, 'scope' => null], 'order' => 'userId']) as $assignment) {
            $user = $users->fetchById($assignment->userId);

            if (null !== $user && $user->active && UserKind::Person === $user->kind) {
                return $user;
            }
        }

        return null;
    }
}
