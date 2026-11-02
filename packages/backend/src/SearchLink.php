<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend;

/**
 * Where a hit of a search source opens in the backend (decision 0217):
 *
 *     $registry->add(SearchLink::class, new SearchLink('acme/news/article', 'acme.news.articles.show', 'id', 'news'));
 *
 * Hits of a source without a link are left out of the backend search.
 */
final readonly class SearchLink
{
    /**
     * @param string      $source    name of the search source, e.g. "page"
     * @param string      $route     name of the route that shows an item
     * @param string|null $parameter the placeholder of the route that takes the item, none for a screen of all items
     * @param string      $icon      a file in assets/icons/ of the backend, without .svg
     */
    public function __construct(
        public string $source,
        public string $route,
        public ?string $parameter = 'id',
        public string $icon = 'square',
    ) {}
}
