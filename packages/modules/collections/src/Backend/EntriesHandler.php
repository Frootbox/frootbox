<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\ListEntries;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Plugin\ListSpaces;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "Collections": a tab for each collection, its entries by
 * position and title, with a search and pages (decisions 0220, 0246).
 */
final readonly class EntriesHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'frootbox/collections/entry.list';

    private const int PER_PAGE = 50;

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Translator $translator,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $params = $request->getQueryParams();
        $search = \is_string($params['q'] ?? null) ? mb_substr(trim($params['q']), 0, 100) : '';
        $page = \is_string($params['page'] ?? null) && ctype_digit($params['page']) ? max(1, (int) $params['page']) : 1;
        $spaces = $this->runner->ask(new ListSpaces(EntryStore::TYPE, 'frootbox/collections/entry.list'))->items;
        $space = null;

        // With more than one space a tab for each, the default one first (decision 0232).
        if (\count($spaces) > 1) {
            $ids = array_map(static fn($item): string => $item->id, $spaces);
            $space = \is_string($params['space'] ?? null) && \in_array($params['space'], $ids, true) ? $params['space'] : $ids[0];
        } elseif (1 === \count($spaces) && !$spaces[0]->default) {
            // A role only within one space (decision 0245): its list, new ones go there.
            $space = $spaces[0]->id;
        }

        // The name of the collection above its entries, unless it is still called like the module.
        $shown = array_values(array_filter($spaces, static fn($item): bool => $item->id === ($space ?? $spaces[0]->id ?? null)))[0] ?? null;
        $name = null === $shown || $shown->title === $this->translator->get('Collections') ? null : $shown->title;

        $list = $this->runner->ask(new ListEntries(search: '' === $search ? null : $search, page: $page, perPage: self::PER_PAGE, space: $space));

        return $this->view->render($request, '@frootbox/collections/backend/entries.twig', [
            'list' => $list,
            'search' => $search,
            'spaces' => \count($spaces) > 1 ? $spaces : [],
            'space' => $space,
            'name' => $name,
        ]);
    }
}
