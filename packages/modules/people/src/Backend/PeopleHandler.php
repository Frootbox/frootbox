<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\People\Person\ListPeople;
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

        return $this->view->render($request, '@frootbox/people/backend/people.twig', [
            'people' => $this->runner->ask(new ListPeople()),
        ]);
    }
}
