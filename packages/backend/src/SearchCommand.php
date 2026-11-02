<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend;

/**
 * A command the search offers by its label, e.g. "New page" (decision
 * 0217):
 *
 *     $registry->add(SearchCommand::class, new SearchCommand('New article', 'acme.news.articles.new', 'acme/news/article.create', 'plus'));
 *
 * The label is English and translated; it shows only to users with the
 * permission, or who may run the action of that name.
 */
final readonly class SearchCommand
{
    public function __construct(
        public string $label,
        public string $route,
        public ?string $permission = null,
        public string $icon = 'plus',
    ) {}
}
