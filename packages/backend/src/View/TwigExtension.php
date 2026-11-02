<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Core\Action\Catalog;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Action\Schema\InputMapper;
use Frootbox\Core\Auth\Gate;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Routing\Router;
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
    ) {}

    public function getFunctions(): array
    {
        return [
            new TwigFunction('device', Device::describe(...)),
            new TwigFunction('t', $this->translator->get(...)),
            new TwigFunction('path', $this->router->path(...)),
            new TwigFunction('icon', $this->icon(...), ['is_safe' => ['html']]),
            new TwigFunction('can', $this->can(...)),
        ];
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
}
