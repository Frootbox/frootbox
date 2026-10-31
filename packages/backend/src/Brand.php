<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend;

/**
 * How the backend presents itself: name, logos and the brand colors from
 * tokens.yaml (decisions 0113, 0114). An extension replaces the default
 * with its own:
 *
 *     $registry->add(Brand::class, new Brand(
 *         name: 'Agency CMS',
 *         logo: __DIR__ . '/../assets/logo.svg',
 *         colors: ['accent' => ['light' => '#0b6e4f', 'dark' => '#5fd3a8']],
 *     ));
 *
 * The brand added last wins, so a project beats a module. Files must be
 * in an assets/ folder of the package. Without a logo the name is shown.
 */
final readonly class Brand
{
    /**
     * @param string|null                                     $logo     on light backgrounds
     * @param string|null                                     $logoDark on dark backgrounds, defaults to $logo
     * @param array<string, string|array{light: string, dark: string}> $colors   brand colors of tokens.yaml by name; a string counts for both modes
     */
    public function __construct(
        public string $name,
        public ?string $logo = null,
        public ?string $logoDark = null,
        public ?string $favicon = null,
        public array $colors = [],
    ) {}
}
