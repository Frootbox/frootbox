<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\People\Location\ListLocations;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The locations by name (decision 0226).
 */
final readonly class LocationsHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        return $this->view->render($request, '@frootbox/people/backend/locations.twig', [
            'locations' => $this->runner->ask(new ListLocations()),
        ]);
    }
}
