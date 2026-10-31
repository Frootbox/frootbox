<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

/**
 * An allowed attribute of a node or mark, e.g. the level of a heading or
 * the href of a link. Values that do not fit fall back to the default and
 * are reported by RichText::validate().
 */
final readonly class Attribute
{
    /** Protocols a link may use. Relative URLs are always allowed. */
    public const array PROTOCOLS = ['http', 'https', 'mailto', 'tel'];

    /**
     * @param list<string|int> $choices
     * @param list<string>     $protocols
     */
    private function __construct(
        private string $kind,
        public string|int|null $default = null,
        public bool $required = false,
        private array $choices = [],
        private ?int $min = null,
        private ?int $max = null,
        private ?string $pattern = null,
        private array $protocols = [],
    ) {}

    public static function integer(int $default, ?int $min = null, ?int $max = null): self
    {
        return new self('integer', $default, min: $min, max: $max);
    }

    /**
     * @param list<string|int> $choices
     */
    public static function choice(array $choices, string|int|null $default = null): self
    {
        return new self('choice', $default, choices: $choices);
    }

    /**
     * Text, at most $maxLength characters, optionally matching a regular
     * expression such as '/^[a-z0-9-]+$/'.
     */
    public static function text(?string $default = null, int $maxLength = 200, ?string $pattern = null): self
    {
        return new self('text', $default, max: $maxLength, pattern: $pattern);
    }

    /**
     * A URL: relative, or absolute with one of the protocols.
     *
     * @param list<string> $protocols
     */
    public static function url(bool $required = false, array $protocols = self::PROTOCOLS): self
    {
        return new self('url', required: $required, protocols: array_map(strtolower(...), $protocols));
    }

    /**
     * Returns the value to use and an error message if the given value
     * was not acceptable. A missing value (null) is fine unless required.
     *
     * @return array{string|int|null, ?string}
     */
    public function clean(mixed $value): array
    {
        $value = \is_string($value) ? trim($value) : $value;

        if (null === $value) {
            return [$this->default, $this->required ? 'is required' : null];
        }

        $error = match ($this->kind) {
            'integer' => $this->checkInteger($value),
            'choice' => \in_array($value, $this->choices, true) ? null : 'must be one of ' . implode(', ', array_map(static fn(string|int $choice): string => (string) $choice, $this->choices)),
            'text' => $this->checkText($value),
            default => $this->checkUrl($value),
        };

        if (null !== $error) {
            return [$this->default, $error];
        }

        return [\is_string($value) ? $value : (\is_int($value) ? $value : $this->default), null];
    }

    private function checkInteger(mixed $value): ?string
    {
        if (!\is_int($value)) {
            return 'must be a whole number';
        }

        if ((null !== $this->min && $value < $this->min) || (null !== $this->max && $value > $this->max)) {
            return \sprintf('must be between %s and %s', $this->min ?? '…', $this->max ?? '…');
        }

        return null;
    }

    private function checkText(mixed $value): ?string
    {
        if (!\is_string($value)) {
            return 'must be text';
        }

        if (mb_strlen($value) > (int) $this->max) {
            return \sprintf('must be at most %d characters', (int) $this->max);
        }

        if (null !== $this->pattern && 1 !== preg_match($this->pattern, $value)) {
            return 'has an invalid format';
        }

        return null;
    }

    private function checkUrl(mixed $value): ?string
    {
        if (!\is_string($value) || '' === trim($value)) {
            return 'must be a URL';
        }

        $url = trim($value);

        // Control characters and spaces can hide a protocol from browsers, e.g. "java\tscript:".
        if (1 === preg_match('/[\x00-\x20\x7F]/', $url)) {
            return 'must not contain spaces or control characters';
        }

        if (1 === preg_match('/^([a-z][a-z0-9+.-]*):/i', $url, $match) && !\in_array(strtolower($match[1]), $this->protocols, true)) {
            return \sprintf('must use one of the protocols %s', implode(', ', $this->protocols));
        }

        return null;
    }
}
