<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Catalog;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Action\Schema\InputMapper;
use Frootbox\Core\Auth\Gate;
use Frootbox\Core\Category\CategoryItem;
use Frootbox\Core\Category\ListCategories;
use Frootbox\Core\Category\ListGroups;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Routing\Router;
use Frootbox\Core\Tag\ChooseTags;
use Frootbox\RichText\Html;
use Throwable;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Functions of the backend views:
 *
 *     {{ t('Hello {name}', {name: user.name}) }}
 *     {{ path('backend.dashboard') }}
 *     {{ icon('pages') }}
 *     {% if can('user.create') %}…{% endif %}
 *     {% for group in category_choices('frootbox/news/article') %}…{% endfor %}
 *     {% set choices = tag_choices('frootbox/news/article', space, chosen) %}
 */
final class TwigExtension extends AbstractExtension
{
    public const string ICONS = BackendExtension::ROOT . '/assets/icons';

    /** @var array<string, string> */
    private array $icons = [];

    public function __construct(
        private readonly Translator $translator,
        private readonly Router $router,
        private readonly Catalog $catalog,
        private readonly Gate $gate,
        private readonly CurrentContext $context,
        private readonly Runner $runner,
        private readonly Languages $languages,
    ) {}

    public function getFunctions(): array
    {
        return [
            new TwigFunction('device', Device::describe(...)),
            new TwigFunction('t', $this->translator->get(...)),
            new TwigFunction('path', $this->router->path(...)),
            new TwigFunction('icon', $this->icon(...), ['is_safe' => ['html']]),
            new TwigFunction('can', $this->can(...)),
            new TwigFunction('category_choices', $this->categoryChoices(...)),
            new TwigFunction('tag_choices', $this->tagChoices(...)),
        ];
    }

    /**
     * The tags a form of a module offers (decision 0239): the chosen ones,
     * the presets and the most used ones, closed when only presets count.
     *
     * @param list<mixed> $chosen Ids of tags
     *
     * @return array{closed: bool, options: list<array{value: string, label: string, internal: bool, preset: bool, checked: bool}>, known: list<string>}
     */
    public function tagChoices(string $type, ?string $space = null, array $chosen = []): array
    {
        return $this->runner->ask(new ChooseTags($type, $space, array_values(array_filter($chosen, \is_string(...)))));
    }

    /**
     * Whether the user may run an action or query, so a screen shows only
     * the controls that work (decision 0115). With input, e.g.
     * can('page.update', {id: page.id}), its targets count, too, for
     * roles within branches (decision 0118). The action checks again.
     *
     * @param array<string, mixed>|null $input
     */
    public function can(string $name, ?array $input = null): bool
    {
        if (!$this->catalog->has($name)) {
            return false;
        }

        $descriptor = $this->catalog->get($name);
        $actor = $this->context->get()->actor;

        if (null === $input) {
            return $this->gate->allows($actor, $descriptor);
        }

        try {
            $object = InputMapper::toObject($descriptor->class, $input);
        } catch (Throwable) {
            return false;
        }

        return $this->gate->allowsFor($actor, $descriptor, $object);
    }

    /**
     * An icon of assets/icons/ as inline SVG, hidden from screen readers:
     * the text next to it or the label of its button says what it means.
     */
    public function icon(string $name, string $class = 'fb-icon'): string
    {
        if (1 !== preg_match('/^[a-z0-9-]+$/', $name)) {
            throw new ViewException(\sprintf('"%s" is no icon name.', $name));
        }

        $svg = $this->icons[$name] ??= (string) @file_get_contents(self::ICONS . '/' . $name . '.svg');

        if ('' === $svg) {
            throw new ViewException(\sprintf('There is no icon "%s" in %s.', $name, self::ICONS));
        }

        return str_replace('<svg ', \sprintf('<svg class="%s" aria-hidden="true" focusable="false" ', Html::escape($class)), trim($svg));
    }

    /**
     * The groups of categories of a type with their categories as a tree,
     * for @backend/categories/choices.twig (decision 0233). Titles in the
     * first language that has one.
     *
     * @return list<array{key: string, title: string, items: list<array<string, mixed>>}>
     */
    public function categoryChoices(string $type): array
    {
        $codes = array_map(static fn($language): string => $language->code, $this->languages->all());
        $groups = [];

        try {
            foreach ($this->runner->ask(new ListGroups($type)) as $group) {
                $groups[] = ['key' => $group->key, 'title' => $group->title, 'items' => self::branch($this->runner->ask(new ListCategories($group->key)), null, $codes)];
            }
        } catch (AccessDeniedException) {
            return [];
        }

        return $groups;
    }

    /**
     * @param list<CategoryItem> $items
     * @param list<string>       $codes
     *
     * @return list<array<string, mixed>>
     */
    private static function branch(array $items, ?string $parentId, array $codes): array
    {
        $branch = [];

        foreach ($items as $item) {
            if ($item->parentId === $parentId) {
                $titles = array_values(array_filter(array_map($item->title(...), $codes), static fn(?string $title): bool => null !== $title));
                $branch[] = ['id' => $item->id, 'title' => $titles[0] ?? $item->id, 'children' => self::branch($items, $item->id, $codes)];
            }
        }

        return $branch;
    }
}
