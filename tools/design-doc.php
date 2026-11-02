<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

/*
 * Writes the token tables of packages/backend/DESIGN.md from tokens.yaml
 * (decision 0114). Run it with `composer design-doc` after changing a
 * token; a test fails while the tables are behind.
 */

use Frootbox\Backend\Design\DesignDoc;
use Frootbox\Backend\Design\Tokens;

require dirname(__DIR__) . '/vendor/autoload.php';

$file = DesignDoc::FILE;
$before = (string) file_get_contents($file);
$after = new DesignDoc(Tokens::fromFile())->apply($before);

if ($after === $before) {
    echo "DESIGN.md is up to date.\n";

    exit(0);
}

file_put_contents($file, $after);
echo "Updated the token tables in DESIGN.md.\n";
