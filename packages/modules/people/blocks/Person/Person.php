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
 * One published person to contact (decision 0226).
 */
final readonly class Person implements BlockController
{
    public function __construct(private Cards $cards) {}

    public function data(BlockContext $context): array
    {
        return ['person' => $this->cards->contact(\is_string($context->options['person'] ?? null) ? $context->options['person'] : '', $context->contentLanguage)];
    }
}
