<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

/*
 * Writes documentation/reference/ from the code of every package of the
 * monorepo (decision 0265), like reference:build in a project. Run it
 * with `composer reference` after changing an action, a command, the
 * registry, a Twig function or a field type; a test fails while the
 * reference is behind. With --check it only tells.
 */

use Frootbox\Core\Application;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\Extension\Source\ComposerSource;
use Frootbox\Core\Reference\Reference;

$root = dirname(__DIR__);

require $root . '/vendor/autoload.php';

// A project without a database of its own, with every package of the monorepo.
$project = sys_get_temp_dir() . '/frootbox-reference-' . bin2hex(random_bytes(4));
mkdir($project . '/config', 0o777, true);
file_put_contents($project . '/config/app.yaml', "app:\n  name: Reference\ndatabase:\n  url: '%env(DATABASE_URL)%'\n");

try {
    $application = Application::fromProjectRoot(
        $project,
        ['APP_ENV' => 'dev', 'DATABASE_URL' => 'pdo-sqlite:///:memory:', 'APP_SECRET' => 'reference'],
        [new ComposerSource($root . '/vendor', $project . '/extensions')],
    );
    $container = $application->container();
    $registry = $container->get(Registry::class);

    if (!$registry instanceof Registry) {
        throw new UnexpectedValueException('The registry is missing in the container.');
    }

    $arguments = $_SERVER['argv'] ?? [];
    $check = is_array($arguments) && in_array('--check', $arguments, true);
    $changed = Reference::sync($root . '/documentation/reference', new Reference($registry, $container)->pages(), $check);
} finally {
    // Boot may leave var/ behind, e.g. logs.
    $items = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($project, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);

    foreach ($items as $item) {
        if ($item instanceof SplFileInfo) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }
    }

    rmdir($project);
}

if ([] === $changed) {
    echo "The reference is up to date.\n";

    exit(0);
}

echo ($check ? 'The reference is behind: ' : 'Wrote ') . implode(', ', $changed) . ".\n";

exit($check ? 1 : 0);
