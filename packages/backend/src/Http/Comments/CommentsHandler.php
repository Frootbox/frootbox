<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Comments;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Comment\CommentStatus;
use Frootbox\Core\Comment\ListComments;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "Comments": the threads of the whole website, open ones
 * first, with replying, marking done and deleting (decision 0156).
 */
final readonly class CommentsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'comment.list';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $filter = $request->getQueryParams()['status'] ?? null;
        $status = \is_string($filter) ? CommentStatus::tryFrom($filter) : CommentStatus::Open;
        $status = 'all' === $filter ? null : $status ?? CommentStatus::Open;

        return $this->view->render($request, '@backend/comments/list.twig', [
            'threads' => $this->runner->ask(new ListComments(status: $status)),
            'status' => $status->value ?? 'all',
        ]);
    }
}
