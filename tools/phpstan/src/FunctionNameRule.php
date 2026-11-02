<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\FunctionLike;
use PhpParser\Node\Stmt\ClassMethod;
use PhpParser\Node\Stmt\Function_;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Methods and functions are camelCase (PSR-1), magic methods keep their
 * double underscore.
 *
 * @implements Rule<FunctionLike>
 */
final class FunctionNameRule implements Rule
{
    public function getNodeType(): string
    {
        return FunctionLike::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        if (!$node instanceof ClassMethod && !$node instanceof Function_) {
            return [];
        }

        $name = $node->name->toString();

        if (Naming::matches(Naming::CAMEL_CASE, $name) || Naming::matches(Naming::MAGIC, $name)) {
            return [];
        }

        return [
            RuleErrorBuilder::message(\sprintf('%s "%s" must be camelCase, e.g. "findBySlug".', $node instanceof ClassMethod ? 'Method' : 'Function', $name))
                ->identifier('frootbox.naming.function')
                ->build(),
        ];
    }
}
