<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Settings;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Security\Secrets;
use Frootbox\Core\Settings\ListSettings;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The settings of the extensions, one card each (decision 0221).
 */
final readonly class SettingsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'settings.list';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Secrets $secrets,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        return $this->view->render($request, '@backend/settings/list.twig', [
            'extensions' => $this->runner->ask(new ListSettings()),
            // Without APP_SECRET no secret can be stored.
            'secretsAvailable' => $this->secrets->available(),
        ]);
    }
}
