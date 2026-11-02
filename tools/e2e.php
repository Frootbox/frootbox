<?php

/*
 * SPDX-License-Identifier: MIT
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
 *
 * With --base it builds var/e2e-base/ instead, the base theme alone with
 * its sample website (decision 0163), on http://127.0.0.1:8101. With
 * --agency var/e2e-agency/, the test design of an agency only in German
 * (decision 0212), on http://127.0.0.1:8102.
 */

$root = dirname(__DIR__);
$options = getopt('', ['base', 'agency']);
[$theme, $directory, $address] = match (true) {
    isset($options['agency']) => ['agency', 'var/e2e-agency', '127.0.0.1:8102'],
    isset($options['base']) => ['base', 'var/e2e-base', '127.0.0.1:8101'],
    default => ['bohnenglueck', 'var/e2e', '127.0.0.1:8100'],
};
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
    'cd %s && %s %s sandbox -- --reset --dir=%s --env=prod --url=%s --theme=%s',
    escapeshellarg($root),
    escapeshellarg(PHP_BINARY),
    escapeshellarg($composer),
    $directory,
    escapeshellarg('http://' . $address),
    $theme,
), $exitCode);

if (0 !== $exitCode) {
    exit($exitCode);
}

// Arabic as a third language, written from right to left (decision 0133),
// without content of its own: pages show the German one as fallback. The
// design of the agency is German only.
if ('agency' !== $theme) {
    $config = $root . '/' . $directory . '/config/app.yaml';
    $yaml = preg_replace('/^  en: (\{.*\})$/m', "  en: $1\n  ar: { title: العربية }", (string) file_get_contents($config), 1, $count);

    if (!is_string($yaml) || 1 !== $count) {
        fwrite(STDERR, "{$directory}/config/app.yaml has no line for English.\n");

        exit(1);
    }

    file_put_contents($config, $yaml);
}
passthru(sprintf('%s %s cache:clear', escapeshellarg(PHP_BINARY), escapeshellarg($root . '/' . $directory . '/bin/frootbox')), $exitCode);

if (0 !== $exitCode) {
    exit($exitCode);
}

// Several workers, as the tests run in parallel. The requests go to a log.
putenv('PHP_CLI_SERVER_WORKERS=4');
passthru(sprintf(
    '%s -S %s -t %s %s 2>> %s',
    escapeshellarg(PHP_BINARY),
    escapeshellarg($listen),
    escapeshellarg($root . '/' . $directory . '/public'),
    escapeshellarg($root . '/' . $directory . '/public/index.php'),
    escapeshellarg($root . '/' . $directory . '/var/log/server.log'),
), $exitCode);

exit($exitCode);
