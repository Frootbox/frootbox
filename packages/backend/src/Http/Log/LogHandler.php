<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Log;

use DateTimeImmutable;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Channel;
use Frootbox\Core\Action\EntryStatus;
use Frootbox\Core\Action\ListActionLog;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\User\ListUsers;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The log of all actions (decision 0174), for those with the right
 * action.log: filters by person, action, channel, status and days, page
 * by page into the past.
 */
final readonly class LogHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'action.log';

    public const int PAGE = 50;

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $query = $request->getQueryParams();
        $text = static fn(string $key): ?string => \is_string($query[$key] ?? null) && '' !== trim($query[$key]) ? trim($query[$key]) : null;
        $day = static function (?string $value): ?DateTimeImmutable {
            $date = null === $value ? false : DateTimeImmutable::createFromFormat('!Y-m-d', $value);

            return false === $date ? null : $date;
        };

        $user = $text('user');
        $action = $text('action');
        $page = $text('before');
        $filters = [
            'user' => null !== $user && ctype_digit($user) ? (int) $user : null,
            'action' => null === $action ? null : mb_substr($action, 0, 100),
            'channel' => Channel::tryFrom($text('channel') ?? ''),
            'status' => EntryStatus::tryFrom($text('status') ?? ''),
            'from' => $day($text('from')),
            'to' => $day($text('to')),
            'nested' => '1' === $text('nested'),
        ];
        $before = null !== $page && ctype_digit($page) ? (int) $page : null;
        $to = $filters['to']?->modify('+1 day');

        $log = $this->runner->ask(new ListActionLog($filters['user'], $filters['action'], $filters['channel'], $filters['status'], $filters['from'], $to, $filters['nested'], self::PAGE, $before));

        return $this->view->render($request, '@backend/log/list.twig', [
            'log' => $log,
            'filters' => $filters,
            'before' => $before,
            'users' => $this->users(),
            // The filters as a query, to page with them.
            'keep' => http_build_query(array_filter([
                'user' => $filters['user'],
                'action' => $filters['action'],
                'channel' => $filters['channel']?->value,
                'status' => $filters['status']?->value,
                'from' => $filters['from']?->format('Y-m-d'),
                'to' => $filters['to']?->format('Y-m-d'),
                'nested' => $filters['nested'] ? '1' : null,
            ], static fn(mixed $value): bool => null !== $value)),
        ]);
    }

    /**
     * People to filter by, empty without the right to list them.
     *
     * @return list<array{value: string, label: string}>
     */
    private function users(): array
    {
        try {
            $users = [];

            foreach ($this->runner->ask(new ListUsers())->all() as $user) {
                $users[] = ['value' => (string) $user->id, 'label' => $user->name];
            }

            return $users;
        } catch (AccessDeniedException) {
            return [];
        }
    }
}
