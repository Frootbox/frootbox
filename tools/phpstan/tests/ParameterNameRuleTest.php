<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\Naming;
use Frootbox\Tools\PHPStan\ParameterNameRule;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<ParameterNameRule>
 */
#[CoversClass(ParameterNameRule::class)]
#[CoversClass(Naming::class)]
final class ParameterNameRuleTest extends RuleTestCase
{
    public function testReportsWrongNames(): void
    {
        $this->analyse([__DIR__ . '/data/naming.php'], [
            ['Parameter "$first_name" must be camelCase, e.g. "$userId".', 23],
            ['Parameter "$Slug" must be camelCase, e.g. "$userId".', 25],
        ]);
    }

    protected function getRule(): Rule
    {
        return new ParameterNameRule();
    }
}
