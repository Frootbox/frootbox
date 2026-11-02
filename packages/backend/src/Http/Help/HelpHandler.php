<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Help;

use Frootbox\Backend\Design\Design;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Normalizer;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Api\JsonResponder;
use Frootbox\Core\Help\ListHelp;
use Frootbox\Core\Help\ShowHelp;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Routing\Router;
use Frootbox\Database\EntityNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /cms/help and /cms/help/<id>: the outline of the help and one page
 * (decisions 0215, 0218). With Accept: application/json a page comes as
 * {data: {title, html, url, translated}} for the side panel of the help
 * button.
 */
final readonly class HelpHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Router $router,
        private JsonResponder $json,
        private Design $design,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $json = str_contains($request->getHeaderLine('Accept'), 'application/json');

        if (null === $this->view->user()) {
            if ($json) {
                throw new HttpException(401, 'Sign in first.');
            }

            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $id = $request->getAttribute('id');
        $entries = $this->runner->ask(new ListHelp());
        $brand = $this->design->brand();
        $context = ['entries' => $entries, 'brand' => $brand, 'current' => null, 'article' => null];

        if (\is_string($id)) {
            try {
                $article = $this->runner->ask(new ShowHelp($id, substr($this->router->path('backend.help.show', ['id' => 'x']), 0, -1) . '{id}'));
            } catch (EntityNotFoundException) {
                throw new HttpException(404, 'There is no such help page.');
            }

            $url = $this->router->path('backend.help.show', ['id' => $article->id]);

            if ($json) {
                return $this->json->respond(['data' => Normalizer::normalize(['title' => $article->title, 'html' => $article->html, 'url' => $url, 'translated' => $article->translated])]);
            }

            $context = [...$context, 'current' => $article->id, 'article' => $article];
        }

        return $this->view->render($request, '@backend/help/show.twig', $context);
    }
}
