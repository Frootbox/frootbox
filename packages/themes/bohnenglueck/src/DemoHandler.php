<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\ThemeBohnenglueck;

use Frootbox\Core\Component\Component;
use Frootbox\Core\Component\ComponentKind;
use Frootbox\Core\Component\Components;
use Frootbox\Core\Component\Instance;
use Frootbox\Core\Theme\ThemeChain;
use Frootbox\Core\View\ComponentRenderer;
use Nyholm\Psr7\Response;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use RuntimeException;

/**
 * Demo page until pages arrive (M2, phase 3): renders the layout and
 * blocks from demo/onepager.json and inlines the CSS of the blocks
 * used on the page plus the theme tokens.
 */
final readonly class DemoHandler implements RequestHandlerInterface
{
    public function __construct(
        private ComponentRenderer $renderer,
        private Components $components,
        private ThemeChain $themes,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $page = Instance::fromArray($this->content(), ComponentKind::Layout);

        $body = $this->renderer->layout($page);
        $css = $this->themes->css() . "\n" . implode("\n", array_map(
            static fn(string $file): string => (string) file_get_contents($file),
            $this->styles($page, ComponentKind::Layout),
        ));

        $html = <<<HTML
            <!doctype html>
            <html lang="de">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Bohnenglück – Kaffeerösterei am Hafen</title>
            <style>
            {$css}
            </style>
            </head>
            <body>
            {$body}
            </body>
            </html>
            HTML;

        return new Response(200, ['Content-Type' => 'text/html; charset=utf-8'], $html);
    }

    /**
     * @return array<mixed>
     */
    private function content(): array
    {
        $file = \dirname(__DIR__) . '/demo/onepager.json';
        $json = file_get_contents($file);
        $data = false === $json ? null : json_decode($json, true, flags: \JSON_THROW_ON_ERROR);

        if (!\is_array($data)) {
            throw new RuntimeException(\sprintf('%s must contain a JSON object.', $file));
        }

        return $data;
    }

    /**
     * CSS files of the layout and every block on the page, each once.
     *
     * @return array<string, string>
     */
    private function styles(Instance $instance, ComponentKind $kind): array
    {
        $component = $this->components->get($kind, $instance->name);
        $files = $component instanceof Component
            ? array_filter($component->assets, static fn(string $path): bool => str_ends_with($path, '.css'), \ARRAY_FILTER_USE_KEY)
            : [];
        $styles = [];

        foreach ($files as $path => $file) {
            $styles[$instance->name . '/' . $path] = $file;
        }

        foreach ($instance->areas as $blocks) {
            foreach ($blocks as $block) {
                $styles = [...$styles, ...$this->styles($block, ComponentKind::Block)];
            }
        }

        return $styles;
    }
}
