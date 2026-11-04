<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3;

use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\Storage\StorageDriver;

/**
 * Stores in S3-compatible buckets (decision 0268): set STORAGE_DSN or
 * PUBLIC_STORAGE_DSN in the .env to s3://….
 */
final class StorageS3Extension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->add(StorageDriver::class, new StorageDriver('s3', S3Stores::class));
    }
}
