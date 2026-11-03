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
 * @implements Action<EntryDetails>
 */
#[AsAction('frootbox/collections/entry.unpublish', 'Takes an entry offline; it stays as a draft and can be published again')]
final readonly class UnpublishEntry implements Action, Scoped
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

    public function handle(EntryEditor $editor): EntryDetails
    {
        return $editor->unpublish('frootbox/collections/entry.unpublish', $this->id);
    }
}
