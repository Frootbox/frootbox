<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\I18n\Translator;
use Frootbox\Backend\Screen;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Auth\Permissions;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\Registry;
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
        private Environment $environment,
        private Router $router,
        private Translator $translator,
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
            ), $inGroup);

            if ([] !== $entries) {
                $groups[] = new MenuGroup($this->translator->get(Screen::GROUPS[$group]), $entries);
            }
        }

        return $groups;
    }

    private function visible(Screen $screen, Actor $actor): bool
    {
        if (!isset(Screen::GROUPS[$screen->group])) {
            throw new ViewException(\sprintf('The screen "%s" has the group "%s". Groups: %s.', $screen->label, $screen->group, implode(', ', array_keys(Screen::GROUPS))));
        }

        return null === $screen->permission
            || ($screen->development && $this->environment->isDevelopment())
            || $this->permissions->allows($actor, $screen->permission);
    }
}
