<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\PublishEntries;
use Frootbox\Collections\Entry\UnpublishEntry;
use Frootbox\Core\Action\Action;
use Frootbox\Core\Schedule\ScheduledType;

/**
 * The scheduler publishes entries and takes them offline at their time.
 */
final readonly class EntrySchedule implements ScheduledType
{
    public function type(): string
    {
        return EntryStore::TYPE;
    }

    public function publish(array $ids): Action
    {
        return new PublishEntries($ids);
    }

    public function unpublish(string $id): Action
    {
        return new UnpublishEntry($id);
    }
}
