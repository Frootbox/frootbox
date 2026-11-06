<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Ai;

use DateTimeImmutable;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Ai\ShowAiStatus;
use Frootbox\Core\Ai\ShowAiUsage;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The AI of the website (decision 0294): its provider and model, what it
 * cost in a month against the limit, and a test of the connection.
 */
final readonly class AiHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'ai.usage';

    /** The months to choose from, the current one first. */
    public const int MONTHS = 6;

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $months = [];
        $first = new DateTimeImmutable('first day of this month');

        for ($i = 0; $i < self::MONTHS; ++$i) {
            $months[] = $first->modify(\sprintf('-%d months', $i))->format('Y-m');
        }

        $month = $request->getQueryParams()['month'] ?? null;
        $month = \is_string($month) && \in_array($month, $months, true) ? $month : $months[0];

        $report = $this->runner->ask(new ShowAiUsage($month));

        return $this->view->render($request, '@backend/ai/show.twig', [
            'status' => $this->runner->ask(new ShowAiStatus()),
            'report' => $report,
            'months' => $months,
            'days' => self::days($month, array_column($report->days, 'calls', 'date')),
        ]);
    }

    /**
     * Every day of the month up to today with its requests, for the chart.
     *
     * @param array<array-key, mixed> $calls by date
     *
     * @return list<array{date: string, calls: int}>
     */
    public static function days(string $month, array $calls, DateTimeImmutable $today = new DateTimeImmutable('today')): array
    {
        $days = [];
        $day = new DateTimeImmutable($month . '-01');
        $end = min($today, $day->modify('last day of this month'));

        for (; $day <= $end; $day = $day->modify('+1 day')) {
            $date = $day->format('Y-m-d');
            $days[] = ['date' => $date, 'calls' => \is_int($calls[$date] ?? null) ? $calls[$date] : 0];
        }

        return $days;
    }
}
