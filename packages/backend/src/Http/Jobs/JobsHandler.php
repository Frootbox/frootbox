<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Jobs;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Queue\ListJobs;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The queue of jobs in the background, for superusers (decision 0221).
 */
final readonly class JobsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'system.job-list';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        return $this->view->render($request, '@backend/jobs/list.twig', [
            'list' => $this->runner->ask(new ListJobs()),
        ]);
    }
}
