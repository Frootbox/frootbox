<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan;

/**
 * The naming rules of Frootbox, after PSR-1 and PER Coding Style.
 */
final class Naming
{
    /** Classes, interfaces, traits, enums and enum cases: PageLayout */
    public const string PASCAL_CASE = '/^[A-Z][a-zA-Z0-9]*$/';

    /** Methods, functions, properties, parameters and variables: pageLayout */
    public const string CAMEL_CASE = '/^[a-z][a-zA-Z0-9]*$/';

    /** Constants: MAX_LENGTH */
    public const string UPPER_SNAKE_CASE = '/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/';

    /** Magic methods: __construct */
    public const string MAGIC = '/^__[a-z][a-zA-Z]*$/';

    /** Variables PHP defines itself. */
    public const array PREDEFINED_VARIABLES = ['this', 'GLOBALS', '_SERVER', '_GET', '_POST', '_FILES', '_COOKIE', '_SESSION', '_REQUEST', '_ENV', 'http_response_header', 'argc', 'argv'];

    public static function matches(string $pattern, string $name): bool
    {
        return 1 === preg_match($pattern, $name);
    }
}
