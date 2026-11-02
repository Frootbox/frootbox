<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Search;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Normalizer;
use Frootbox\Core\Api\JsonResponder;
use Frootbox\Core\Http\Exception\HttpException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /cms/search?q=…: the screen of the search, or its groups as JSON
 * for the search dialog (decisions 0214, 0217). Without a script the
 * search field of the sidebar leads here.
 */
final readonly class SearchHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private BackendSearch $search,
        private JsonResponder $json,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $user = $this->view->user();
        $json = str_contains($request->getHeaderLine('Accept'), 'application/json');

        if (null === $user) {
            if ($json) {
                throw new HttpException(401, 'Sign in first.');
            }

            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $q = $request->getQueryParams()['q'] ?? '';
        $q = \is_string($q) ? mb_substr(trim($q), 0, 200) : '';
        $groups = $this->search->groups($user, $q);

        if ($json) {
            return $this->json->respond(['data' => Normalizer::normalize($groups)]);
        }

        return $this->view->render($request, '@backend/search.twig', ['q' => $q, 'groups' => $groups]);
    }
}
