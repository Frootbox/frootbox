<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

/*
 * Creates sandbox/, a local test installation for developing Frootbox.
 *
 * It is a copy of skeleton/ that loads the packages from packages/ via path
 * repositories, so every change there shows up immediately. It runs the
 * demo theme Bohnenglück in German and English with its demo website
 * (decision 0109).
 *
 * Usage: composer sandbox            create it
 *        composer sandbox -- --reset delete and create it again (loses its content)
 *
 * The superuser comes from FROOTBOX_ADMIN_EMAIL, FROOTBOX_ADMIN_NAME and
 * FROOTBOX_ADMIN_PASSWORD, so it is the same after every reset. Put them in
 * sandbox.env next to composer.json (see sandbox.env.example, not in Git) or
 * export them in the shell, which wins over the file. Without them it is
 * admin@example.test with a generated password, shown once.
 *
 * The browser tests build their own installation with the same script:
 *        --dir=var/e2e   another folder in the repository
 *        --env=prod      live operation instead of development
 *        --url=http://…  the address of the website
 */

$root = dirname(__DIR__);
$skeleton = $root . '/skeleton';

require $root . '/vendor/autoload.php';

loadSettings($root . '/sandbox.env');
$options = getopt('', ['reset', 'dir:', 'env:', 'url:']);
$reset = isset($options['reset']);
$directory = is_string($options['dir'] ?? null) ? trim($options['dir'], '/') : 'sandbox';
$environment = is_string($options['env'] ?? null) ? $options['env'] : 'dev';
$url = is_string($options['url'] ?? null) ? $options['url'] : null;

if (1 !== preg_match('#^[a-z0-9_-]+(/[a-z0-9_-]+)*$#', $directory)) {
    fwrite(STDERR, "--dir must be a folder in the repository, e.g. var/e2e.\n");

    exit(1);
}

if (!in_array($environment, ['dev', 'prod'], true)) {
    fwrite(STDERR, "--env must be dev or prod.\n");

    exit(1);
}

// FROOTBOX_ADMIN_EMAIL, FROOTBOX_ADMIN_NAME and FROOTBOX_ADMIN_PASSWORD set the
// superuser, so it stays the same after every reset. Without them it is
// admin@example.test with a generated password.
$adminEmail = trim(setting('FROOTBOX_ADMIN_EMAIL') ?? 'admin@example.test');
$adminName = trim(setting('FROOTBOX_ADMIN_NAME') ?? ('admin@example.test' === $adminEmail ? 'Admin' : (string) strstr($adminEmail, '@', true)));

// Checked with the rules of user.create before anything is deleted.
$adminErrors = new Frootbox\Core\Action\Schema\InputValidator()->errors(
    Frootbox\Core\Action\Descriptor::of(Frootbox\Core\User\CreateUser::class)->schema(),
    ['email' => $adminEmail, 'name' => $adminName, 'roles' => ['superuser'], ...(null === setting('FROOTBOX_ADMIN_PASSWORD') ? [] : ['password' => setting('FROOTBOX_ADMIN_PASSWORD')])],
);

if ([] !== $adminErrors) {
    fwrite(STDERR, "The superuser from sandbox.env or the shell is invalid, nothing was changed:\n");

    foreach ($adminErrors as $pointer => $message) {
        fwrite(STDERR, sprintf("  FROOTBOX_ADMIN_%s %s\n", strtoupper(ltrim($pointer, '/')), $message));
    }

    exit(1);
}

$sandbox = $root . '/' . $directory;
$up = str_repeat('../', substr_count($directory, '/') + 1);

if (is_dir($sandbox)) {
    if (!$reset) {
        fwrite(STDERR, "{$directory}/ already exists. Run `composer sandbox -- --reset` to rebuild it (this deletes its content).\n");

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
    ['type' => 'path', 'url' => $up . 'packages/*', 'options' => ['symlink' => true]],
    ['type' => 'path', 'url' => $up . 'packages/themes/*', 'options' => ['symlink' => true]],
];
$composer['require'] = [...(is_array($composer['require'] ?? null) ? $composer['require'] : []), 'frootbox/theme-bohnenglueck' => '^0.1@dev'];

file_put_contents(
    $composerFile,
    json_encode($composer, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n",
);

configure($sandbox . '/config/app.yaml', $url);

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

$commands = [
    // Writes .env, runs the migrations and creates the superuser.
    'install --no-interaction --env=' . $environment . ' --admin-email=' . escapeshellarg($adminEmail) . ' --admin-name=' . escapeshellarg($adminName),
    'seed frootbox/theme-bohnenglueck:demo/site.yaml',
];

if ('prod' === $environment) {
    $commands[] = 'assets:publish';
}

// Own test content after the demo, only for the sandbox itself: seed files
// from FROOTBOX_SANDBOX_SEED, separated by commas, relative to the repo.
if ('sandbox' === $directory) {
    foreach (array_filter(array_map(trim(...), explode(',', setting('FROOTBOX_SANDBOX_SEED') ?? '')), static fn(string $file): bool => '' !== $file) as $file) {
        $path = str_starts_with($file, '/') ? $file : dirname(__DIR__) . '/' . $file;

        if (!is_file($path)) {
            fwrite(STDERR, "FROOTBOX_SANDBOX_SEED: there is no file {$file}.\n");

            exit(1);
        }

        $commands[] = 'seed ' . escapeshellarg($path);
    }
}

foreach ($commands as $command) {
    passthru(sprintf('%s %s %s', escapeshellarg(PHP_BINARY), escapeshellarg($sandbox . '/bin/frootbox'), $command), $exitCode);

    if (0 !== $exitCode) {
        exit($exitCode);
    }
}

if ('sandbox' !== $directory) {
    echo "\n{$directory}/ ready.\n";

    exit(0);
}

echo <<<TEXT

    Sandbox ready: {$sandbox}
    Superuser: {$adminEmail}

    Browser via MAMP: create a host with PHP 8.5 and the document root
      {$sandbox}/public
    or run `composer serve` and open http://localhost:8000

    TEXT;

/**
 * Sets the variables from sandbox.env that the environment does not set yet.
 * They reach the installer, which runs as a child process.
 */
function loadSettings(string $file): void
{
    if (!is_file($file)) {
        return;
    }

    foreach (new Symfony\Component\Dotenv\Dotenv()->parse((string) file_get_contents($file), $file) as $name => $value) {
        $current = getenv($name);

        if (is_string($value) && (false === $current || '' === $current)) {
            putenv($name . '=' . $value);
        }
    }
}

/**
 * A variable from the environment or sandbox.env, null if it is not set.
 */
function setting(string $name): ?string
{
    $value = getenv($name);

    return false === $value || '' === trim($value) ? null : $value;
}

/**
 * Makes Bohnenglück the theme and adds English.
 */
function configure(string $file, ?string $url): void
{
    $yaml = (string) file_get_contents($file);
    $replacements = [
        '/^  name: .*$/m' => '  name: Bohnenglück',
        '/^  # en: (\{.*?\})\s*#.*$/m' => '  en: $1',
        '/^# theme: .*$/m' => 'theme: frootbox/theme-bohnenglueck',
    ];

    if (null !== $url) {
        $replacements['/^  # url: .*$/m'] = '  url: ' . $url;
    }

    foreach ($replacements as $pattern => $replacement) {
        $yaml = preg_replace($pattern, $replacement, $yaml, 1, $count);

        if (!is_string($yaml) || 1 !== $count) {
            throw new RuntimeException(sprintf('skeleton/config/app.yaml has no line for %s.', $pattern));
        }
    }

    file_put_contents($file, $yaml);
}

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
