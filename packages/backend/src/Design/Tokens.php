<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Design;

use Frootbox\Backend\Brand;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

/**
 * The design tokens of tokens.yaml (decisions 0113, 0114): the only
 * source of colors, spaces, sizes and the default brand. They become the
 * CSS variables --fb-… and the tables in DESIGN.md.
 */
final readonly class Tokens
{
    public const string FILE = __DIR__ . '/../../tokens.yaml';

    /** Categories with a light and a dark value. */
    private const array THEMED = ['color', 'shadow'];

    /**
     * @param list<Token>                  $tokens
     * @param list<array{string, string}> $contrast pairs of text and background colors
     * @param array<string, string>        $brand    name, logo, logo-dark and favicon of the default brand
     */
    public function __construct(
        public array $tokens,
        public array $contrast,
        public array $brand,
    ) {}

    public static function fromFile(string $file = self::FILE): self
    {
        try {
            $data = Yaml::parseFile($file);
        } catch (ParseException $error) {
            throw new DesignException(\sprintf('%s is no valid YAML: %s', $file, $error->getMessage()), 0, $error);
        }

        if (!\is_array($data) || !\is_array($data['brand'] ?? null) || !\is_array($data['system'] ?? null)) {
            throw new DesignException(\sprintf('%s needs the groups "brand" and "system".', $file));
        }

        $tokens = [];
        $brand = [];

        foreach ($data['brand'] as $key => $value) {
            if ('color' === $key) {
                continue;
            }

            if (!\is_string($value)) {
                throw new DesignException(\sprintf('"brand.%s" in %s must be text.', $key, $file));
            }

            $brand[(string) $key] = $value;
        }

        foreach ([Token::BRAND => ['color' => $data['brand']['color'] ?? []], Token::SYSTEM => $data['system']] as $group => $categories) {
            foreach ($categories as $category => $entries) {
                if (!\is_array($entries)) {
                    throw new DesignException(\sprintf('"%s.%s" in %s must list tokens by name.', $group, $category, $file));
                }

                foreach ($entries as $name => $entry) {
                    $tokens[] = self::token($group, (string) $category, (string) $name, $entry);
                }
            }
        }

        $contrast = [];

        foreach (\is_array($data['contrast'] ?? null) ? $data['contrast'] : [] as $pair) {
            if (!\is_array($pair) || !\is_string($pair[0] ?? null) || !\is_string($pair[1] ?? null)) {
                throw new DesignException(\sprintf('Each entry of "contrast" in %s must be a pair of colors, e.g. [text, bg].', $file));
            }

            $contrast[] = [$pair[0], $pair[1]];
        }

        $self = new self($tokens, $contrast, $brand);

        foreach ($contrast as [$foreground, $background]) {
            $self->color($foreground);
            $self->color($background);
        }

        return $self;
    }

    /**
     * The tokens with the colors of a brand instead of the default ones.
     */
    public function withBrand(Brand $brand): self
    {
        $tokens = $this->tokens;

        foreach ($brand->colors as $name => $value) {
            $index = array_find_key($tokens, static fn(Token $token): bool => Token::BRAND === $token->group && 'color' === $token->category && $token->name === $name);

            if (null === $index) {
                throw new DesignException(\sprintf('The brand "%s" sets the color "%s", but brands can only set %s.', $brand->name, $name, implode(', ', array_map(static fn(Token $token): string => $token->name, $this->brandColors()))));
            }

            [$light, $dark] = \is_string($value) ? [$value, $value] : [$value['light'], $value['dark']];

            foreach ([$light, $dark] as $color) {
                if (!Contrast::isColor($color)) {
                    throw new DesignException(\sprintf('The color "%s" of the brand "%s" must be a hex color such as "#8637ff", not "%s".', $name, $brand->name, $color));
                }
            }

            $tokens[$index] = $tokens[$index]->with($light, $dark);
        }

        return new self($tokens, $this->contrast, $this->brand);
    }

    /**
     * @return list<Token>
     */
    public function brandColors(): array
    {
        return array_values(array_filter($this->tokens, static fn(Token $token): bool => Token::BRAND === $token->group && 'color' === $token->category));
    }

    public function color(string $name): Token
    {
        return array_find($this->tokens, static fn(Token $token): bool => 'color' === $token->category && $token->name === $name)
            ?? throw new DesignException(\sprintf('There is no color "%s" in tokens.yaml.', $name));
    }

    /**
     * @return array<string, list<Token>> by category, in the order of the file
     */
    public function byCategory(string $group): array
    {
        $categories = [];

        foreach ($this->tokens as $token) {
            if ($token->group === $group) {
                $categories[$token->category][] = $token;
            }
        }

        return $categories;
    }

    /**
     * The contrast of every pair in both modes.
     *
     * @return list<Contrast>
     */
    public function contrasts(): array
    {
        $results = [];

        foreach ($this->contrast as [$foreground, $background]) {
            foreach (['light', 'dark'] as $mode) {
                $results[] = new Contrast($foreground, $background, $mode, Contrast::ratio($this->color($foreground)->in($mode), $this->color($background)->in($mode)));
            }
        }

        return $results;
    }

    /**
     * The CSS variables: light as default, dark when the system prefers it
     * or for data-theme="dark". data-theme="light" keeps light. Both also
     * work on an element, so the design page shows the modes side by side.
     */
    public function css(): string
    {
        $all = self::declarations($this->tokens, 'light');
        $themed = array_values(array_filter($this->tokens, static fn(Token $token): bool => $token->isThemed()));
        $light = self::declarations($themed, 'light');
        $dark = self::declarations($themed, 'dark');

        return ":root{color-scheme:light;{$all}}\n"
            . "[data-theme=\"light\"]{color-scheme:light;{$light}}\n"
            . "[data-theme=\"dark\"]{color-scheme:dark;{$dark}}\n"
            . "@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){color-scheme:dark;{$dark}}}";
    }

    /**
     * The same variables for the shadow DOM of an element on a page of
     * the website, e.g. the bar of the editing mode (decision 0119):
     * on :host, dark for data-theme="dark" on the host or by the system.
     */
    public function hostCss(): string
    {
        $all = self::declarations($this->tokens, 'light');
        $themed = array_values(array_filter($this->tokens, static fn(Token $token): bool => $token->isThemed()));
        $dark = self::declarations($themed, 'dark');

        return ":host{color-scheme:light;{$all}}\n"
            . ":host([data-theme=\"dark\"]){color-scheme:dark;{$dark}}\n"
            . "@media (prefers-color-scheme:dark){:host(:not([data-theme=\"light\"])){color-scheme:dark;{$dark}}}";
    }

    /**
     * @param list<Token> $tokens
     */
    private static function declarations(array $tokens, string $mode): string
    {
        return implode('', array_map(static fn(Token $token): string => $token->variable() . ':' . $token->in($mode) . ';', $tokens));
    }

    private static function token(string $group, string $category, string $name, mixed $entry): Token
    {
        $path = $group . '.' . $category . '.' . $name;
        $entry = \is_array($entry) ? $entry : ['value' => $entry];
        $use = $entry['use'] ?? null;

        if (null !== $use && !\is_string($use)) {
            throw new DesignException(\sprintf('"use" of the token "%s" must be text.', $path));
        }

        if (1 !== preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $name)) {
            throw new DesignException(\sprintf('The token "%s" needs a name of lower case a-z, 0-9 and hyphens.', $path));
        }

        if (\in_array($category, self::THEMED, true)) {
            $light = $entry['light'] ?? null;
            $dark = $entry['dark'] ?? null;

            if (!\is_string($light) || !\is_string($dark)) {
                throw new DesignException(\sprintf('The token "%s" needs a "light" and a "dark" value.', $path));
            }

            if ('color' === $category && (!Contrast::isColor($light) || !Contrast::isColor($dark))) {
                throw new DesignException(\sprintf('The colors of "%s" must be hex colors such as "#8637ff".', $path));
            }

            return new Token($group, $category, $name, $light, $dark, $use);
        }

        $value = $entry['value'] ?? null;

        if (!\is_string($value) && !\is_int($value) && !\is_float($value)) {
            throw new DesignException(\sprintf('The token "%s" needs a "value".', $path));
        }

        return new Token($group, $category, $name, (string) $value, null, $use);
    }
}
