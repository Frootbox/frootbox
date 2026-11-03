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
 * One published location with address, opening hours and a map (decision 0226).
 */
final readonly class Location implements BlockController
{
    public function __construct(private Cards $cards) {}

    public function data(BlockContext $context): array
    {
        return ['location' => $this->cards->location(\is_string($context->options['location'] ?? null) ? $context->options['location'] : '', $context->contentLanguage)];
    }
}
