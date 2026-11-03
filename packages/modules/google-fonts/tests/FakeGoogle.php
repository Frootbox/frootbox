<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Tests;

use Frootbox\GoogleFonts\GoogleFontsApi;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/**
 * The servers of Google Fonts, answering from here: tests send nothing
 * to the network.
 */
final class FakeGoogle
{
    /** @var list<string> The addresses asked */
    public array $requests = [];

    /** No answer from Google at all */
    public bool $down = false;

    /** @var array<string, string> CSS by family as css2 gets it */
    public array $css;

    public function __construct()
    {
        $this->css = self::faces();
    }

    public function api(): GoogleFontsApi
    {
        return new GoogleFontsApi(new MockHttpClient($this->respond(...)));
    }

    /**
     * @param array<string, mixed> $options
     */
    private function respond(string $method, string $url, array $options): MockResponse
    {
        $this->requests[] = $url;

        if ($this->down) {
            throw new TransportException('Could not resolve host.');
        }

        if (GoogleFontsApi::CATALOG === $url) {
            return new MockResponse(")]}'\n" . json_encode(['familyMetadataList' => self::catalog()], \JSON_THROW_ON_ERROR));
        }

        if (str_starts_with($url, GoogleFontsApi::CSS)) {
            parse_str((string) parse_url($url, \PHP_URL_QUERY), $query);

            $family = \is_string($query['family'] ?? null) ? $query['family'] : '';

            return isset($this->css[$family]) ? new MockResponse($this->css[$family]) : new MockResponse('', ['http_code' => 400]);
        }

        return str_ends_with($url, '.woff2') ? new MockResponse('wOF2 ' . basename($url)) : new MockResponse('', ['http_code' => 404]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function catalog(): array
    {
        return [
            ['family' => 'Lato', 'category' => 'Sans Serif', 'subsets' => ['menu', 'latin', 'latin-ext'], 'fonts' => ['400' => [], '700' => [], '400i' => []], 'axes' => [], 'popularity' => 5],
            ['family' => 'Roboto', 'category' => 'Sans Serif', 'subsets' => ['latin'], 'fonts' => ['400' => []], 'axes' => [], 'popularity' => 1],
            ['family' => 'Inter', 'category' => 'Sans Serif', 'subsets' => ['cyrillic', 'latin', 'latin-ext', 'vietnamese'], 'fonts' => ['100' => [], '400' => [], '900' => [], '400i' => []], 'axes' => [['tag' => 'opsz', 'min' => 14.0, 'max' => 32.0], ['tag' => 'wght', 'min' => 100.0, 'max' => 900.0]], 'popularity' => 2],
            ['family' => 'Lora', 'category' => 'Serif', 'subsets' => ['latin', 'latin-ext'], 'fonts' => ['400' => [], '700' => []], 'axes' => [['tag' => 'wght', 'min' => 400, 'max' => 700]], 'popularity' => 40],
            ['family' => 'Noto Kufi Arabic', 'category' => 'Sans Serif', 'subsets' => ['arabic', 'latin', 'latin-ext'], 'fonts' => ['400' => []], 'axes' => [['tag' => 'wght', 'min' => 100, 'max' => 900]], 'popularity' => 300],
            ['family' => 'Fake Mono', 'category' => 'Monospace', 'subsets' => ['latin'], 'fonts' => ['400' => []], 'axes' => [], 'popularity' => 900],
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function faces(): array
    {
        $face = static fn(string $subset, string $family, string $style, string $weight, string $file, string $range = 'U+0000-00FF'): string => "/* {$subset} */\n@font-face {\n  font-family: '{$family}';\n  font-style: {$style};\n  font-weight: {$weight};\n  font-display: swap;\n  src: url({$file}) format('woff2');\n  unicode-range: {$range};\n}\n";
        $gstatic = 'https://fonts.gstatic.com/s/';

        return [
            'Inter:wght@100..900' => $face('cyrillic', 'Inter', 'normal', '100 900', $gstatic . 'inter/v18/cyr.woff2', 'U+0301, U+0400-045F')
                . $face('latin-ext', 'Inter', 'normal', '100 900', $gstatic . 'inter/v18/ext.woff2', 'U+0100-02BA')
                . $face('latin', 'Inter', 'normal', '100 900', $gstatic . 'inter/v18/latin.woff2'),
            'Lato:ital,wght@0,400;0,700;1,400' => $face('latin', 'Lato', 'italic', '400', $gstatic . 'lato/v24/i400.woff2')
                . $face('latin', 'Lato', 'normal', '400', $gstatic . 'lato/v24/400.woff2')
                . $face('latin', 'Lato', 'normal', '700', $gstatic . 'lato/v24/700.woff2'),
            'Noto Kufi Arabic:wght@100..900' => $face('arabic', 'Noto Kufi Arabic', 'normal', '100 900', $gstatic . 'notokufiarabic/v21/arabic.woff2', 'U+0600-06FF')
                . $face('latin', 'Noto Kufi Arabic', 'normal', '100 900', $gstatic . 'notokufiarabic/v21/latin.woff2'),
            'Fake Mono:wght@400' => $face('latin', 'Fake Mono', 'normal', '400', 'https://fonts.example.com/fake.woff2'),
        ];
    }
}
