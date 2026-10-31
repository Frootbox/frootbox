<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Name\FullyQualified;
use PHPStan\Analyser\Scope;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * The backend is only a user interface (decision 0114): what its screens
 * read or change are queries and actions. So code in Frootbox\Backend
 * must not touch repositories, the Writer or the database connection.
 *
 * @implements Rule<FullyQualified>
 */
final readonly class BackendDataAccessRule implements Rule
{
    private const string NAMESPACE = 'Frootbox\Backend\\';

    private const string TESTS = 'Frootbox\Backend\Tests\\';

    /** @var list<string> */
    private const array FORBIDDEN = [
        'Frootbox\Database\Repository',
        'Frootbox\Database\Writer',
        'Doctrine\DBAL\Connection',
    ];

    public function __construct(private ReflectionProvider $reflection) {}

    public function getNodeType(): string
    {
        return FullyQualified::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        $namespace = ($scope->getNamespace() ?? '') . '\\';

        if (!str_starts_with($namespace, self::NAMESPACE) || str_starts_with($namespace, self::TESTS)) {
            return [];
        }

        $name = $node->toString();

        if (!$this->reflection->hasClass($name)) {
            return [];
        }

        $class = $this->reflection->getClass($name);

        foreach (self::FORBIDDEN as $forbidden) {
            if ($class->getName() === $forbidden || ($this->reflection->hasClass($forbidden) && $class->isSubclassOfClass($this->reflection->getClass($forbidden)))) {
                return [
                    RuleErrorBuilder::message(\sprintf('The backend is only a user interface (decision 0114): use a query or an action instead of %s.', $name))
                        ->identifier('frootbox.backend.dataAccess')
                        ->build(),
                ];
            }
        }

        return [];
    }
}
