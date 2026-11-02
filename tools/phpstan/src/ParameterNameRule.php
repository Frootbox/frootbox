<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Expr\Variable;
use PhpParser\Node\Param;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Parameters, including promoted properties, are camelCase.
 *
 * @implements Rule<Param>
 */
final class ParameterNameRule implements Rule
{
    public function getNodeType(): string
    {
        return Param::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        $name = $node->var instanceof Variable ? $node->var->name : null;

        if (!\is_string($name) || Naming::matches(Naming::CAMEL_CASE, $name)) {
            return [];
        }

        return [
            RuleErrorBuilder::message(\sprintf('Parameter "$%s" must be camelCase, e.g. "$userId".', $name))
                ->identifier('frootbox.naming.parameter')
                ->build(),
        ];
    }
}
