<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Stmt\ClassConst;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Class constants are UPPER_SNAKE_CASE (PSR-1).
 *
 * @implements Rule<ClassConst>
 */
final class ConstantNameRule implements Rule
{
    public function getNodeType(): string
    {
        return ClassConst::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        $errors = [];

        foreach ($node->consts as $constant) {
            $name = $constant->name->toString();

            if (!Naming::matches(Naming::UPPER_SNAKE_CASE, $name)) {
                $errors[] = RuleErrorBuilder::message(\sprintf('Constant "%s" must be UPPER_SNAKE_CASE, e.g. "MAX_LENGTH".', $name))
                    ->identifier('frootbox.naming.constant')
                    ->line($constant->getStartLine())
                    ->build();
            }
        }

        return $errors;
    }
}
