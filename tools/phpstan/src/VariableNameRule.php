<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Expr\Variable;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Variables are camelCase, parameters are checked by ParameterNameRule. Variables PHP defines itself,
 * such as $_SERVER, are left alone.
 *
 * @implements Rule<Variable>
 */
final class VariableNameRule implements Rule
{
    public function getNodeType(): string
    {
        return Variable::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        $name = $node->name;

        if (!\is_string($name) || \in_array($name, Naming::PREDEFINED_VARIABLES, true) || Naming::matches(Naming::CAMEL_CASE, $name)) {
            return [];
        }

        return [
            RuleErrorBuilder::message(\sprintf('Variable "$%s" must be camelCase, e.g. "$userId".', $name))
                ->identifier('frootbox.naming.variable')
                ->build(),
        ];
    }
}
