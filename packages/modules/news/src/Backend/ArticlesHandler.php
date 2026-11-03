<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Plugin\ListSpaces;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ListArticles;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "News": the articles, newest first, with a search and pages
 * (decision 0220). With more than one space a tab for each, the default
 * space first (decision 0232).
 */
final readonly class ArticlesHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'frootbox/news/article.list';

    private const int PER_PAGE = 50;

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
        $search = \is_string($params['q'] ?? null) ? mb_substr(trim($params['q']), 0, 100) : '';
        $page = \is_string($params['page'] ?? null) && ctype_digit($params['page']) ? max(1, (int) $params['page']) : 1;
        $spaces = $this->runner->ask(new ListSpaces(ArticleStore::TYPE, 'frootbox/news/article.list'))->items;
        $space = null;

        if (\count($spaces) > 1) {
            $ids = array_map(static fn($item): string => $item->id, $spaces);
            $space = \is_string($params['space'] ?? null) && \in_array($params['space'], $ids, true) ? $params['space'] : $ids[0];
        } elseif (1 === \count($spaces) && !$spaces[0]->default) {
            // A role only within one space (decision 0245): its list, new ones go there.
            $space = $spaces[0]->id;
        }

        $list = $this->runner->ask(new ListArticles(search: '' === $search ? null : $search, page: $page, perPage: self::PER_PAGE, space: $space));

        return $this->view->render($request, '@frootbox/news/backend/articles.twig', [
            'list' => $list,
            'search' => $search,
            'spaces' => \count($spaces) > 1 ? $spaces : [],
            'space' => $space,
        ]);
    }
}
