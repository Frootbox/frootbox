<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Design;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Brand;
use Frootbox\Core\Asset\PublicAssets;
use Frootbox\Core\Cache\CacheFile;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\ProjectPaths;

/**
 * The active brand and the tokens with its colors (decision 0114). The
 * default brand comes from tokens.yaml, an extension replaces it with
 * $registry->add(Brand::class, …).
 */
final class Design
{
    private const string CACHE = 'cache/backend/tokens.cache';

    private ?Tokens $defaults = null;

    private ?Tokens $tokens = null;

    public function __construct(
        private readonly Registry $registry,
        private readonly PublicAssets $public,
        private readonly Environment $environment,
        private readonly ProjectPaths $paths,
    ) {}

    public function brand(): Brand
    {
        $brands = $this->registry->items(Brand::class);

        return [] === $brands ? $this->defaultBrand() : $brands[\count($brands) - 1];
    }

    /**
     * The tokens of tokens.yaml, before a brand changes them.
     */
    public function defaults(): Tokens
    {
        if (null !== $this->defaults) {
            return $this->defaults;
        }

        if ($this->environment->isDevelopment()) {
            return $this->defaults = Tokens::fromFile();
        }

        $fingerprint = (string) filemtime(Tokens::FILE);
        $cached = CacheFile::read($this->paths->var(self::CACHE), $fingerprint, [Tokens::class, Token::class]);

        if ($cached instanceof Tokens) {
            return $this->defaults = $cached;
        }

        $this->defaults = Tokens::fromFile();
        CacheFile::write($this->paths->var(self::CACHE), $fingerprint, $this->defaults);

        return $this->defaults;
    }

    public function tokens(): Tokens
    {
        return $this->tokens ??= $this->defaults()->withBrand($this->brand());
    }

    public function css(): string
    {
        return $this->tokens()->css();
    }

    public function hostCss(): string
    {
        return $this->tokens()->hostCss();
    }

    /**
     * The URL of the logo, null if the brand has none.
     */
    public function logo(bool $dark = false): ?string
    {
        $brand = $this->brand();
        $file = $dark ? $brand->logoDark ?? $brand->logo : $brand->logo;

        return null === $file ? null : $this->public->versioned($file);
    }

    public function favicon(): ?string
    {
        $file = $this->brand()->favicon;

        return null === $file ? null : $this->public->versioned($file);
    }

    private function defaultBrand(): Brand
    {
        $brand = $this->defaults()->brand;
        $file = static fn(string $key): ?string => isset($brand[$key]) ? BackendExtension::ROOT . '/' . $brand[$key] : null;

        return new Brand($brand['name'] ?? 'CMS', $file('logo'), $file('logo-dark'), $file('favicon'));
    }
}
