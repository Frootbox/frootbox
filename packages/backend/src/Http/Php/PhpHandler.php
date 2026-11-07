<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Php;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Status\ShowPhpInfo;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * How PHP is set up on the server, for superusers (decision 0335). The
 * search is a plain GET form, so it works without JavaScript.
 */
final readonly class PhpHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'system.php-info';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $search = $request->getQueryParams()['search'] ?? null;

        return $this->view->render($request, '@backend/php/show.twig', [
            'info' => $this->runner->ask(new ShowPhpInfo(\is_string($search) ? mb_substr($search, 0, 100) : null)),
        ]);
    }
}
