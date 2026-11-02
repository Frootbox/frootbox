<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News;

use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Core\Action\Schema\Title;
use Frootbox\Core\Settings\AsSettings;

/**
 * The settings of the news (decision 0221).
 */
#[AsSettings('News', 'Articles on the website and in the feed')]
final readonly class NewsSettings
{
    public function __construct(
        #[Title('Articles in the feed'), Description('How many of the newest articles the RSS feed of a page lists.')]
        #[Range(min: 1, max: 100)]
        public int $feedItems = 20,
    ) {}
}
