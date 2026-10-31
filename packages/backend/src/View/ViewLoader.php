<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Core\Extension\Extensions;
use Twig\Loader\FilesystemLoader;

/**
 * Finds the views of the backend (decision 0114): "@backend/…" in
 * views/ of this package, "@<vendor>/<package>/…" in views/ of an
 * extension, e.g. "@acme/shop/orders.twig".
 */
final class ViewLoader extends FilesystemLoader
{
    public const string FOLDER = 'views';

    /** @var array<string, string> package => namespace */
    private array $packages = [];

    public function __construct(Extensions $extensions)
    {
        parent::__construct();
        $this->addPath(BackendExtension::ROOT . '/' . self::FOLDER, 'backend');

        foreach ($extensions as $package) {
            $directory = $package->path . '/' . self::FOLDER;

            if (is_dir($directory)) {
                $this->packages[$package->name] = 'package-' . md5($package->name);
                $this->addPath($directory, $this->packages[$package->name]);
            }
        }
    }

    protected function findTemplate(string $name, bool $throw = true): ?string
    {
        if (1 === preg_match('~^@([a-z0-9_.-]+/[a-z0-9_.-]+)/(.+)$~', $name, $match) && isset($this->packages[$match[1]])) {
            $name = '@' . $this->packages[$match[1]] . '/' . $match[2];
        }

        return parent::findTemplate($name, $throw);
    }
}
