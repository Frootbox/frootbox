<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Navigations;

use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Navigation\ListNavigations;
use Frootbox\Core\Navigation\NavigationDetails;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Url\Target;
use Frootbox\Database\EntityNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The navigations of the theme: the list on the left, the items of one
 * navigation in one language on the right (decision 0116). htmx asks
 * for the details only (HX-Target "navigation-detail").
 */
final readonly class NavigationsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'navigation.list';

    public const string DETAIL = 'navigation-detail';

    /** The fields of an item the dialog edits. */
    private const array FIELDS = ['type', 'label', 'target', 'url', 'anchor', 'phone', 'email', 'depth', 'newWindow'];

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

        $navigations = $this->runner->ask(new ListNavigations());

        if ([] === $navigations) {
            return $this->view->render($request, '@backend/navigations/empty.twig');
        }

        $name = $request->getAttribute('name');
        $name = \is_string($name) ? $name : $navigations[0]->name;
        $current = array_find($navigations, static fn(NavigationDetails $details): bool => $details->name === $name) ?? throw EntityNotFoundException::for('navigations', $name);

        $chosen = $request->getQueryParams()['language'] ?? null;
        $language = \is_string($chosen) && $this->languages->has($chosen) ? $this->languages->get($chosen) : $this->languages->default();

        try {
            $tree = PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
        } catch (AccessDeniedException) {
            $tree = null;
        }

        $items = $current->draft ?? $current->published;
        $sources = array_values(array_filter(
            $this->languages->all(),
            static fn($other): bool => $other->code !== $language->code && [] !== ($items[$other->code] ?? []),
        ));

        $detailOnly = $request->hasHeader('HX-Request') && self::DETAIL === $request->getHeaderLine('HX-Target');

        return $this->view->render($request, $detailOnly ? '@backend/navigations/detail.twig' : '@backend/navigations/show.twig', [
            'navigations' => $navigations,
            'navigation' => [
                'details' => $current,
                'language' => $language,
                'languages' => $this->languages->all(),
                'items' => $items[$language->code] ?? [],
                'rows' => $this->rows($items[$language->code] ?? [], $tree, []),
                'missing' => !isset($items[$language->code]),
                'sources' => $sources,
                'pages' => null === $tree ? [] : array_map(static fn(array $option): array => [...$option, 'value' => Target::PAGE . ':' . $option['value']], $tree->options()),
            ],
            'standalone' => $detailOnly,
        ]);
    }

    /**
     * The items as rows of the tree, each with the page it points to and
     * the values for the dialog.
     *
     * @param list<array<mixed>> $items
     * @param list<int>          $path
     *
     * @return list<array<string, mixed>>
     */
    private function rows(array $items, ?PageTree $tree, array $path): array
    {
        $rows = [];

        foreach ($items as $index => $item) {
            $place = [...$path, $index];
            $fill = ['_path' => implode('.', $place)];

            foreach (self::FIELDS as $field) {
                $fill[$field] = $item[$field] ?? ('newWindow' === $field ? false : '');
            }

            $children = \is_array($item['children'] ?? null) ? array_values(array_filter($item['children'], \is_array(...))) : [];
            $rows[] = [
                'id' => \is_string($item['id'] ?? null) ? $item['id'] : implode('-', $place),
                'item' => $item,
                'page' => $this->page($item['target'] ?? null, $tree),
                'depth' => \count($path),
                'leaf' => 'pages' === ($item['type'] ?? null),
                'fill' => $fill,
                'children' => $this->rows($children, $tree, $place),
            ];
        }

        return $rows;
    }

    /**
     * Title and path of the page an item points to, null if none or gone.
     *
     * @return array{title: string, path: string}|null
     */
    private function page(mixed $target, ?PageTree $tree): ?array
    {
        $parsed = \is_string($target) ? Target::tryParse($target) : null;

        if (null === $parsed || !$parsed->isPage() || null === $tree || !$tree->has($parsed->id)) {
            return null;
        }

        $row = $tree->row($parsed->id);

        return ['title' => $row['title'], 'path' => $row['path']];
    }
}
