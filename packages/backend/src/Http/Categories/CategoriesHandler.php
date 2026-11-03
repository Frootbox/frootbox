<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Categories;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Category\CategoryItem;
use Frootbox\Core\Category\GroupSummary;
use Frootbox\Core\Category\ListCategories;
use Frootbox\Core\Category\ListGroups;
use Frootbox\Core\Category\ListGroupTypes;
use Frootbox\Core\Language\Languages;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The categories of all groups (decision 0233): a tab for each group,
 * its categories as a tree that can be rearranged, editing in dialogs.
 * Modules link here with ?group=<key>.
 */
final readonly class CategoriesHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'category.update';

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

        $groups = $this->runner->ask(new ListGroups());
        $chosen = $request->getQueryParams()['group'] ?? null;
        $group = array_find($groups, static fn(GroupSummary $group): bool => $group->key === $chosen) ?? $groups[0] ?? null;
        $items = null === $group ? [] : $this->runner->ask(new ListCategories($group->key));
        $languages = array_map(static fn($language): string => $language->code, $this->languages->all());

        return $this->view->render($request, '@backend/categories/show.twig', [
            'groups' => $groups,
            'group' => $group,
            'rows' => $this->rows($items, null, $languages),
            'count' => \count($items),
            'parents' => array_map(static fn(CategoryItem $item): array => [
                'value' => $item->id,
                'label' => str_repeat('– ', $item->depth) . self::title($item, $languages),
            ], $items),
            'languages' => $this->languages->all(),
            'types' => $this->canCreateGroups() ? $this->runner->ask(new ListGroupTypes()) : [],
        ]);
    }

    private function canCreateGroups(): bool
    {
        try {
            $this->runner->ask(new ListGroupTypes());
        } catch (AccessDeniedException) {
            return false;
        }

        return true;
    }

    /**
     * The categories below one as rows of the tree, each with the values
     * for the dialog.
     *
     * @param list<CategoryItem> $items
     * @param list<string>       $languages
     *
     * @return list<array<string, mixed>>
     */
    private function rows(array $items, ?string $parentId, array $languages): array
    {
        $rows = [];

        foreach ($items as $item) {
            if ($item->parentId !== $parentId) {
                continue;
            }

            $fill = ['id' => $item->id];

            foreach ($languages as $language) {
                $translation = $item->translations[$language] ?? null;

                foreach (['title', 'slug', 'description'] as $field) {
                    $value = \is_array($translation) ? $translation[$field] ?? '' : '';
                    $fill['translations.' . $language . '.' . $field] = \is_string($value) ? $value : '';
                }
            }

            $children = $this->rows($items, $item->id, $languages);
            $rows[] = [
                'id' => $item->id,
                'title' => self::title($item, $languages),
                'slug' => $item->slug($languages[0] ?? ''),
                'depth' => $item->depth,
                'preset' => null !== $item->preset,
                'missing' => array_values(array_filter($languages, static fn(string $language): bool => null === $item->title($language))),
                'fill' => $fill,
                'children' => $children,
            ];
        }

        return $rows;
    }

    /**
     * @param list<string> $languages
     */
    private static function title(CategoryItem $item, array $languages): string
    {
        foreach ($languages as $language) {
            $title = $item->title($language);

            if (null !== $title) {
                return $title;
            }
        }

        return $item->id;
    }
}
