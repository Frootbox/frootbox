<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Entry;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;

/**
 * @implements Query<EntryDetails>
 */
#[AsQuery('frootbox/collections/entry.show', 'Returns an entry with its draft, its published version and where visitors find it')]
final readonly class ShowEntry implements Query, Scoped
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

    public function handle(EntryStore $store): EntryDetails
    {
        return $store->details($this->id, true);
    }
}
