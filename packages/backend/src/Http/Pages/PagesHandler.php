<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Pages;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Component\ListLayouts;
use Frootbox\Core\Language\Language;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\ListPageVersions;
use Frootbox\Core\Page\PageVersion;
use Frootbox\Core\Page\ShowPage;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\User\ListUsers;
use Frootbox\Database\EntityNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The pages: the tree on the left, a page on the right (decision 0116).
 * Without an id the start page is shown. htmx asks for the details only
 * (HX-Target "page-detail"), then only they are rendered.
 */
final readonly class PagesHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'page.tree';

    public const string DETAIL = 'page-detail';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Languages $languages,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $tree = PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
        $id = $request->getAttribute('id');
        $id = \is_string($id) ? $id : $tree->first();

        if (null === $id) {
            return $this->view->render($request, '@backend/pages/empty.twig');
        }

        if (!$tree->has($id)) {
            throw EntityNotFoundException::for('pages', $id);
        }

        $detailOnly = $request->hasHeader('HX-Request') && self::DETAIL === $request->getHeaderLine('HX-Target');
        $context = ['tree' => $tree->rows, 'page' => $this->page($request, $tree, $id), 'standalone' => $detailOnly];

        return $this->view->render($request, $detailOnly ? '@backend/pages/detail.twig' : '@backend/pages/show.twig', $context);
    }

    /**
     * Everything the details of a page show.
     *
     * @return array<string, mixed>
     */
    private function page(ServerRequestInterface $request, PageTree $tree, string $id): array
    {
        $details = $this->runner->ask(new ShowPage($id));
        $data = $details->draft ?? $details->published;
        \assert(null !== $data);
        $row = $tree->row($id);

        $chosen = $request->getQueryParams()['language'] ?? null;
        $language = \is_string($chosen) && $this->languages->has($chosen) ? $this->languages->get($chosen) : $this->languages->default();

        // Parents that were never published go online together with the page.
        $offline = array_values(array_filter($tree->ancestors($id), static fn(string $ancestor): bool => !$tree->row($ancestor)['online']));
        $parentId = $tree->parentId($id);

        // Settings that come from a page above, by the title of that page (decision 0117).
        $visibility = $details->visibility;
        $above = static fn(?string $by): ?string => null === $by || $by === $id || !$tree->has($by) ? null : $tree->row($by)['title'];

        return [
            'id' => $id,
            'row' => $row,
            'details' => $details,
            'layout' => $this->layoutTitle($data->layout),
            'language' => $language,
            'languages' => $this->languages->all(),
            'default' => $this->languages->default(),
            'translation' => $data->translations[$language->code] ?? null,
            'prefix' => $this->host($request, $language) . rtrim($language->path(null === $parentId ? '' : $tree->path($parentId, $language->code)), '/') . '/',
            'url' => $details->urls[$language->code] ?? null,
            'publish' => [...$offline, $id],
            'offline_parents' => array_map(static fn(string $ancestor): string => $tree->row($ancestor)['title'], $offline),
            'parent' => $parentId,
            'has_children' => $tree->hasChildren($id),
            'inherited' => [
                'locked' => $above($visibility->lockedBy),
                'searchEngines' => $above($visibility->excludedFromSearchEnginesBy),
                'siteSearch' => $above($visibility->excludedFromSiteSearchBy),
            ],
            'versions' => $this->versions($id),
        ];
    }

    private function layoutTitle(string $name): string
    {
        try {
            $layouts = $this->runner->ask(new ListLayouts());
        } catch (AccessDeniedException) {
            return $name;
        }

        foreach ($layouts as $layout) {
            if ($layout->name === $name) {
                return $layout->title;
            }
        }

        return $name;
    }

    /**
     * The published versions with the names of their authors, null
     * without the right to see them.
     *
     * @return list<array{version: PageVersion, author: ?string}>|null
     */
    private function versions(string $id): ?array
    {
        try {
            $versions = $this->runner->ask(new ListPageVersions($id));
        } catch (AccessDeniedException) {
            return null;
        }

        try {
            $names = [];

            foreach ($this->runner->ask(new ListUsers())->all() as $user) {
                $names[$user->id] = $user->name;
            }
        } catch (AccessDeniedException) {
            $names = [];
        }

        return array_map(static fn(PageVersion $version): array => [
            'version' => $version,
            'author' => null === $version->authorId ? null : $names[$version->authorId] ?? null,
        ], $versions);
    }

    /**
     * Where the language lives: its domain or the host of the backend.
     */
    private function host(ServerRequestInterface $request, Language $language): string
    {
        if (null !== $language->domain) {
            return $language->domain;
        }

        $uri = $request->getUri();
        $port = $uri->getPort();

        return $uri->getHost() . (null === $port ? '' : ':' . $port);
    }
}
