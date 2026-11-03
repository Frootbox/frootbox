<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Backend;

use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Media\ShowMedium;
use Frootbox\Database\EntityNotFoundException;

/**
 * The preview and file name of an image for the image input.
 */
final readonly class ImagePreview
{
    public function __construct(private Runner $runner) {}

    /**
     * @param array<mixed>|null $image
     *
     * @return array{preview: string, file: string}|null Null without one or if it is gone or may not be seen
     */
    public function of(?array $image): ?array
    {
        $media = \is_string($image['media'] ?? null) ? $image['media'] : null;

        if (null === $media) {
            return null;
        }

        try {
            $medium = $this->runner->ask(new ShowMedium($media));
        } catch (AccessDeniedException|EntityNotFoundException) {
            return null;
        }

        return ['preview' => $medium->preview, 'file' => $medium->fileName];
    }
}
