<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

/*
 * Builds var/e2e/, a fresh installation of the demo website in live mode
 * with SQLite, and serves it on http://127.0.0.1:8100 for the browser
 * tests (tests/e2e/). Playwright starts it, see playwright.config.ts.
 * Besides German and English it speaks Arabic, for right to left.
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

// The same superuser as tests/e2e/admin.ts, whatever the shell sets.
putenv('FROOTBOX_ADMIN_EMAIL=admin@example.test');
putenv('FROOTBOX_ADMIN_NAME=Admin');
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

// Arabic as a third language, written from right to left (decision 0133),
// without content of its own: pages show the German one as fallback.
$config = $root . '/var/e2e/config/app.yaml';
$yaml = preg_replace('/^  en: (\{.*\})$/m', "  en: $1\n  ar: { title: العربية }", (string) file_get_contents($config), 1, $count);

if (!is_string($yaml) || 1 !== $count) {
    fwrite(STDERR, "var/e2e/config/app.yaml has no line for English.\n");

    exit(1);
}

file_put_contents($config, $yaml);
passthru(sprintf('%s %s cache:clear', escapeshellarg(PHP_BINARY), escapeshellarg($root . '/var/e2e/bin/frootbox')), $exitCode);

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
