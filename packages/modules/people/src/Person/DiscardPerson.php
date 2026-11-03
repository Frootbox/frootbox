<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Action<Details<PersonData>|null>
 */
#[AsAction('frootbox/people/person.discard', 'Throws away the draft of a person; one never published is gone then')]
final readonly class DiscardPerson implements Action, Scoped
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
        return [SpaceScopes::object(PersonStore::TYPE, $this->id)];
    }

    /**
     * @return Details<PersonData>|null
     */
    public function handle(PersonStore $store): ?Details
    {
        return $store->discard('frootbox/people/person.discard', $this->id);
    }
}
