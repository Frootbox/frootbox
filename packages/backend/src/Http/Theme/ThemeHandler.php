<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Theme;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Design\DesignPage;
use Frootbox\Core\Design\ListDesignVersions;
use Frootbox\Core\Design\ShowDesign;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "Design" (decision 0127): what the design of the website is
 * now, publishing or discarding the draft and earlier versions. Changing
 * the values happens on the website, where the effect shows.
 */
final readonly class ThemeHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'design.show';

    /**
     * Where the website opens with the panel "Design": the design page of
     * the core, which shows every element (decision 0207).
     */
    public const string WEBSITE = DesignPage::ROUTE . '#fb-design';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        try {
            $versions = $this->runner->ask(new ListDesignVersions());
        } catch (AccessDeniedException) {
            $versions = null;
        }

        return $this->view->render($request, '@backend/theme.twig', [
            'design' => $this->runner->ask(new ShowDesign()),
            'versions' => $versions,
            'website' => self::WEBSITE,
            'elements' => DesignPage::ROUTE,
        ]);
    }
}
