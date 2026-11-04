<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\Tests;

use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;

/**
 * documentation/reference/ is written from the code of every package
 * (decision 0265). Run `composer reference` when this fails.
 */
#[CoversNothing]
final class ReferenceTest extends TestCase
{
    public function testTheReferenceIsUpToDate(): void
    {
        exec(escapeshellarg(\PHP_BINARY) . ' ' . escapeshellarg(\dirname(__DIR__) . '/reference.php') . ' --check 2>&1', $output, $status);

        self::assertSame(0, $status, implode("\n", $output) . "\nRun composer reference.");
    }
}
