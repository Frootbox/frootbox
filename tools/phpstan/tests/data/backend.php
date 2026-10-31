<?php

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Doctrine\DBAL\Connection;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Page\Pages;
use Frootbox\Database\Writer;

final class SomeHandler
{
    public function __construct(
        private Runner $runner,
        private Pages $pages,
        private Writer $writer,
        private Connection $connection,
    ) {}
}

namespace Frootbox\Core\Page;

use Doctrine\DBAL\Connection;

final class CoreMayDoIt
{
    public function __construct(private Connection $connection) {}
}
