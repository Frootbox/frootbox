<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

/*
 * Creates sandbox/, a local test installation for developing Frootbox.
 *
 * It is a copy of skeleton/ that loads the packages from packages/ via path
 * repositories, so every change there shows up immediately.
 *
 * Usage: composer sandbox            create it
 *        composer sandbox -- --reset delete and create it again (loses its content)
 */

$root = dirname(__DIR__);
$skeleton = $root . '/skeleton';
$sandbox = $root . '/sandbox';
$arguments = $_SERVER['argv'] ?? [];
$reset = is_array($arguments) && in_array('--reset', $arguments, true);

if (is_dir($sandbox)) {
    if (!$reset) {
        fwrite(STDERR, "sandbox/ already exists. Run `composer sandbox -- --reset` to rebuild it (this deletes its content).\n");

        exit(1);
    }

    removeDirectory($sandbox);
}

copyDirectory($skeleton, $sandbox);

$composerFile = $sandbox . '/composer.json';
$composer = json_decode((string) file_get_contents($composerFile), true, flags: JSON_THROW_ON_ERROR);

if (!is_array($composer)) {
    throw new RuntimeException('skeleton/composer.json is invalid.');
}

$composer['name'] = 'frootbox/sandbox';
$composer['repositories'] = [
    ['type' => 'path', 'url' => '../packages/*', 'options' => ['symlink' => true]],
];

file_put_contents(
    $composerFile,
    json_encode($composer, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n",
);


$composerBinary = getenv('COMPOSER_BINARY');

if (false === $composerBinary || '' === $composerBinary) {
    fwrite(STDERR, "Run this script via `composer sandbox`.\n");

    exit(1);
}

passthru(
    sprintf(
        '%s %s install --no-interaction --working-dir=%s',
        escapeshellarg(PHP_BINARY),
        escapeshellarg($composerBinary),
        escapeshellarg($sandbox),
    ),
    $exitCode,
);

if (0 !== $exitCode) {
    exit($exitCode);
}

// Writes .env, runs the migrations and creates a superuser with a generated password.
passthru(
    sprintf(
        '%s %s install --no-interaction --env=dev --admin-email=admin@example.test --admin-name=Admin',
        escapeshellarg(PHP_BINARY),
        escapeshellarg($sandbox . '/bin/frootbox'),
    ),
    $exitCode,
);

if (0 !== $exitCode) {
    exit($exitCode);
}

echo <<<TEXT

    Sandbox ready: {$sandbox}

    Browser via MAMP: create a host with PHP 8.5 and the document root
      {$sandbox}/public
    or run `composer serve` and open http://localhost:8000

    TEXT;

function copyDirectory(string $from, string $to): void
{
    if (!is_dir($to) && !mkdir($to, 0o777, true)) {
        throw new RuntimeException(sprintf('Could not create "%s".', $to));
    }

    $entries = scandir($from);

    if (false === $entries) {
        throw new RuntimeException(sprintf('Could not read "%s".', $from));
    }

    foreach ($entries as $entry) {
        if (in_array($entry, ['.', '..', 'vendor', '.env'], true)) {
            continue;
        }

        $source = $from . '/' . $entry;
        $target = $to . '/' . $entry;

        if (is_dir($source)) {
            copyDirectory($source, $target);

            continue;
        }

        copy($source, $target);
        chmod($target, (int) fileperms($source) & 0o777);
    }
}

function removeDirectory(string $directory): void
{
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST,
    );

    foreach ($items as $item) {
        assert($item instanceof SplFileInfo);
        $item->isDir() && !$item->isLink() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }

    rmdir($directory);
}
