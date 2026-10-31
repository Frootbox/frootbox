<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\ConfigInterface;
use PhpCsFixer\Finder;

/*
 * Same rules as .php-cs-fixer.dist.php, but for the MIT licensed packages.
 * Themes and the skeleton join later.
 */
$base = require __DIR__ . '/.php-cs-fixer.dist.php';

if (!$base instanceof ConfigInterface) {
    throw new UnexpectedValueException('.php-cs-fixer.dist.php must return a configuration.');
}

$rules = $base->getRules();
$rules['header_comment'] = [
    'header' => 'SPDX-License-Identifier: MIT',
    'comment_type' => 'comment',
    'location' => 'after_open',
    'separate' => 'both',
];

return new Config()
    ->setRiskyAllowed(true)
    ->setCacheFile(__DIR__ . '/.cache/php-cs-fixer-mit.cache')
    ->setFinder(Finder::create()->in([__DIR__ . '/packages/rich-text']))
    ->setRules($rules);
