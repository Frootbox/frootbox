<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\Catalog;
use Frootbox\Core\Action\Normalizer;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Action\UnknownActionException;
use Frootbox\Core\Api\JsonResponder;
use Frootbox\Core\Api\RequestInput;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Preview\PreviewAccess;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Runs actions and queries with preview: true for the note of a preview,
 * e.g. comment.create (decision 0156):
 *
 *     POST <backend.path>/preview/actions/comment.create
 *     GET  <backend.path>/preview/queries/comment.list?pageId=…
 *
 * Only with the cookie of a valid preview link and the header
 * "X-Frootbox-Preview: 1" instead of a CSRF token: other websites cannot
 * send it without asking, and the cookie is SameSite=Lax.
 */
final readonly class PreviewActionHandler implements RequestHandlerInterface
{
    public const string HEADER = 'X-Frootbox-Preview';

    public function __construct(
        private Catalog $catalog,
        private Runner $runner,
        private JsonResponder $json,
        private ActionHandler $actions,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if ('1' !== $request->getHeaderLine(self::HEADER)) {
            throw new HttpException(400, \sprintf('The header %s is missing.', self::HEADER));
        }

        if (!$request->getAttribute(PreviewAccess::class) instanceof PreviewAccess) {
            throw new HttpException(403, 'Open the preview link again.');
        }

        $name = $request->getAttribute('name');
        $name = \is_string($name) ? $name : '';
        $descriptor = $this->catalog->has($name) ? $this->catalog->get($name) : null;

        if (null === $descriptor || !$descriptor->preview || $descriptor->isAction() !== ('POST' === $request->getMethod())) {
            throw UnknownActionException::named($name);
        }

        try {
            $result = $this->runner->call($name, RequestInput::of($request, $descriptor));
        } catch (ActionException $error) {
            return $this->actions->problem($error);
        }

        return $this->json->respond(['data' => Normalizer::normalize($result)])->withHeader('Cache-Control', 'no-store');
    }
}
