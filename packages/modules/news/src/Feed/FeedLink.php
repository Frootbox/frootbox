<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Feed;

use Frootbox\Core\View\BuildingHead;
use Frootbox\RichText\Html;

/**
 * Announces the feed in the head of the main page of the news, so
 * browsers and feed readers find it.
 */
final readonly class FeedLink
{
    public function __construct(private Feed $feed) {}

    public function __invoke(BuildingHead $event): void
    {
        $target = $event->target;

        if (null === $target || !$target->isPage()) {
            return;
        }

        $url = $this->feed->url($target->id, $event->head->language);

        if (null !== $url) {
            $event->head->add(Html::open('link', ['rel' => 'alternate', 'type' => 'application/rss+xml', 'title' => $this->feed->title($target->id, $event->head->language), 'href' => $url]));
        }
    }
}
