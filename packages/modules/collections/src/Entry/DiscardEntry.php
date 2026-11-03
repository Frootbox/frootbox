<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;

/**
 * @implements Action<EntryDetails|null>
 */
#[AsAction('frootbox/collections/entry.discard', 'Throws away the draft of an entry; one that was never published is gone then')]
final readonly class DiscardEntry implements Action, Scoped
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * The object within its space (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return [SpaceScopes::object(EntryStore::TYPE, $this->id)];
    }

    public function handle(EntryEditor $editor): ?EntryDetails
    {
        return $editor->discard('frootbox/collections/entry.discard', $this->id);
    }
}
