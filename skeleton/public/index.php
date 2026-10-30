<?php

declare(strict_types=1);

use Frootbox\Core\Application;

require dirname(__DIR__) . '/vendor/autoload.php';

Application::fromProjectRoot(dirname(__DIR__))->run();
