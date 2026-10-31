<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

// Themes, the skeleton and examples are MIT licensed and get their own header later.
$finder = Finder::create()
    ->in([__DIR__ . '/packages', __DIR__ . '/tools'])
    ->exclude('themes')
    ->notPath('phpstan/tests/data')
    ->append([__FILE__]);

return new Config()
    ->setRiskyAllowed(true)
    ->setCacheFile(__DIR__ . '/.cache/php-cs-fixer.cache')
    ->setFinder($finder)
    ->setRules([
        '@PER-CS3x0' => true,
        '@PER-CS3x0:risky' => true,
        '@PHP8x5Migration' => true,
        '@PHP8x5Migration:risky' => true,
        'declare_strict_types' => true,
        'final_class' => true,
        'header_comment' => [
            'header' => 'SPDX-License-Identifier: LGPL-3.0-only',
            'comment_type' => 'comment',
            'location' => 'after_open',
            'separate' => 'both',
        ],
        'native_function_invocation' => ['include' => ['@compiler_optimized'], 'scope' => 'namespaced'],
        'no_unused_imports' => true,
        'ordered_imports' => ['imports_order' => ['class', 'function', 'const']],
        'php_unit_test_case_static_method_calls' => ['call_type' => 'self'],
        'strict_comparison' => true,
        'strict_param' => true,
    ]);
