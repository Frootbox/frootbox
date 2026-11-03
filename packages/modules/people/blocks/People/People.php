<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Blocks;

use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;
use Frootbox\People\Website\Cards;

/**
 * The team: the published people of all locations or of one (decision 0226).
 */
final readonly class People implements BlockController
{
    public function __construct(private Cards $cards) {}

    public function data(BlockContext $context): array
    {
        $location = \is_string($context->options['location'] ?? null) && '' !== $context->options['location'] ? $context->options['location'] : null;

        return ['people' => $this->cards->team($context->contentLanguage, $location)];
    }
}
