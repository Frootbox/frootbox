<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Design;

/**
 * One value of tokens.yaml, e.g. the color "accent" or the space "4".
 */
final readonly class Token
{
    public const string BRAND = 'brand';

    public const string SYSTEM = 'system';

    /**
     * @param string      $group    brand or system
     * @param string      $category e.g. color, space, radius
     * @param string      $value    the value, for colors and shadows the light one
     * @param string|null $dark     the dark value of colors and shadows
     */
    public function __construct(
        public string $group,
        public string $category,
        public string $name,
        public string $value,
        public ?string $dark = null,
        public ?string $use = null,
    ) {}

    /**
     * The CSS variable: --fb-<name> for colors, --fb-<category>-<name> else.
     */
    public function variable(): string
    {
        return '--fb-' . ('color' === $this->category ? $this->name : $this->category . '-' . $this->name);
    }

    public function isThemed(): bool
    {
        return null !== $this->dark;
    }

    public function in(string $mode): string
    {
        return 'dark' === $mode ? $this->dark ?? $this->value : $this->value;
    }

    public function with(string $value, string $dark): self
    {
        return new self($this->group, $this->category, $this->name, $value, $dark, $this->use);
    }
}
