<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests;

use Frootbox\Tools\PHPStan\FunctionNameRule;
use Frootbox\Tools\PHPStan\Naming;
use PHPStan\Rules\Rule;
use PHPStan\Testing\RuleTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @extends RuleTestCase<FunctionNameRule>
 */
#[CoversClass(FunctionNameRule::class)]
#[CoversClass(Naming::class)]
final class FunctionNameRuleTest extends RuleTestCase
{
    public function testReportsWrongNames(): void
    {
        $this->analyse([__DIR__ . '/data/naming.php'], [
            ['Method "Find_by_slug" must be camelCase, e.g. "findBySlug".', 25],
            ['Function "render_page" must be camelCase, e.g. "findBySlug".', 45],
        ]);
    }

    protected function getRule(): Rule
    {
        return new FunctionNameRule();
    }
}
