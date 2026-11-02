<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Media;

use Frootbox\Backend\Http\ActionHandler;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Api\JsonResponder;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Media\UploadReceiver;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST <backend.path>/uploads with the field "file": the first step of an
 * upload like POST /api/v1/uploads, with the session and its CSRF token
 * (decision 0126). The token then goes to media.create.
 */
final readonly class UploadHandler implements RequestHandlerInterface
{
    public function __construct(
        private UploadReceiver $receiver,
        private Csrf $csrf,
        private BackendView $view,
        private CurrentContext $context,
        private JsonResponder $json,
        private ActionHandler $actions,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $this->csrf->verify($request);

        if (null === $this->view->user()) {
            throw new HttpException(401, 'Sign in first.');
        }

        try {
            return $this->json->respond(['data' => $this->receiver->receive($request, $this->context->get()->actor)], 201);
        } catch (ActionException $error) {
            return $this->actions->problem($error);
        }
    }
}
