<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Users;

use Frootbox\Core\User\Role;

/**
 * The title of each role by its name, for lists and checkboxes.
 */
final class RoleTitles
{
    /**
     * @param list<Role> $roles
     *
     * @return array<string, string>
     */
    public static function of(array $roles): array
    {
        $titles = [];

        foreach ($roles as $role) {
            $titles[$role->name] = $role->title;
        }

        return $titles;
    }
}
