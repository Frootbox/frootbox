<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\ListOf;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;

/**
 * @implements Action<list<EntryDetails>>
 */
#[AsAction('frootbox/collections/entry.publish', 'Publishes the drafts of one or more entries')]
final readonly class PublishEntries implements Action, Scoped
{
    /**
     * @param list<string> $ids
     */
    public function __construct(
        #[ListOf('string')]
        public array $ids,
    ) {}

    /**
     * Each object within its space (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return array_map(static fn(string $id): Scope => SpaceScopes::object(EntryStore::TYPE, $id), $this->ids);
    }

    /**
     * @return list<EntryDetails>
     */
    public function handle(EntryEditor $editor): array
    {
        return $editor->publish('frootbox/collections/entry.publish', $this->ids);
    }
}
