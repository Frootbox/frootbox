<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Access;

use DateTimeImmutable;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Http\SiteUrl;
use Frootbox\Core\Preview\ListPreviews;
use Frootbox\Core\Preview\PreviewEditor;
use Frootbox\Core\Preview\PreviewSummary;
use Frootbox\Core\Site\ShowProtection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Who sees the website before it is public: the password protection and
 * the preview links (decisions 0152 to 0154).
 */
final readonly class AccessHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'preview.list';

    /** The choices for how long a link works, in days. */
    public const array DAYS = [1, 3, 7, 14, 30, 60, 90];

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private SiteUrl $siteUrl,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        try {
            $previews = $this->runner->ask(new ListPreviews());
        } catch (AccessDeniedException) {
            $previews = null;
        }

        $base = $this->siteUrl->base($request);

        return $this->view->render($request, '@backend/access/list.twig', [
            'protection' => $this->runner->ask(new ShowProtection()),
            'previews' => null === $previews ? null : array_map(fn(PreviewSummary $preview): array => [
                'preview' => $preview,
                'link' => self::link($preview, $base),
                'page' => null === $preview->path ? null : (string) parse_url($preview->path, \PHP_URL_PATH),
            ], $previews),
            'durations' => self::durations(),
        ]);
    }

    /**
     * The choices for the end of a link from now, the default first
     * marked: list of {value, days, selected}.
     *
     * @return list<array{value: string, days: int, selected: bool}>
     */
    public static function durations(?DateTimeImmutable $now = null): array
    {
        $now ??= new DateTimeImmutable();

        return array_map(static fn(int $days): array => [
            'value' => $now->modify('+' . $days . ' days')->format(DATE_ATOM),
            'days' => $days,
            'selected' => PreviewEditor::DEFAULT_DAYS === $days,
        ], self::DAYS);
    }

    /**
     * The full address to copy; without "app.url" with the address of
     * this request. Null if the token cannot be read any more.
     */
    public static function link(PreviewSummary $preview, ?string $base): ?string
    {
        if (null !== $preview->url) {
            return $preview->url;
        }

        return null === $preview->path || null === $base ? $preview->path : $base . $preview->path;
    }
}
