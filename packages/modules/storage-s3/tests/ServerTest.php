<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3\Tests;

use Frootbox\Core\Storage\Dsn;
use Frootbox\Core\Storage\FileInfo;
use Frootbox\Core\Storage\LocalStore;
use Frootbox\Core\Storage\StoreRole;
use Frootbox\StorageS3\S3Client;
use Frootbox\StorageS3\S3Store;
use Frootbox\StorageS3\S3Stores;
use Frootbox\StorageS3\Signer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpClient\HttpClient;

/**
 * Against a real S3-compatible server that checks the signatures, only
 * if one is given, e.g. the Versity S3 Gateway in Docker:
 *
 *     docker run -d --rm -p 127.0.0.1:9177:7070 -e ROOT_ACCESS_KEY=frootbox -e ROOT_SECRET_KEY=frootbox-secret versity/versitygw posix /tmp
 *     FROOTBOX_S3_TEST_ENDPOINT=http://frootbox:frootbox-secret@127.0.0.1:9177 vendor/bin/phpunit --testsuite storage-s3
 *
 * @internal
 */
#[CoversClass(S3Store::class)]
#[CoversClass(S3Client::class)]
#[CoversClass(Signer::class)]
final class ServerTest extends TestCase
{
    private string $cache;

    private string $endpoint;

    private string $data;

    private string $media;

    protected function setUp(): void
    {
        $endpoint = getenv('FROOTBOX_S3_TEST_ENDPOINT');

        if (!\is_string($endpoint) || '' === $endpoint) {
            self::markTestSkipped('Set FROOTBOX_S3_TEST_ENDPOINT to test against a server.');
        }

        $this->endpoint = $endpoint;
        $this->cache = sys_get_temp_dir() . '/frootbox-s3-' . bin2hex(random_bytes(4));
        $this->data = 'daten-' . bin2hex(random_bytes(4));
        $this->media = 'medien-' . bin2hex(random_bytes(4));
        $this->createBucket($this->data);
        $this->createBucket($this->media);
    }

    protected function tearDown(): void
    {
        if (isset($this->cache)) {
            new LocalStore($this->cache)->deletePrefix('storage/');
            new LocalStore($this->cache)->deletePrefix('public/');
            @rmdir($this->cache);
        }
    }

    public function testStoresReadsListsAndDeletes(): void
    {
        $store = $this->store(StoreRole::Storage, $this->data, 'prefix=kunde');
        $store->write('media/01J', 'das original', 'image/jpeg');
        $store->write('media/01J-a1b2c3d4', 'ersetzt');
        $store->write('private/forms/01K/lebenslauf.pdf', '%PDF-1.4 köln');

        self::assertTrue($store->exists('media/01J'));
        self::assertSame('das original', $store->read('media/01J'));
        self::assertSame('orig', (string) $store->readRange('media/01J', 4, 4));
        self::assertSame(12, $store->info('media/01J')->size ?? null);
        self::assertNull($store->read('media/fehlt'));

        $paths = array_map(static fn(FileInfo $file): string => $file->path, [...$store->list('media/')]);
        sort($paths);
        self::assertSame(['media/01J', 'media/01J-a1b2c3d4'], $paths);

        $old = $store->info('media/01J')?->modified;
        $store->touch('media/01J');
        self::assertSame($old, $store->info('media/01J')?->modified, 'Just stored, nothing to do.');

        $store->deletePrefix('private/forms/01K/');
        self::assertFalse($store->exists('private/forms/01K/lebenslauf.pdf'));
        $store->delete('media/01J-a1b2c3d4');
        self::assertFalse($store->exists('media/01J-a1b2c3d4'));
    }

    public function testStoresALargeFileFromDiskAndFetchesItBack(): void
    {
        $store = $this->store(StoreRole::Storage, $this->data);
        $file = $store->stage('media/01V');
        file_put_contents($file, random_bytes(6 * 1024 * 1024));
        $hash = hash_file('sha256', $file);

        $store->commit('media/01V', 'video/mp4', keepLocal: false);
        self::assertFileDoesNotExist($file);
        self::assertSame(6 * 1024 * 1024, $store->info('media/01V')?->size);
        self::assertSame($hash, hash_file('sha256', $store->localPath('media/01V')));
    }

    public function testCopiesFromTheBucketForDataToThePublicOne(): void
    {
        $data = $this->store(StoreRole::Storage, $this->data);
        $public = $this->store(StoreRole::Public, $this->media);
        $data->write('media/01D', 'ein dokument');

        $public->copyFrom($data, 'media/01D', 'media/01D/1/preisliste-main-abc.pdf', 'application/pdf');

        self::assertSame('ein dokument', $public->read('media/01D/1/preisliste-main-abc.pdf'));
        $headers = HttpClient::create()->request('HEAD', $this->signedUrl($this->media, 'media/01D/1/preisliste-main-abc.pdf'), ['headers' => $this->signedHeaders('HEAD', $this->media, 'media/01D/1/preisliste-main-abc.pdf')])->getHeaders(false);
        self::assertSame('application/pdf', $headers['content-type'][0] ?? null);
        self::assertSame(S3Store::IMMUTABLE, $headers['cache-control'][0] ?? null);
    }

    private function store(StoreRole $role, string $bucket, string $options = ''): S3Store
    {
        $parts = (array) parse_url($this->endpoint);
        $dsn = \sprintf(
            's3://%s:%s@%s:%d/%s?path_style=1&scheme=%s%s',
            $parts['user'] ?? '',
            $parts['pass'] ?? '',
            $parts['host'] ?? '',
            $parts['port'] ?? 80,
            $bucket,
            $parts['scheme'] ?? 'http',
            '' === $options ? '' : '&' . $options,
        );
        $store = new S3Stores()->create(Dsn::parse($dsn), $role, $this->cache . '/' . $role->value);
        self::assertInstanceOf(S3Store::class, $store);

        return $store;
    }

    private function createBucket(string $bucket): void
    {
        $response = HttpClient::create()->request('PUT', $this->signedUrl($bucket, ''), ['headers' => $this->signedHeaders('PUT', $bucket, '')]);

        self::assertSame(200, $response->getStatusCode(), $response->getContent(false));
    }

    private function signedUrl(string $bucket, string $key): string
    {
        $parts = (array) parse_url($this->endpoint);

        return ($parts['scheme'] ?? 'http') . '://' . ($parts['host'] ?? '') . ':' . ($parts['port'] ?? 80) . '/' . $bucket . ('' === $key ? '' : '/' . Signer::encodePath($key));
    }

    /**
     * @return array<string, string>
     */
    private function signedHeaders(string $method, string $bucket, string $key): array
    {
        $parts = (array) parse_url($this->endpoint);
        $signed = new Signer($parts['user'] ?? '', $parts['pass'] ?? '', 'us-east-1')
            ->sign($method, ($parts['host'] ?? '') . ':' . ($parts['port'] ?? 80), '/' . $bucket . ('' === $key ? '' : '/' . Signer::encodePath($key)), [], [], Signer::EMPTY_HASH);
        unset($signed['host']);

        return $signed;
    }
}
