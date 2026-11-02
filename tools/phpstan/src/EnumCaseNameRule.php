<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Stmt\EnumCase;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Enum cases are PascalCase (PER Coding Style). Backing values are data
 * and stay free, e.g. 'draft'.
 *
 * @implements Rule<EnumCase>
 */
final class EnumCaseNameRule implements Rule
{
    public function getNodeType(): string
    {
        return EnumCase::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        $name = $node->name->toString();

        if (Naming::matches(Naming::PASCAL_CASE, $name)) {
            return [];
        }

        return [
            RuleErrorBuilder::message(\sprintf('Enum case "%s" must be PascalCase, e.g. "Draft".', $name))
                ->identifier('frootbox.naming.enumCase')
                ->build(),
        ];
    }
}
