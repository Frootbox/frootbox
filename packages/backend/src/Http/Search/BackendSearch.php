<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Search;

use Frootbox\Backend\SearchCommand;
use Frootbox\Backend\SearchLink;
use Frootbox\Backend\View\Menu;
use Frootbox\Backend\View\MenuEntry;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Routing\Router;
use Frootbox\Core\Search\Search;
use Frootbox\Core\Search\SearchTerms;

/**
 * The search of the backend (decision 0217): screens and commands whose
 * label fits, then the hits of the query "search.find", grouped by their
 * source and linked to the screen that shows them.
 */
final readonly class BackendSearch
{
    /** Hits asked for at most. */
    public const int LIMIT = 30;

    public function __construct(
        private Runner $runner,
        private Menu $menu,
        private Registry $registry,
        private Router $router,
        private Translator $translator,
        private Languages $languages,
    ) {}

    /**
     * @return list<SearchGroup>
     */
    public function groups(Actor $actor, string $q): array
    {
        $q = trim($q);

        if ('' === $q) {
            return [];
        }

        $groups = [];
        $commands = $this->commands($actor, $q);

        if ([] !== $commands) {
            $groups[] = new SearchGroup($this->translator->get('Go to'), $commands);
        }

        return [...$groups, ...$this->hits($q)];
    }

    /**
     * Screens of the menu and commands whose label has every word.
     *
     * @return list<SearchItem>
     */
    private function commands(Actor $actor, string $q): array
    {
        $language = $this->translator->language();
        $words = array_filter(explode(' ', SearchTerms::normalize($q, $language)), static fn(string $word): bool => '' !== $word);
        $fits = static function (string $label) use ($words, $language): bool {
            $text = ' ' . SearchTerms::normalize($label, $language);

            return array_all($words, static fn(string $word): bool => str_contains($text, ' ' . $word));
        };
        $items = [];

        foreach ($this->menu->groups($actor, null) as $group) {
            foreach ($group->entries as $entry) {
                if ($fits($entry->label)) {
                    $items[] = self::screen($entry);
                }
            }
        }

        foreach ($this->registry->items(SearchCommand::class) as $command) {
            $label = $this->translator->get($command->label);

            if ($fits($label) && $this->menu->permits($actor, $command->permission)) {
                $items[] = new SearchItem($label, $this->router->path($command->route), $command->icon);
            }
        }

        return $items;
    }

    /**
     * @return list<SearchGroup>
     */
    private function hits(string $q): array
    {
        $links = [];

        foreach ($this->registry->items(SearchLink::class) as $link) {
            $links[$link->source] = $link;
        }

        $multilingual = \count($this->languages->all()) > 1;
        $titles = [];
        $items = [];

        foreach ($this->runner->ask(new Search(mb_substr($q, 0, 200), array_keys($links), self::LIMIT)) as $hit) {
            $link = $links[$hit->source];
            $titles[$hit->source] ??= $hit->sourceTitle;
            $items[$hit->source][] = new SearchItem(
                title: '' === $hit->title ? $hit->item : $hit->title,
                url: $this->router->path($link->route, null === $link->parameter ? [] : [$link->parameter => $hit->item]),
                icon: $link->icon,
                excerpt: $hit->excerpt === $hit->title ? '' : $hit->excerpt,
                meta: $multilingual ? implode(' · ', array_map(mb_strtoupper(...), $hit->languages)) : '',
            );
        }

        return array_map(static fn(string $source): SearchGroup => new SearchGroup($titles[$source], $items[$source]), array_keys($items));
    }

    private static function screen(MenuEntry $entry): SearchItem
    {
        return new SearchItem($entry->label, $entry->url, $entry->icon);
    }
}
