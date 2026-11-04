<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3;

use Frootbox\Core\Storage\FileInfo;
use Frootbox\Core\Storage\StorageException;
use SensitiveParameter;
use SimpleXMLElement;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

/**
 * The few requests of S3 the stores need (decision 0268): PutObject,
 * GetObject with Range, HeadObject, DeleteObject, ListObjectsV2 and
 * CopyObject, signed after SigV4. Works with any S3-compatible service;
 * with path style the bucket is part of the path instead of the host.
 */
final readonly class S3Client
{
    private Signer $signer;

    private HttpClientInterface $http;

    public function __construct(
        public string $endpoint,
        public string $bucket,
        public string $key,
        #[SensitiveParameter]
        private string $secret,
        string $region = 'us-east-1',
        private bool $pathStyle = false,
        ?HttpClientInterface $http = null,
    ) {
        $this->signer = new Signer($key, $secret, $region);
        $this->http = $http ?? HttpClient::create(['timeout' => 30]);
    }

    /**
     * The address of an object, e.g. "https://kunde-medien.fsn1.your-objectstorage.com/media/01J…".
     */
    public function url(string $key): string
    {
        return $this->base() . '/' . Signer::encodePath($key);
    }

    /**
     * Whether a copy between the two buckets works without a detour.
     */
    public function sameAccount(self $other): bool
    {
        return $this->endpoint === $other->endpoint && $this->key === $other->key && $this->secret === $other->secret;
    }

    /**
     * @param string|resource       $body
     * @param array<string, string> $headers e.g. content-type, cache-control
     */
    public function put(string $key, mixed $body, int $length, string $hash, array $headers = []): void
    {
        $response = $this->send('PUT', $key, [], ['content-length' => (string) $length, ...$headers], $hash, $body);
        $this->expect($response, 'store', $key);
    }

    /**
     * A response that is read as it comes, null if there is no such object.
     */
    public function get(string $key, ?string $range = null): ?ResponseInterface
    {
        $response = $this->send('GET', $key, [], null === $range ? [] : ['range' => $range], buffer: false);

        try {
            $status = $response->getStatusCode();
        } catch (ExceptionInterface $error) {
            throw new StorageException(\sprintf('Could not read %s: %s', $key, $error->getMessage()), 0, $error);
        }

        if (404 === $status) {
            return null;
        }

        $this->expect($response, 'read', $key);

        return $response;
    }

    public function head(string $key): ?FileInfo
    {
        $response = $this->send('HEAD', $key);

        try {
            if (404 === $response->getStatusCode()) {
                return null;
            }

            $this->expect($response, 'look at', $key);
            $headers = $response->getHeaders(false);
        } catch (ExceptionInterface $error) {
            throw new StorageException(\sprintf('Could not look at %s: %s', $key, $error->getMessage()), 0, $error);
        }

        $modified = strtotime($headers['last-modified'][0] ?? '');

        return new FileInfo($key, (int) ($headers['content-length'][0] ?? 0), false === $modified ? 0 : $modified);
    }

    public function delete(string $key): void
    {
        $response = $this->send('DELETE', $key);

        try {
            if (404 !== $response->getStatusCode()) {
                $this->expect($response, 'delete', $key);
            }
        } catch (ExceptionInterface $error) {
            throw new StorageException(\sprintf('Could not delete %s: %s', $key, $error->getMessage()), 0, $error);
        }
    }

    /**
     * Copies an object, also onto itself with new headers, e.g. for a new
     * time of the last change.
     *
     * @param array<string, string> $headers Replace those of the source
     */
    public function copy(string $sourceBucket, string $sourceKey, string $key, array $headers = []): void
    {
        $response = $this->send('PUT', $key, [], [
            'x-amz-copy-source' => '/' . $sourceBucket . '/' . Signer::encodePath($sourceKey),
            'x-amz-metadata-directive' => 'REPLACE',
            ...$headers,
        ]);
        $this->expect($response, 'copy', $sourceKey);

        // S3 may answer 200 and still have failed.
        try {
            $body = $response->getContent(false);
        } catch (ExceptionInterface $error) {
            throw new StorageException(\sprintf('Could not copy %s: %s', $sourceKey, $error->getMessage()), 0, $error);
        }

        if (str_contains($body, '<Error>')) {
            throw new StorageException(\sprintf('Could not copy %s: %s', $sourceKey, self::error($body)));
        }
    }

    /**
     * All objects below a prefix, page by page.
     *
     * @return iterable<FileInfo>
     */
    public function list(string $prefix): iterable
    {
        $token = null;

        do {
            $query = ['list-type' => '2', 'prefix' => $prefix, ...(null === $token ? [] : ['continuation-token' => $token])];
            $response = $this->send('GET', '', $query);
            $this->expect($response, 'list', $prefix);

            try {
                $xml = new SimpleXMLElement($response->getContent());
            } catch (\Throwable $error) {
                throw new StorageException(\sprintf('Could not list %s: %s', $prefix, $error->getMessage()), 0, $error);
            }

            foreach ($xml->Contents as $object) {
                $modified = strtotime((string) $object->LastModified);

                yield new FileInfo((string) $object->Key, (int) $object->Size, false === $modified ? 0 : $modified);
            }

            $token = 'true' === (string) $xml->IsTruncated ? (string) $xml->NextContinuationToken : null;
        } while (null !== $token && '' !== $token);
    }

    /**
     * @param array<string, string> $query
     * @param array<string, string> $headers
     * @param string|resource|null  $body
     */
    private function send(string $method, string $key, array $query = [], array $headers = [], string $hash = Signer::EMPTY_HASH, mixed $body = null, bool $buffer = true): ResponseInterface
    {
        $parts = parse_url($this->base());
        $host = ($parts['host'] ?? '') . (isset($parts['port']) ? ':' . $parts['port'] : '');
        $path = ($parts['path'] ?? '') . '/' . Signer::encodePath($key);
        $signed = $this->signer->sign($method, $host, $path, $query, $headers, $hash);
        unset($signed['host']);
        $url = ($parts['scheme'] ?? 'https') . '://' . $host . $path . ([] === $query ? '' : '?' . Signer::query($query));

        try {
            return $this->http->request($method, $url, ['headers' => $signed, 'body' => $body ?? '', 'buffer' => $buffer]);
        } catch (ExceptionInterface $error) {
            throw new StorageException(\sprintf('Could not reach %s: %s', $this->endpoint, $error->getMessage()), 0, $error);
        }
    }

    private function expect(ResponseInterface $response, string $doing, string $key): void
    {
        try {
            $status = $response->getStatusCode();

            if ($status >= 200 && $status < 300) {
                return;
            }

            $body = 'HEAD' === ($response->getInfo('http_method') ?? '') ? '' : $response->getContent(false);
        } catch (ExceptionInterface $error) {
            throw new StorageException(\sprintf('Could not %s %s: %s', $doing, $key, $error->getMessage()), 0, $error);
        }

        throw new StorageException(\sprintf('Could not %s %s in %s: %d %s', $doing, $key, $this->bucket, $status, self::error($body)));
    }

    private static function error(string $body): string
    {
        if (1 === preg_match('~<Code>([^<]*)</Code>~', $body, $code)) {
            return $code[1] . (1 === preg_match('~<Message>([^<]*)</Message>~', $body, $message) ? ': ' . $message[1] : '');
        }

        return '';
    }

    private function base(): string
    {
        $endpoint = rtrim($this->endpoint, '/');

        if ($this->pathStyle) {
            return $endpoint . '/' . rawurlencode($this->bucket);
        }

        return (string) preg_replace('~^(https?://)~', '$1' . $this->bucket . '.', $endpoint);
    }
}
