<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Location;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Media\MediaEditor;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Action<Details<LocationData>>
 */
#[AsAction('frootbox/people/location.publish', 'Puts the draft of a location online, wherever a block shows it')]
final readonly class PublishLocation implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * @return Details<LocationData>
     */
    public function handle(LocationStore $store, MediaEditor $media): Details
    {
        $details = $store->publish('frootbox/people/location.publish', $this->id);
        $image = $details->published?->image['media'] ?? null;

        // The image becomes public with the location that shows it.
        if (\is_string($image)) {
            $media->makePublic([$image]);
        }

        return $details;
    }
}
