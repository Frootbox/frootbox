<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Stmt\ClassLike;
use PhpParser\Node\Stmt\Enum_;
use PhpParser\Node\Stmt\Interface_;
use PhpParser\Node\Stmt\Trait_;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Classes, interfaces, traits and enums are PascalCase (PSR-1).
 *
 * @implements Rule<ClassLike>
 */
final class ClassNameRule implements Rule
{
    public function getNodeType(): string
    {
        return ClassLike::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        $name = $node->name?->toString();

        if (null === $name || Naming::matches(Naming::PASCAL_CASE, $name)) {
            return [];
        }

        $kind = match (true) {
            $node instanceof Interface_ => 'Interface',
            $node instanceof Trait_ => 'Trait',
            $node instanceof Enum_ => 'Enum',
            default => 'Class',
        };

        return [
            RuleErrorBuilder::message(\sprintf('%s name "%s" must be PascalCase, e.g. "PageLayout".', $kind, $name))
                ->identifier('frootbox.naming.class')
                ->build(),
        ];
    }
}
