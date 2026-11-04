<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3;

use Frootbox\Core\Storage\Dsn;
use Frootbox\Core\Storage\FileStore;
use Frootbox\Core\Storage\StorageException;
use Frootbox\Core\Storage\StoreFactory;
use Frootbox\Core\Storage\StoreRole;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Makes a store from a DSN like (decision 0268)
 *
 *     s3://<key>:<secret>@fsn1.your-objectstorage.com/<bucket>?region=fsn1
 *
 * Options: region (default us-east-1), path_style=1 (bucket in the path,
 * e.g. MinIO), scheme=http (only for a local test server), prefix= (for
 * several websites in one bucket), and for the public store url= (the
 * address for browsers, default the address of the bucket) and acl=.
 */
final readonly class S3Stores implements StoreFactory
{
    public function __construct(private ?HttpClientInterface $http = null) {}

    public function create(Dsn $dsn, StoreRole $role, string $cache): FileStore
    {
        if ('' === $dsn->host || '' === $dsn->path || '' === $dsn->user || '' === $dsn->password) {
            throw new StorageException(\sprintf('%s needs key, secret, host and bucket: s3://<key>:<secret>@<host>/<bucket>, not %s.', $role->variable(), $dsn->safe()));
        }

        $scheme = 'http' === $dsn->option('scheme') ? 'http' : 'https';
        $client = new S3Client(
            $scheme . '://' . $dsn->host . (null === $dsn->port ? '' : ':' . $dsn->port),
            $dsn->path,
            $dsn->user,
            $dsn->password,
            $dsn->option('region', 'us-east-1'),
            $dsn->flag('path_style'),
            $this->http,
        );
        $prefix = trim($dsn->option('prefix'), '/');
        $prefix = '' === $prefix ? '' : $prefix . '/';
        $public = StoreRole::Public === $role;
        $url = '' === $dsn->option('url') ? $client->url(rtrim($prefix, '/')) : $dsn->option('url');
        $acl = $dsn->option('acl');

        return new S3Store($client, $cache, $prefix, $public ? rtrim($url, '/') : null, $public && '' !== $acl ? $acl : null);
    }
}
