<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Catalog;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\Gate;
use Frootbox\Core\Database\ListMigrations;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\PageStatus;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Queue\ShowQueueStatus;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The first screen after signing in: a greeting, the way to the website
 * and the pages with changes that are not published yet. Each leads to
 * the page in the sitemap and, in the editing mode, on the website. All
 * of them can be published together after a confirmation (decision 0176).
 *
 * @phpstan-import-type Row from PageTree
 *
 * @phpstan-type Pending array{id: string, title: string, lang: string, dir: string, path: string, status: string, edit: ?string}
 */
final readonly class DashboardHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Languages $languages,
        private Catalog $catalog,
        private Gate $gate,
        private CurrentContext $context,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $user = $this->view->user();

        if (null === $user) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        try {
            $tree = PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
            $pending = $this->pending($tree);
            $publishable = $this->publishable($tree, $pending);
        } catch (AccessDeniedException) {
            $pending = null;
            $publishable = [];
        }

        try {
            // The warning without cron, for superusers (decision 0221).
            $queue = $this->runner->ask(new ShowQueueStatus());
        } catch (AccessDeniedException) {
            $queue = null;
        }

        try {
            // Pending migrations, e.g. of a module that just came (decision 0277).
            $migrations = \count($this->runner->ask(new ListMigrations())->pending);
        } catch (AccessDeniedException) {
            $migrations = 0;
        }

        return $this->view->render($request, '@backend/dashboard.twig', [
            'name' => explode(' ', trim($user->name))[0],
            'queue' => $queue,
            'migrations' => $migrations,
            'pending' => $pending,
            'publishable' => $publishable,
        ]);
    }

    /**
     * The pages that are not published as they are, in the order of the
     * sitemap, without the ones above the branches of the user.
     *
     * @param list<Row>|null $rows
     *
     * @return list<Pending>
     */
    private function pending(PageTree $tree, ?array $rows = null): array
    {
        $language = $this->languages->default();
        $pending = [];

        foreach ($rows ?? $tree->rows as $row) {
            if (!$row['outside'] && PageStatus::Published->value !== $row['status']) {
                $pending[] = [
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'lang' => $row['lang'],
                    'dir' => $row['dir'],
                    'path' => $row['path'],
                    'status' => $row['status'],
                    // The draft at its address on this host, like in the sitemap (decision 0119).
                    'edit' => null === $language->domain ? $language->path($tree->path($row['id'], $language->code)) : null,
                ];
            }

            /** @var list<Row> $children */
            $children = $row['children'];
            $pending = [...$pending, ...$this->pending($tree, $children)];
        }

        return $pending;
    }

    /**
     * What "Publish all" takes: the waiting pages the user may publish,
     * without scheduled ones (they go online at their time) and without
     * pages whose parent is not online and stays out.
     *
     * @param list<Pending> $pending
     *
     * @return list<Pending>
     */
    private function publishable(PageTree $tree, array $pending): array
    {
        $actor = $this->context->get()->actor;
        $descriptor = $this->catalog->forClass(PublishPages::class);
        $taken = [];

        // Parents come before their subpages, as in the sitemap.
        foreach ($pending as $page) {
            $offline = array_filter($tree->ancestors($page['id']), static fn(string $id): bool => !$tree->row($id)['online']);

            if ('scheduled' === $page['status']
                || array_diff($offline, array_keys($taken)) !== []
                || !$this->gate->allowsFor($actor, $descriptor, new PublishPages([$page['id']]))) {
                continue;
            }

            $taken[$page['id']] = $page;
        }

        return array_values($taken);
    }
}
