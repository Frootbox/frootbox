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
 * @implements Action<Details<PersonData>>
 */
#[AsAction('frootbox/people/person.unpublish', 'Takes a person offline; the person stays as a draft')]
final readonly class UnpublishPerson implements Action, Scoped
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
     * @return Details<PersonData>
     */
    public function handle(PersonEditor $editor): Details
    {
        return $editor->unpublish('frootbox/people/person.unpublish', $this->id);
    }
}
