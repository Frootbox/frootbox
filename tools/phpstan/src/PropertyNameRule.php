<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Stmt\Property;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Properties are camelCase. Promoted properties are parameters and are
 * checked by VariableNameRule.
 *
 * @implements Rule<Property>
 */
final class PropertyNameRule implements Rule
{
    public function getNodeType(): string
    {
        return Property::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        $errors = [];

        foreach ($node->props as $property) {
            $name = $property->name->toString();

            if (!Naming::matches(Naming::CAMEL_CASE, $name)) {
                $errors[] = RuleErrorBuilder::message(\sprintf('Property "$%s" must be camelCase, e.g. "$createdAt".', $name))
                    ->identifier('frootbox.naming.property')
                    ->line($property->getStartLine())
                    ->build();
            }
        }

        return $errors;
    }
}
