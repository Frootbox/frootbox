<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Extensions;

use Frootbox\Backend\Screen;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Component\ComponentUsage;
use Frootbox\Core\Component\ListComponentUsages;
use Frootbox\Core\Database\ListMigrations;
use Frootbox\Core\Extension\ListExtensions;
use Frootbox\Core\Extension\Registry;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The installed extensions, read only, for superusers (decision 0274),
 * with the pages their blocks and layouts are on and what is left of
 * removed ones (decision 0276), their screens (decision 0280) and the
 * official modules that are not installed (decision 0279).
 */
final readonly class ExtensionsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'system.extension-list';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Registry $registry,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $usages = $this->runner->ask(new ListComponentUsages());
        $pages = [];

        foreach ($usages as $usage) {
            foreach ($usage->pages as $page) {
                $pages[$usage->package][$page->id] = true;
            }
        }

        // Screens carry no package, the registry knows who added them (decision 0280).
        $screens = [];

        foreach ($this->registry->items(Screen::class) as $screen) {
            $screens[$this->registry->origin($screen) ?? 'frootbox/core'][] = $screen->label;
        }

        return $this->view->render($request, '@backend/extensions/list.twig', [
            'list' => $this->runner->ask(new ListExtensions()),
            'pages' => array_map(\count(...), $pages),
            'screens' => $screens,
            'missing' => array_values(array_filter($usages, static fn(ComponentUsage $usage): bool => !$usage->installed)),
            // Pending migrations with a button to run them (decision 0277).
            'migrations' => $this->runner->ask(new ListMigrations()),
        ]);
    }
}
