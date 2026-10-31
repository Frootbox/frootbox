<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\I18n\Translator;
use Frootbox\Core\Routing\Router;
use Frootbox\RichText\Html;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Functions of the backend views:
 *
 *     {{ t('Hello {name}', {name: user.name}) }}
 *     {{ path('backend.dashboard') }}
 *     {{ icon('pages') }}
 */
final class TwigExtension extends AbstractExtension
{
    public const string ICONS = BackendExtension::ROOT . '/assets/icons';

    /** @var array<string, string> */
    private array $icons = [];

    public function __construct(
        private readonly Translator $translator,
        private readonly Router $router,
    ) {}

    public function getFunctions(): array
    {
        return [
            new TwigFunction('t', $this->translator->get(...)),
            new TwigFunction('path', $this->router->path(...)),
            new TwigFunction('icon', $this->icon(...), ['is_safe' => ['html']]),
        ];
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
