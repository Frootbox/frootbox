<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Plugin\ListSpaces;
use Frootbox\People\Person\ListPeople;
use Frootbox\People\Person\PersonStore;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "People": the team in its order (decision 0226).
 */
final readonly class PeopleHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'frootbox/people/person.list';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $params = $request->getQueryParams();
        $spaces = $this->runner->ask(new ListSpaces(PersonStore::TYPE, 'frootbox/people/person.list'))->items;
        $space = null;

        // With more than one space a tab for each, the default one first (decisions 0232, 0242).
        if (\count($spaces) > 1) {
            $ids = array_map(static fn($item): string => $item->id, $spaces);
            $space = \is_string($params['space'] ?? null) && \in_array($params['space'], $ids, true) ? $params['space'] : $ids[0];
        } elseif (1 === \count($spaces) && !$spaces[0]->default) {
            // A role only within one space (decision 0245): its list, new ones go there.
            $space = $spaces[0]->id;
        }

        return $this->view->render($request, '@frootbox/people/backend/people.twig', [
            'people' => $this->runner->ask(new ListPeople(space: $space)),
            'spaces' => \count($spaces) > 1 ? $spaces : [],
            'space' => $space,
        ]);
    }
}
