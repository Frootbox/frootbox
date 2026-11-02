<?php

/*
 * SPDX-License-Identifier: MIT
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
 *
 * An agency adds its own help on top of the built-in one (decision
 * 0215): "Help from <helpName>" with an address and a phone number at
 * the top of the screen "Help".
 */
final readonly class Brand
{
    /**
     * @param string|null                                     $logo     on light backgrounds
     * @param string|null                                     $logoDark on dark backgrounds, defaults to $logo
     * @param array<string, string|array{light: string, dark: string}> $colors   brand colors of tokens.yaml by name; a string counts for both modes
     * @param string|null                                     $helpName  who helps, e.g. the agency
     * @param string|null                                     $helpUrl   where, an https address or mailto:
     * @param string|null                                     $helpPhone e.g. "+49 30 1234567"
     */
    public function __construct(
        public string $name,
        public ?string $logo = null,
        public ?string $logoDark = null,
        public ?string $favicon = null,
        public array $colors = [],
        public ?string $helpName = null,
        public ?string $helpUrl = null,
        public ?string $helpPhone = null,
    ) {}
}
