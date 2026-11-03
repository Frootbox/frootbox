<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts;

use Frootbox\Core\Action\ConflictException;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * The servers of Google Fonts (decision 0252): the catalog without a
 * key, the CSS of a family and its files. Only the server talks to them,
 * when an admin searches or imports, never a visitor.
 */
final readonly class GoogleFontsApi
{
    public const string CATALOG = 'https://fonts.google.com/metadata/fonts';

    public const string CSS = 'https://fonts.googleapis.com/css2';

    /** Files only from here. */
    public const string FILES = 'fonts.gstatic.com';

    /** A current browser, so the CSS names WOFF2 files. */
    private const string AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

    private HttpClientInterface $client;

    public function __construct(?HttpClientInterface $client = null)
    {
        $this->client = $client ?? HttpClient::create(['timeout' => 20, 'max_redirects' => 2]);
    }

    /**
     * The catalog as Google gives it, without the guard ")]}'" in front.
     *
     * @return array<mixed>
     *
     * @throws ConflictException Google Fonts cannot be reached or answers otherwise
     */
    public function catalog(): array
    {
        $body = preg_replace('/^\)\]\}\'\s*/', '', $this->get(self::CATALOG));
        $data = json_decode((string) $body, true);

        if (!\is_array($data) || !\is_array($data['familyMetadataList'] ?? null)) {
            throw self::unreadable();
        }

        return $data;
    }

    /**
     * The CSS with the @font-face rules of a family, e.g. for
     * "Inter:ital,wght@0,100..900;1,100..900".
     *
     * @throws ConflictException
     */
    public function css(string $family): string
    {
        return $this->get(self::CSS . '?family=' . str_replace('%20', '+', rawurlencode($family)) . '&display=swap');
    }

    /**
     * A font file, only from fonts.gstatic.com.
     *
     * @throws ConflictException
     */
    public function file(string $url): string
    {
        $parts = parse_url($url);

        if (!\is_array($parts) || 'https' !== ($parts['scheme'] ?? null) || self::FILES !== ($parts['host'] ?? null)) {
            throw new ConflictException('Google Fonts names a file outside of fonts.gstatic.com. Nothing was imported.');
        }

        return $this->get($url);
    }

    /**
     * @throws ConflictException
     */
    private function get(string $url): string
    {
        try {
            $response = $this->client->request('GET', $url, ['headers' => ['User-Agent' => self::AGENT]]);

            if (200 !== $response->getStatusCode()) {
                throw self::unreadable();
            }

            return $response->getContent();
        } catch (ExceptionInterface) {
            throw new ConflictException('Google Fonts cannot be reached. Try it again later.');
        }
    }

    private static function unreadable(): ConflictException
    {
        return new ConflictException('Google Fonts answered in a way this module does not know. Perhaps the catalog moved; an update of the module will help.');
    }
}
