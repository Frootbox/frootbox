<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Pages;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\ShowPageHistory;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Database\EntityNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The whole history of a page (decision 0174): who changed what and when,
 * with old and new values, by language and page by page into the past.
 * The edit mode links here for one block with ?block=.
 */
final readonly class PageHistoryHandler implements RequestHandlerInterface
{
    public const int PAGE = 30;

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Languages $languages,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $user = $this->view->user();

        if (null === $user) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $tree = PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
        $id = $request->getAttribute('id');
        \assert(\is_string($id));

        if (!$tree->has($id)) {
            throw EntityNotFoundException::for('pages', $id);
        }

        if (!$tree->inside($id)) {
            throw AccessDeniedException::forPermission('page.show', $user);
        }

        $query = $request->getQueryParams();
        $language = \is_string($query['language'] ?? null) && $this->languages->has($query['language']) ? $query['language'] : null;
        $block = \is_string($query['block'] ?? null) && 1 === preg_match('/^[A-Za-z0-9_-]{1,64}$/', $query['block']) ? $query['block'] : null;
        $before = \is_string($query['before'] ?? null) && ctype_digit($query['before']) ? (int) $query['before'] : null;

        return $this->view->render($request, '@backend/pages/history.twig', [
            'row' => $tree->row($id),
            'id' => $id,
            'history' => $this->runner->ask(new ShowPageHistory($id, $block, language: $language, limit: self::PAGE, before: $before)),
            'languages' => $this->languages->all(),
            'language' => $language,
            'block' => $block,
            'before' => $before,
        ]);
    }
}
