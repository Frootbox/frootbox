<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\Naming;
use Frootbox\Tools\PHPStan\VariableNameRule;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<VariableNameRule>
 */
#[CoversClass(VariableNameRule::class)]
#[CoversClass(Naming::class)]
final class VariableNameRuleTest extends RuleTestCase
{
    public function testReportsWrongNames(): void
    {
        $this->analyse([__DIR__ . '/data/naming.php'], [
            ['Variable "$Slug" must be camelCase, e.g. "$userId".', 27],
            ['Variable "$page_title" must be camelCase, e.g. "$userId".', 27],
            ['Variable "$page_title" must be camelCase, e.g. "$userId".', 28],
        ]);
    }

    protected function getRule(): Rule
    {
        return new VariableNameRule();
    }
}
