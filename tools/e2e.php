<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

/*
 * Builds var/e2e/, a fresh installation of the demo website in live mode
 * with SQLite, and serves it on http://127.0.0.1:8100 for the browser
 * tests (tests/e2e/). Playwright starts it, see playwright.config.ts.
 *
 * Needs PHP 8.5 and Composer; COMPOSER_BINARY names Composer if it is not
 * in the PATH.
 */

$root = dirname(__DIR__);
$address = '127.0.0.1:8100';
$composer = getenv('COMPOSER_BINARY');

if (false === $composer || '' === $composer) {
    $composer = trim((string) shell_exec('command -v composer'));
}

if ('' === $composer) {
    fwrite(STDERR, "Composer was not found. Set COMPOSER_BINARY to its path.\n");

    exit(1);
}

passthru(sprintf(
    'cd %s && %s %s sandbox -- --reset --dir=var/e2e --env=prod --url=%s',
    escapeshellarg($root),
    escapeshellarg(PHP_BINARY),
    escapeshellarg($composer),
    escapeshellarg('http://' . $address),
), $exitCode);

if (0 !== $exitCode) {
    exit($exitCode);
}

// Several workers, as the tests run in parallel. The requests go to a log.
putenv('PHP_CLI_SERVER_WORKERS=4');
passthru(sprintf(
    '%s -S %s -t %s 2>> %s',
    escapeshellarg(PHP_BINARY),
    escapeshellarg($address),
    escapeshellarg($root . '/var/e2e/public'),
    escapeshellarg($root . '/var/e2e/var/log/server.log'),
), $exitCode);

exit($exitCode);
