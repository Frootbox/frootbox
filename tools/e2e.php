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
 * in the PATH. The superuser admin@example.test gets the password of
 * tests/e2e/admin.ts. E2E_LISTEN (e.g. 0.0.0.0:8100) lets the server take
 * requests from a container, see tools/visual.mjs.
 */

$root = dirname(__DIR__);
$address = '127.0.0.1:8100';
$listen = getenv('E2E_LISTEN');
$listen = false === $listen || '' === $listen ? $address : $listen;
$composer = getenv('COMPOSER_BINARY');

if (false === $composer || '' === $composer) {
    $composer = trim((string) shell_exec('command -v composer'));
}

if ('' === $composer) {
    fwrite(STDERR, "Composer was not found. Set COMPOSER_BINARY to its path.\n");

    exit(1);
}

// The same password as tests/e2e/admin.ts.
putenv('FROOTBOX_ADMIN_PASSWORD=e2e-kaffeebohne-42');

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
    '%s -S %s -t %s %s 2>> %s',
    escapeshellarg(PHP_BINARY),
    escapeshellarg($listen),
    escapeshellarg($root . '/var/e2e/public'),
    escapeshellarg($root . '/var/e2e/public/index.php'),
    escapeshellarg($root . '/var/e2e/var/log/server.log'),
), $exitCode);

exit($exitCode);
