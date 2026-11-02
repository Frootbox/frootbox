<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Search;

/**
 * One hit of the backend search with the address it opens.
 */
final readonly class SearchItem
{
    /**
     * @param string $meta e.g. the languages a page was found in
     */
    public function __construct(
        public string $title,
        public string $url,
        public string $icon,
        public string $excerpt = '',
        public string $meta = '',
    ) {}
}
