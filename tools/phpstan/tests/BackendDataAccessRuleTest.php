<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\BackendDataAccessRule;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<BackendDataAccessRule>
 */
#[CoversClass(BackendDataAccessRule::class)]
final class BackendDataAccessRuleTest extends RuleTestCase
{
    public function testReportsDataAccessInTheBackendOnly(): void
    {
        $this->analyse([__DIR__ . '/data/backend.php'], [
            ['The backend is only a user interface (decision 0114): use a query or an action instead of Frootbox\Core\Page\Pages.', 16],
            ['The backend is only a user interface (decision 0114): use a query or an action instead of Frootbox\Database\Writer.', 17],
            ['The backend is only a user interface (decision 0114): use a query or an action instead of Doctrine\DBAL\Connection.', 18],
        ]);
    }

    protected function getRule(): Rule
    {
        return new BackendDataAccessRule(self::createReflectionProvider());
    }
}
