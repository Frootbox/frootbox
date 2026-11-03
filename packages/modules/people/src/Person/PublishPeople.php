<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\ListOf;
use Frootbox\Core\Auth\Scope;
use Frootbox\Core\Auth\Scoped;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\People\Details;

/**
 * @implements Action<list<Details<PersonData>>>
 */
#[AsAction('frootbox/people/person.publish', 'Puts the drafts of people online, wherever a block shows them, with their profiles below the page of their space')]
final readonly class PublishPeople implements Action, Scoped
{
    /**
     * @param list<string> $ids
     */
    public function __construct(
        #[ListOf('string')]
        #[Description('Ids of the people, published together')]
        public array $ids,
    ) {}

    /**
     * Each object within its space (decision 0245).
     *
     * @return list<Scope>
     */
    public function scopes(): array
    {
        return array_map(static fn(string $id): Scope => SpaceScopes::object(PersonStore::TYPE, $id), $this->ids);
    }

    /**
     * @return list<Details<PersonData>>
     */
    public function handle(PersonEditor $editor): array
    {
        return $editor->publish('frootbox/people/person.publish', $this->ids);
    }
}
