<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\I18n;

use Frootbox\Core\Cache\CacheFile;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\ProjectPaths;
use Stringable;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

/**
 * The texts of the backend in the language of the user (decisions 0110,
 * 0114). The English text is the key; each package has its translations
 * in translations/<language>.yaml:
 *
 *     "Sign in": Anmelden
 *     "Hello {name}": "Hallo {name}"
 *     "{count} page": { one: "{count} Seite", other: "{count} Seiten" }
 *
 * The language comes from "backend.language", else the first language of
 * the website if there are texts for it, else English. A missing text
 * shows in English.
 */
final class Translator
{
    public const string FOLDER = 'translations';

    private const string CACHE = 'cache/backend/translations-%s.cache';

    private ?string $language = null;

    /** @var array<string, string|array{one: string, other: string}>|null */
    private ?array $messages = null;

    public function __construct(
        private readonly Config $config,
        private readonly Languages $languages,
        private readonly Extensions $extensions,
        private readonly ProjectPaths $paths,
    ) {}

    /**
     * The language of the backend, e.g. "de" or "en".
     */
    public function language(): string
    {
        if (null !== $this->language) {
            return $this->language;
        }

        $configured = $this->config->get('backend.language');

        if (\is_string($configured) && '' !== $configured) {
            return $this->language = $configured;
        }

        $site = $this->languages->default()->code;

        return $this->language = [] !== $this->files($site) ? $site : 'en';
    }

    /**
     * A text in the language of the backend, with {placeholders} filled
     * in. For a text with a plural, pass the English singular and plural
     * and a "count".
     *
     * @param string|array{string, string}                         $text
     * @param array<string, bool|float|int|string|Stringable|null> $parameters
     */
    public function get(string|array $text, array $parameters = []): string
    {
        $count = $parameters['count'] ?? null;
        $one = !(\is_int($count) || \is_float($count)) || 1.0 === (float) $count;
        $key = \is_array($text) ? $text[0] : $text;
        $message = $this->messages()[$key] ?? null;

        if (\is_array($message)) {
            $message = $one ? $message['one'] : $message['other'];
        } elseif (null === $message) {
            $message = \is_array($text) ? $text[$one ? 0 : 1] : $text;
        }

        $replace = [];

        foreach ($parameters as $name => $value) {
            $replace['{' . $name . '}'] = \is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
        }

        return strtr($message, $replace);
    }

    /**
     * @return array<string, string|array{one: string, other: string}>
     */
    private function messages(): array
    {
        if (null !== $this->messages) {
            return $this->messages;
        }

        $language = $this->language();

        if ('en' === $language) {
            return $this->messages = [];
        }

        $files = $this->files($language);
        $fingerprint = implode('|', array_map(static fn(string $file): string => $file . ':' . filemtime($file), $files));
        $cache = $this->paths->var(\sprintf(self::CACHE, $language));
        $cached = $this->config->environment->isDevelopment() ? null : CacheFile::read($cache, $fingerprint, []);

        if (\is_array($cached)) {
            return $this->messages = self::messagesOf($cached, $cache);
        }

        $messages = [];

        foreach ($files as $file) {
            $messages = [...$messages, ...self::read($file)];
        }

        if (!$this->config->environment->isDevelopment()) {
            CacheFile::write($cache, $fingerprint, $messages);
        }

        return $this->messages = $messages;
    }

    /**
     * The translation files of all packages for a language, e.g. "de-ch"
     * and then "de".
     *
     * @return list<string>
     */
    private function files(string $language): array
    {
        $candidates = array_unique([explode('-', $language)[0], $language]);
        $files = [];

        foreach ($this->extensions as $package) {
            foreach ($candidates as $candidate) {
                $file = $package->path . '/' . self::FOLDER . '/' . $candidate . '.yaml';

                if (is_file($file)) {
                    $files[] = $file;
                }
            }
        }

        return $files;
    }

    /**
     * @return array<string, string|array{one: string, other: string}>
     */
    private static function read(string $file): array
    {
        try {
            $data = Yaml::parseFile($file);
        } catch (ParseException $error) {
            throw new TranslationException(\sprintf('%s is no valid YAML: %s', $file, $error->getMessage()), 0, $error);
        }

        return self::messagesOf(\is_array($data) ? $data : [], $file);
    }

    /**
     * @param array<mixed> $data
     *
     * @return array<string, string|array{one: string, other: string}>
     */
    private static function messagesOf(array $data, string $file): array
    {
        $messages = [];

        foreach ($data as $key => $value) {
            if (\is_string($value)) {
                $messages[(string) $key] = $value;
            } elseif (\is_array($value) && \is_string($value['one'] ?? null) && \is_string($value['other'] ?? null)) {
                $messages[(string) $key] = ['one' => $value['one'], 'other' => $value['other']];
            } else {
                throw new TranslationException(\sprintf('"%s" in %s must be a text or have "one" and "other".', $key, $file));
            }
        }

        return $messages;
    }
}
