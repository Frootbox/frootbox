<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Support\Message;

/**
 * Checks what the actions of people and locations take in. Errors are
 * collected by JSON pointer and thrown together.
 */
final class Input
{
    public const string MEDIA_PATTERN = '/^[0-9A-HJKMNP-TV-Z]{26}$/';

    /** "53.5444, 9.9663", as copied from a map */
    public const string COORDINATES_PATTERN = '/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/';

    /** @var array<string, Message> */
    private array $errors = [];

    public function __construct(private readonly string $action) {}

    /**
     * Texts by language, each an object or null to remove the language.
     *
     * @param array<mixed> $input
     *
     * @return array<string, array<mixed>|null>
     */
    public function byLanguage(array $input, Languages $languages): array
    {
        if ([] !== $input && array_is_list($input)) {
            $this->errors['/translations'] = new Message('must be an object by language code, e.g. {"de": {…}}.');

            return [];
        }

        $texts = [];

        foreach ($input as $language => $value) {
            $language = (string) $language;

            if (!$languages->has($language)) {
                $this->errors['/translations/' . $language] = new Message('The website has no language "{language}".', ['language' => $language]);
            } elseif (null !== $value && (!\is_array($value) || ([] !== $value && array_is_list($value)))) {
                $this->errors['/translations/' . $language] = new Message('must be an object or null.');
            } else {
                $texts[$language] = $value;
            }
        }

        return $texts;
    }

    /**
     * A trimmed text of an object by language, else the one before.
     *
     * @param array<mixed> $value
     */
    public function text(array $value, string $key, string $before, int $length, string $at): string
    {
        if (!\array_key_exists($key, $value)) {
            return $before;
        }

        if (!\is_string($value[$key])) {
            $this->errors[$at . '/' . $key] = new Message('must be a text.');

            return $before;
        }

        return $this->limit(trim($value[$key]), $length, $at . '/' . $key);
    }

    /**
     * A trimmed text up to a length; null keeps the one before.
     */
    public function line(?string $value, string $before, int $length, string $at): string
    {
        return null === $value ? $before : $this->limit(trim((string) preg_replace('/\s+/u', ' ', $value)), $length, $at);
    }

    public function email(?string $value, string $before, string $at = '/email'): string
    {
        $email = $this->line($value, $before, 200, $at);

        if (null !== $value && '' !== $email && false === filter_var($email, \FILTER_VALIDATE_EMAIL)) {
            $this->errors[$at] = new Message('"{address}" is no email address.', ['address' => $email]);
        }

        return $email;
    }

    public function phone(?string $value, string $before, string $at = '/phone'): string
    {
        $phone = $this->line($value, $before, 40, $at);

        if (null !== $value && '' !== $phone && 1 !== preg_match('/^\+?[0-9 ()\/.-]{3,40}$/', $phone)) {
            $this->errors[$at] = new Message('must be a phone number of digits, spaces and + ( ) / . -, e.g. "+49 40 123456".');
        }

        return $phone;
    }

    public function coordinates(?string $value, string $before): string
    {
        $coordinates = $this->line($value, $before, 50, '/coordinates');

        if (null === $value || '' === $coordinates) {
            return $coordinates;
        }

        if (1 !== preg_match(self::COORDINATES_PATTERN, $coordinates, $match) || abs((float) $match[1]) > 90 || abs((float) $match[2]) > 180) {
            $this->errors['/coordinates'] = new Message('must be latitude and longitude, e.g. "53.5444, 9.9663".');

            return $coordinates;
        }

        return $match[1] . ', ' . $match[2];
    }

    /**
     * An image of the media: {"media": "<id>", "alt": "…"}. null keeps the
     * one before, {} removes it.
     *
     * @param array<mixed>|null $value
     * @param array<mixed>|null $before
     *
     * @return array<mixed>|null
     */
    public function image(?array $value, ?array $before): ?array
    {
        if (null === $value) {
            return $before;
        }

        if ([] === $value) {
            return null;
        }

        if (!\is_string($value['media'] ?? null) || 1 !== preg_match(self::MEDIA_PATTERN, $value['media']) || (isset($value['alt']) && !\is_string($value['alt']))) {
            $this->errors['/image'] = new Message('must be an image as {"media": "<id>", "alt": "…"}.');

            return $before;
        }

        return array_filter(['media' => $value['media'], 'alt' => \is_string($value['alt'] ?? null) ? mb_substr(trim($value['alt']), 0, 300) : null], static fn(mixed $part): bool => null !== $part);
    }

    public function error(string $at, Message $message): void
    {
        $this->errors[$at] = $message;
    }

    /**
     * @throws InvalidInputException
     */
    public function check(): void
    {
        if ([] !== $this->errors) {
            throw new InvalidInputException($this->action, $this->errors);
        }
    }

    private function limit(string $text, int $length, string $at): string
    {
        if (mb_strlen($text) > $length) {
            $this->errors[$at] = new Message('may have at most {count} characters.', ['count' => $length]);
        }

        return $text;
    }
}
