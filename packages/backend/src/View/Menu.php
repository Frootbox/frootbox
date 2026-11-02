<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Doctrine\DBAL\Exception as DatabaseException;
use Frootbox\Backend\Screen;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\Catalog;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Auth\Gate;
use Frootbox\Core\Auth\Permissions;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Routing\Router;

/**
 * The menu of the sidebar: the screens extensions add, grouped, sorted
 * and only those the user may see.
 */
final readonly class Menu
{
    public function __construct(
        private Registry $registry,
        private Permissions $permissions,
        private Catalog $catalog,
        private Gate $gate,
        private Environment $environment,
        private Router $router,
        private Translator $translator,
        private Runner $runner,
    ) {}

    /**
     * @return list<MenuGroup>
     */
    public function groups(Actor $actor, ?string $route): array
    {
        $screens = array_filter($this->registry->items(Screen::class), fn(Screen $screen): bool => $this->visible($screen, $actor));
        $groups = [];

        foreach (array_keys(Screen::GROUPS) as $group) {
            $inGroup = array_filter($screens, static fn(Screen $screen): bool => $screen->group === $group);
            usort($inGroup, static fn(Screen $a, Screen $b): int => $a->order <=> $b->order);
            $entries = array_map(fn(Screen $screen): MenuEntry => new MenuEntry(
                $this->translator->get($screen->label),
                $this->router->path($screen->route),
                $screen->icon,
                null !== $route && ($route === $screen->route || str_starts_with($route, $screen->route . '.')),
                $this->count($screen, $actor),
            ), $inGroup);

            if ([] !== $entries) {
                $groups[] = new MenuGroup($this->translator->get(Screen::GROUPS[$group]), $entries);
            }
        }

        return $groups;
    }

    /**
     * The number of the query the screen names, if the actor may ask it;
     * null for none or zero.
     */
    private function count(Screen $screen, Actor $actor): ?int
    {
        if (null === $screen->count || !$this->catalog->has($screen->count) || !$this->gate->allows($actor, $this->catalog->get($screen->count))) {
            return null;
        }

        try {
            $count = $this->runner->call($screen->count, []);
        } catch (ActionException|DatabaseException) {
            // The menu stays usable, e.g. before the migration of a new table.
            return null;
        }

        return \is_int($count) && $count > 0 ? $count : null;
    }

    private function visible(Screen $screen, Actor $actor): bool
    {
        if (!isset(Screen::GROUPS[$screen->group])) {
            throw new ViewException(\sprintf('The screen "%s" has the group "%s". Groups: %s.', $screen->label, $screen->group, implode(', ', array_keys(Screen::GROUPS))));
        }

        return null === $screen->permission
            || ($screen->development && $this->environment->isDevelopment())
            // A screen named after a query shows when the query may run,
            // e.g. pages with a role only within a branch (decision 0118).
            || ($this->catalog->has($screen->permission)
                ? $this->gate->allows($actor, $this->catalog->get($screen->permission))
                : $this->permissions->allows($actor, $screen->permission));
    }
}
