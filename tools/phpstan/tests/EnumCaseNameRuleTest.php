<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\EnumCaseNameRule;
use Frootbox\Tools\PHPStan\Naming;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<EnumCaseNameRule>
 */
#[CoversClass(EnumCaseNameRule::class)]
#[CoversClass(Naming::class)]
final class EnumCaseNameRuleTest extends RuleTestCase
{
    public function testReportsWrongNames(): void
    {
        $this->analyse([__DIR__ . '/data/naming.php'], [
            ['Enum case "draft" must be PascalCase, e.g. "Draft".', 38],
            ['Enum case "IN_REVIEW" must be PascalCase, e.g. "Draft".', 40],
        ]);
    }

    protected function getRule(): Rule
    {
        return new EnumCaseNameRule();
    }
}
