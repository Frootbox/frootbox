<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3;

use Frootbox\Core\Storage\FileInfo;
use Frootbox\Core\Storage\FileStore;
use Frootbox\Core\Storage\StorageException;
use Frootbox\Core\Storage\StorePath;
use Nyholm\Psr7\Stream;
use Psr\Http\Message\StreamInterface;
use Symfony\Component\HttpClient\Response\StreamWrapper;
use Symfony\Contracts\HttpClient\ResponseInterface;

/**
 * A store in an S3-compatible bucket (decision 0268). Copies on disk lie
 * below var/storage/<role>/; the core uses them only for originals,
 * which never change. A public store has an address for browsers and
 * gives its files a long Cache-Control.
 */
final readonly class S3Store implements FileStore
{
    public const string IMMUTABLE = 'public, max-age=31536000, immutable';

    /**
     * @param string      $prefix    Before every key, e.g. "kunde/", for several websites in one bucket
     * @param string|null $publicUrl The address of the bucket for browsers, null for a private store
     * @param string|null $acl       e.g. "public-read" for services without a public bucket
     */
    public function __construct(
        private S3Client $client,
        private string $cache,
        private string $prefix = '',
        private ?string $publicUrl = null,
        private ?string $acl = null,
    ) {}

    public function name(): string
    {
        return 's3://' . $this->client->bucket . ('' === $this->prefix ? '' : '/' . rtrim($this->prefix, '/'));
    }

    public function info(string $path): ?FileInfo
    {
        $info = $this->client->head($this->key($path));

        return null === $info ? null : new FileInfo(StorePath::clean($path), $info->size, $info->modified);
    }

    public function exists(string $path): bool
    {
        return null !== $this->client->head($this->key($path));
    }

    public function read(string $path): ?string
    {
        $response = $this->client->get($this->key($path));

        try {
            return $response?->getContent();
        } catch (\Throwable $error) {
            throw new StorageException(\sprintf('Could not read %s: %s', $path, $error->getMessage()), 0, $error);
        }
    }

    public function readRange(string $path, int $start = 0, ?int $length = null): StreamInterface
    {
        if (0 === $length) {
            return Stream::create('');
        }

        $range = 0 === $start && null === $length ? null : 'bytes=' . $start . '-' . (null === $length ? '' : $start + $length - 1);
        $response = $this->client->get($this->key($path), $range) ?? throw new StorageException(\sprintf('There is no file %s in %s.', $path, $this->name()));

        return Stream::create(StreamWrapper::createResource($response));
    }

    public function write(string $path, string $contents, ?string $type = null): void
    {
        $this->client->put($this->key($path), $contents, \strlen($contents), hash('sha256', $contents), $this->headers($type));
    }

    public function writeFile(string $path, string $file, ?string $type = null, bool $move = false): void
    {
        $this->upload($path, $file, $type);

        if ($move) {
            @unlink($file);
        }
    }

    public function copyFrom(FileStore $source, string $from, string $to, ?string $type = null): void
    {
        if ($source instanceof self && $source->client->sameAccount($this->client)) {
            $this->client->copy($source->client->bucket, $source->key($from), $this->key($to), $this->headers($type));

            return;
        }

        $file = $source->localPath($from);

        if (!is_file($file)) {
            throw new StorageException(\sprintf('There is no file %s in %s.', $from, $source->name()));
        }

        $this->upload($to, $file, $type);
    }

    public function delete(string $path): void
    {
        $this->client->delete($this->key($path));
        $copy = $this->copy($path);

        if (is_file($copy)) {
            @unlink($copy);
        }
    }

    public function deletePrefix(string $prefix): void
    {
        if ('' === StorePath::clean($prefix)) {
            return;
        }

        foreach ([...$this->list($prefix)] as $file) {
            $this->delete($file->path);
        }
    }

    public function list(string $prefix): iterable
    {
        foreach ($this->client->list($this->key($prefix)) as $file) {
            yield new FileInfo(substr($file->path, \strlen($this->prefix)), $file->size, $file->modified);
        }
    }

    /**
     * A copy onto itself gives a new time on AWS, not on every service;
     * then the file is stored again. Only for releasing an original, so
     * seldom (decision 0268).
     */
    public function touch(string $path): void
    {
        $key = $this->key($path);
        $before = $this->client->head($key);

        if (null === $before || $before->modified >= time() - 60) {
            return;
        }

        $this->client->copy($this->client->bucket, $key, $key, $this->headers(null));
        $after = $this->client->head($key);

        if (null !== $after && $after->modified <= $before->modified) {
            $this->upload($path, $this->localPath($path), null);
        }
    }

    public function url(string $path): ?string
    {
        return null === $this->publicUrl ? null : rtrim($this->publicUrl, '/') . '/' . Signer::encodePath(StorePath::clean($path));
    }

    public function localPath(string $path): string
    {
        $copy = $this->copy($path);

        if (is_file($copy)) {
            @touch($copy);

            return $copy;
        }

        $response = $this->client->get($this->key($path));

        if (null === $response) {
            return $copy;
        }

        $this->folder($copy);
        $temporary = $copy . '.' . bin2hex(random_bytes(4));
        $handle = @fopen($temporary, 'wb');

        if (false === $handle) {
            throw new StorageException(\sprintf('Could not write a copy of %s to %s.', $path, $this->cache));
        }

        try {
            foreach ($this->clientStream($response) as $chunk) {
                fwrite($handle, $chunk);
            }
        } finally {
            fclose($handle);
        }

        if (!@rename($temporary, $copy)) {
            @unlink($temporary);
        }

        return $copy;
    }

    public function stage(string $path): string
    {
        $copy = $this->copy($path);
        $this->folder($copy);

        return $copy;
    }

    public function commit(string $path, ?string $type = null, bool $keepLocal = true): void
    {
        $copy = $this->copy($path);

        if (!is_file($copy)) {
            throw new StorageException(\sprintf('There is no file %s to store in %s.', $path, $this->name()));
        }

        $this->upload($path, $copy, $type);

        if (!$keepLocal) {
            @unlink($copy);
        }
    }

    private function upload(string $path, string $file, ?string $type): void
    {
        $handle = @fopen($file, 'rb');
        $hash = hash_file('sha256', $file);

        if (false === $handle || false === $hash) {
            throw new StorageException(\sprintf('Could not read %s.', $file));
        }

        try {
            $this->client->put($this->key($path), $handle, (int) filesize($file), $hash, $this->headers($type));
        } finally {
            if (\is_resource($handle)) {
                fclose($handle);
            }
        }
    }

    /**
     * @return array<string, string>
     */
    private function headers(?string $type): array
    {
        return [
            ...(null === $type ? [] : ['content-type' => $type]),
            ...(null === $this->publicUrl ? [] : ['cache-control' => self::IMMUTABLE]),
            ...(null === $this->acl ? [] : ['x-amz-acl' => $this->acl]),
        ];
    }

    /**
     * @return iterable<string>
     */
    private function clientStream(ResponseInterface $response): iterable
    {
        $resource = StreamWrapper::createResource($response);

        while (!feof($resource)) {
            $chunk = fread($resource, 1 << 20);

            if (false === $chunk) {
                throw new StorageException('The bucket stopped sending.');
            }

            yield $chunk;
        }

        fclose($resource);
    }

    private function key(string $path): string
    {
        return $this->prefix . StorePath::clean($path);
    }

    private function copy(string $path): string
    {
        return $this->cache . '/' . StorePath::clean($path);
    }

    private function folder(string $file): void
    {
        $folder = \dirname($file);

        if (!is_dir($folder) && !@mkdir($folder, 0o775, true) && !is_dir($folder)) {
            throw new StorageException(\sprintf('Could not create %s.', $folder));
        }
    }
}
