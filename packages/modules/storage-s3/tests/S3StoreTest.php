<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3\Tests;

use Frootbox\Core\Storage\Dsn;
use Frootbox\Core\Storage\FileInfo;
use Frootbox\Core\Storage\LocalStore;
use Frootbox\Core\Storage\StorageException;
use Frootbox\Core\Storage\StoreRole;
use Frootbox\StorageS3\S3Client;
use Frootbox\StorageS3\S3Store;
use Frootbox\StorageS3\S3Stores;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/**
 * The requests a store sends, without a server.
 *
 * @internal
 */
#[CoversClass(S3Store::class)]
#[CoversClass(S3Stores::class)]
#[CoversClass(S3Client::class)]
final class S3StoreTest extends TestCase
{
    /** @var list<array{method: string, url: string, headers: array<string, string>, body: string}> */
    private array $requests = [];

    /** @var list<MockResponse> */
    private array $responses = [];

    private string $cache;

    protected function setUp(): void
    {
        $this->cache = sys_get_temp_dir() . '/frootbox-s3-' . bin2hex(random_bytes(4));
    }

    protected function tearDown(): void
    {
        new LocalStore($this->cache)->deletePrefix('media/');
        @rmdir($this->cache);
    }

    public function testThePublicStoreHasAnAddressAndLongCaching(): void
    {
        $store = $this->store(StoreRole::Public, 's3://key:secret@fsn1.your-objectstorage.com/kunde-medien?region=fsn1&url=https://medien.kunde.de/&acl=public-read');
        $this->responses[] = new MockResponse('', ['http_code' => 200]);

        $store->write('media/01J/1/hafen-640x0-abc.webp', 'bytes', 'image/webp');

        self::assertSame('https://medien.kunde.de/media/01J/1/hafen-640x0-abc.webp', $store->url('media/01J/1/hafen-640x0-abc.webp'));
        self::assertSame('PUT', $this->requests[0]['method']);
        self::assertSame('https://kunde-medien.fsn1.your-objectstorage.com/media/01J/1/hafen-640x0-abc.webp', $this->requests[0]['url']);
        self::assertSame('image/webp', $this->requests[0]['headers']['content-type']);
        self::assertSame(S3Store::IMMUTABLE, $this->requests[0]['headers']['cache-control']);
        self::assertSame('public-read', $this->requests[0]['headers']['x-amz-acl']);
        self::assertSame(hash('sha256', 'bytes'), $this->requests[0]['headers']['x-amz-content-sha256']);
        self::assertStringContainsString('/fsn1/s3/aws4_request', $this->requests[0]['headers']['authorization']);
        self::assertSame('bytes', $this->requests[0]['body']);
    }

    public function testTheStoreForDataHasNoAddressAndNoAcl(): void
    {
        $store = $this->store(StoreRole::Storage, 's3://key:secret@minio.test:9000/daten?path_style=1&scheme=http&prefix=kunde&acl=public-read&url=https://x.example');
        $this->responses[] = new MockResponse('', ['http_code' => 200]);

        $store->write('media/01J', 'original');

        self::assertNull($store->url('media/01J'), 'Never public.');
        self::assertSame('http://minio.test:9000/daten/kunde/media/01J', $this->requests[0]['url'], 'Bucket in the path, prefix before the key.');
        self::assertArrayNotHasKey('x-amz-acl', $this->requests[0]['headers']);
        self::assertArrayNotHasKey('cache-control', $this->requests[0]['headers']);
        self::assertSame('s3://daten/kunde', $store->name());
    }

    public function testListsPageByPageWithoutThePrefix(): void
    {
        $store = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten?prefix=kunde');
        $this->responses[] = new MockResponse(self::listing(['kunde/media/a' => 3], 'weiter'));
        $this->responses[] = new MockResponse(self::listing(['kunde/media/b' => 5]));

        $files = [...$store->list('media/')];

        self::assertSame(['media/a', 'media/b'], array_map(static fn(FileInfo $file): string => $file->path, $files));
        self::assertSame([3, 5], array_map(static fn(FileInfo $file): int => $file->size, $files));
        self::assertSame(strtotime('2026-11-01T10:00:00Z'), $files[0]->modified);
        self::assertStringContainsString('list-type=2&prefix=kunde%2Fmedia%2F', $this->requests[0]['url']);
        self::assertStringContainsString('continuation-token=weiter', $this->requests[1]['url']);
    }

    public function testCopiesWithinTheAccountWithoutADetour(): void
    {
        $this->responses[] = new MockResponse('<CopyObjectResult/>');
        $data = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten');
        $public = $this->store(StoreRole::Public, 's3://key:secret@s3.example/medien');

        $public->copyFrom($data, 'media/01J', 'media/01J/1/film-main-abc.mp4', 'video/mp4');

        self::assertSame('PUT', $this->requests[0]['method']);
        self::assertSame('https://medien.s3.example/media/01J/1/film-main-abc.mp4', $this->requests[0]['url']);
        self::assertSame('/daten/media/01J', $this->requests[0]['headers']['x-amz-copy-source']);
        self::assertSame('REPLACE', $this->requests[0]['headers']['x-amz-metadata-directive']);
        self::assertSame('video/mp4', $this->requests[0]['headers']['content-type']);
        self::assertSame('https://medien.s3.example/media/x', $public->url('media/x'), 'Without url= the address of the bucket.');
    }

    public function testACopyThatFailedDespite200IsAnError(): void
    {
        $this->responses[] = new MockResponse('<Error><Code>InternalError</Code><Message>Try again</Message></Error>');
        $data = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten');
        $public = $this->store(StoreRole::Public, 's3://key:secret@s3.example/medien');

        $this->expectException(StorageException::class);
        $this->expectExceptionMessage('InternalError: Try again');
        $public->copyFrom($data, 'media/01J', 'media/01J/1/a.pdf');
    }

    public function testKeepsACopyOnDiskAndFetchesItOnce(): void
    {
        $store = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten');
        $this->responses[] = new MockResponse('das original');

        $first = $store->localPath('media/01J');
        $second = $store->localPath('media/01J');

        self::assertSame($first, $second);
        self::assertSame('das original', file_get_contents($first));
        self::assertCount(1, $this->requests, 'An original never changes.');
    }

    public function testStoresTheFileAgainIfACopyOntoItselfKeepsTheTime(): void
    {
        $store = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten');
        $old = ['http_code' => 200, 'response_headers' => ['Last-Modified' => gmdate('D, d M Y H:i:s', time() - 40 * 86400) . ' GMT', 'Content-Length' => '3']];
        $this->responses = [new MockResponse('', $old), new MockResponse('<CopyObjectResult/>'), new MockResponse('', $old), new MockResponse('alt'), new MockResponse('')];

        $store->touch('media/01J');

        self::assertSame(['HEAD', 'PUT', 'HEAD', 'GET', 'PUT'], array_column($this->requests, 'method'));
        self::assertArrayHasKey('x-amz-copy-source', $this->requests[1]['headers']);
        self::assertSame('alt', $this->requests[4]['body']);
    }

    public function testAMissingFileIsNoError(): void
    {
        $store = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten');
        $this->responses = [new MockResponse('', ['http_code' => 404]), new MockResponse('', ['http_code' => 404]), new MockResponse('', ['http_code' => 404])];

        self::assertNull($store->read('media/fehlt'));
        self::assertFalse($store->exists('media/fehlt'));
        self::assertFileDoesNotExist($store->localPath('media/fehlt'));
    }

    public function testNamesTheErrorOfTheService(): void
    {
        $store = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten');
        $this->responses[] = new MockResponse('<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>', ['http_code' => 403]);

        $this->expectExceptionMessage('Could not store media/01J in daten: 403 AccessDenied: Access Denied');
        $store->write('media/01J', 'x');
    }

    public function testReadsARange(): void
    {
        $store = $this->store(StoreRole::Storage, 's3://key:secret@s3.example/daten');
        $this->responses[] = new MockResponse('2345', ['http_code' => 206]);

        self::assertSame('2345', (string) $store->readRange('media/01J', 2, 4));
        self::assertSame('bytes=2-5', $this->requests[0]['headers']['range']);
    }

    public function testRefusesAnIncompleteDsn(): void
    {
        $this->expectExceptionMessage('STORAGE_DSN needs key, secret, host and bucket');

        new S3Stores()->create(Dsn::parse('s3://s3.example/daten'), StoreRole::Storage, $this->cache);
    }

    private function store(StoreRole $role, string $dsn): S3Store
    {
        $http = new MockHttpClient(function (string $method, string $url, array $options): MockResponse {
            $headers = [];
            $lines = $options['headers'] ?? [];

            foreach (\is_array($lines) ? $lines : [] as $line) {
                [$name, $value] = explode(': ', \is_string($line) ? $line : '', 2) + ['', ''];
                $headers[strtolower($name)] = $value;
            }

            $body = $options['body'] ?? '';

            if (\is_resource($body)) {
                $body = (string) stream_get_contents($body);
            }

            if (\is_callable($body)) {
                $chunks = '';

                while (\is_string($chunk = $body(16384)) && '' !== $chunk) {
                    $chunks .= $chunk;
                }

                $body = $chunks;
            }

            $this->requests[] = ['method' => $method, 'url' => $url, 'headers' => $headers, 'body' => \is_string($body) ? $body : ''];

            return array_shift($this->responses) ?? new MockResponse('', ['http_code' => 500]);
        });

        $store = new S3Stores($http)->create(Dsn::parse($dsn), $role, $this->cache);
        self::assertInstanceOf(S3Store::class, $store);

        return $store;
    }

    /**
     * @param array<string, int> $objects
     */
    private static function listing(array $objects, ?string $next = null): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?><ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">';

        foreach ($objects as $key => $size) {
            $xml .= '<Contents><Key>' . $key . '</Key><LastModified>2026-11-01T10:00:00.000Z</LastModified><Size>' . $size . '</Size></Contents>';
        }

        return $xml . '<IsTruncated>' . (null === $next ? 'false' : 'true') . '</IsTruncated>' . (null === $next ? '' : '<NextContinuationToken>' . $next . '</NextContinuationToken>') . '</ListBucketResult>';
    }
}
