<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

/*
 * Writes the catalog of the official modules for the extension directory
 * on frootbox.de (decision 0282) to var/catalog/: catalog.json and the
 * files of each module. Run it with `composer catalog`; the version is
 * the last tag of the monorepo, all packages share it.
 */

use Frootbox\Core\Application;
use Frootbox\Core\Extension\Check\CatalogWriter;
use Frootbox\Core\Extension\Source\ComposerSource;

$root = dirname(__DIR__);

require $root . '/vendor/autoload.php';

$project = sys_get_temp_dir() . '/frootbox-catalog-' . bin2hex(random_bytes(4));
mkdir($project . '/config', 0o777, true);
file_put_contents($project . '/config/app.yaml', "app:\n  name: Catalog\ndatabase:\n  url: '%env(DATABASE_URL)%'\nlanguages:\n  en: { title: English }\n");

try {
    $application = Application::fromProjectRoot(
        $project,
        ['APP_ENV' => 'dev', 'DATABASE_URL' => 'pdo-sqlite:///:memory:', 'APP_SECRET' => 'catalog'],
        [new ComposerSource($root . '/vendor', $project . '/extensions')],
    );
    $writer = $application->container()->get(CatalogWriter::class);

    if (!$writer instanceof CatalogWriter) {
        throw new UnexpectedValueException('The catalog writer is missing in the container.');
    }

    $tag = trim((string) shell_exec('git -C ' . escapeshellarg($root) . ' describe --tags --abbrev=0 2>/dev/null'));
    $folders = glob($root . '/packages/modules/*/frootbox.yaml');
    $result = $writer->write(array_map(dirname(...), false === $folders ? [] : $folders), $root . '/var/catalog', '' === $tag ? null : ltrim($tag, 'v'));
} finally {
    $items = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($project, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);

    foreach ($items as $item) {
        if ($item instanceof SplFileInfo) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }
    }

    rmdir($project);
}

foreach ($result['skipped'] as $name => $errors) {
    echo $name . ' is left out:' . "\n";

    foreach ($errors as $error) {
        echo '  - ' . $error . "\n";
    }
}

echo 'Wrote var/catalog/catalog.json with ' . count($result['written']) . " modules.\n";

exit([] === $result['skipped'] ? 0 : 1);
