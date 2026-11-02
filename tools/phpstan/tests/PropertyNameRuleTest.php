<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\Naming;
use Frootbox\Tools\PHPStan\PropertyNameRule;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<PropertyNameRule>
 */
#[CoversClass(PropertyNameRule::class)]
#[CoversClass(Naming::class)]
final class PropertyNameRuleTest extends RuleTestCase
{
    public function testReportsWrongNames(): void
    {
        $this->analyse([__DIR__ . '/data/naming.php'], [
            ['Property "$Count" must be camelCase, e.g. "$createdAt".', 17],
            ['Property "$total_count" must be camelCase, e.g. "$createdAt".', 19],
        ]);
    }

    protected function getRule(): Rule
    {
        return new PropertyNameRule();
    }
}
