<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend;

/**
 * An entry of the menu in the sidebar (decision 0114):
 *
 *     $registry->add(Screen::class, new Screen('Orders', 'acme.shop.orders', Screen::CONTENT, 'cart', 'acme/shop/order.list'));
 *
 * The label is English and translated like every text of the backend.
 * The entry is current on its route and on routes whose name starts with
 * it and a dot, e.g. "acme.shop.orders.show".
 */
final readonly class Screen
{
    public const string CONTENT = 'content';

    public const string WEBSITE = 'website';

    public const string ADMINISTRATION = 'administration';

    /** The groups of the sidebar in their order, with their labels. */
    public const array GROUPS = [
        self::CONTENT => 'Content',
        self::WEBSITE => 'Website',
        self::ADMINISTRATION => 'Administration',
    ];

    /**
     * @param string      $route       name of the route that shows the screen
     * @param string      $icon        a file in assets/icons/ of the backend, without .svg
     * @param string|null $permission  shown only if the user has it, e.g. "page.tree"
     * @param bool        $development shown to everyone signed in while developing
     * @param string|null $count       a query returning a number to show next to the entry, e.g. "comment.count" (decision 0156)
     */
    public function __construct(
        public string $label,
        public string $route,
        public string $group = self::CONTENT,
        public string $icon = 'square',
        public ?string $permission = null,
        public int $order = 100,
        public bool $development = false,
        public ?string $count = null,
    ) {}
}
