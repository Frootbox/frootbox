<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\I18n\Translator;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\Catalog;
use Frootbox\Core\Action\Normalizer;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Action\UnknownActionException;
use Frootbox\Core\Api\JsonResponder;
use Frootbox\Core\Api\RequestInput;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Error\Problem;
use Frootbox\Core\Http\Exception\HttpException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /cms/queries/<name>?…: runs a query with the session, as
 * /cms/actions/ runs actions, e.g. page.tree for the search for a page
 * in the bar of the editing mode (decision 0122). The answer is
 * {"data": …} as in the REST API.
 */
final readonly class QueryHandler implements RequestHandlerInterface
{
    public function __construct(
        private Catalog $catalog,
        private Runner $runner,
        private BackendView $view,
        private JsonResponder $json,
        private Translator $translator,
        private Environment $environment,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            throw new HttpException(401, 'Sign in first.');
        }

        $name = $request->getAttribute('name');
        $name = \is_string($name) ? $name : '';

        if (!$this->catalog->has($name) || $this->catalog->get($name)->isAction()) {
            throw UnknownActionException::named($name);
        }

        try {
            $result = $this->runner->call($name, RequestInput::of($request, $this->catalog->get($name)));
        } catch (ActionException $error) {
            $problem = Problem::from($error, $this->environment->isDevelopment());

            return $this->json->respond(['status' => $problem->status, 'detail' => $this->translator->get($error->template->text, $error->template->parameters)], $problem->status)
                ->withHeader('Content-Type', 'application/problem+json');
        }

        return $this->json->respond(['data' => Normalizer::normalize($result)]);
    }
}
