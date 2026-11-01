<?php

declare(strict_types=1);

use Frootbox\Core\Application;

// The development server of PHP (php -S … public/index.php) delivers files
// that exist itself, like .htaccess does. Everything else, e.g. a size of
// an image that is not generated yet, goes to Frootbox.
if ('cli-server' === \PHP_SAPI && is_file(__DIR__ . (string) parse_url((string) $_SERVER['REQUEST_URI'], \PHP_URL_PATH))) {
    return false;
}

require dirname(__DIR__) . '/vendor/autoload.php';

Application::fromProjectRoot(dirname(__DIR__))->run();
