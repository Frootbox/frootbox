<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\ConstantNameRule;
use Frootbox\Tools\PHPStan\Naming;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<ConstantNameRule>
 */
#[CoversClass(ConstantNameRule::class)]
#[CoversClass(Naming::class)]
final class ConstantNameRuleTest extends RuleTestCase
{
    public function testReportsWrongNames(): void
    {
        $this->analyse([__DIR__ . '/data/naming.php'], [
            ['Constant "maxLength" must be UPPER_SNAKE_CASE, e.g. "MAX_LENGTH".', 13],
        ]);
    }

    protected function getRule(): Rule
    {
        return new ConstantNameRule();
    }
}
