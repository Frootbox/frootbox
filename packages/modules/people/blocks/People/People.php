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
 * The team: the published people of all locations or of one (decision
 * 0226), of all spaces or of one, of a category and with a tag; each
 * linked to the profile where the space has a page with profiles
 * (decision 0242).
 */
final readonly class People implements BlockController
{
    public function __construct(private Cards $cards) {}

    public function data(BlockContext $context): array
    {
        $option = static fn(string $name): ?string => \is_string($context->options[$name] ?? null) && '' !== $context->options[$name] ? $context->options[$name] : null;
        $people = $this->cards->people($option('location'), $option('space'), $option('category'), $option('tag'));

        return ['people' => $this->cards->cards($people, $context->contentLanguage, $context->language)];
    }
}
