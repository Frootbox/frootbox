<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\ClassNameRule;
use Frootbox\Tools\PHPStan\Naming;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<ClassNameRule>
 */
#[CoversClass(ClassNameRule::class)]
#[CoversClass(Naming::class)]
final class ClassNameRuleTest extends RuleTestCase
{
    public function testReportsWrongNames(): void
    {
        $this->analyse([__DIR__ . '/data/naming.php'], [
            ['Class name "good_class" must be PascalCase, e.g. "PageLayout".', 11],
            ['Enum name "status" must be PascalCase, e.g. "PageLayout".', 36],
        ]);
    }

    protected function getRule(): Rule
    {
        return new ClassNameRule();
    }
}
