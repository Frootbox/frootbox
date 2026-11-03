<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Language\Languages;

/**
 * @implements Query<list<PersonSummary>>
 */
#[AsQuery('frootbox/people/person.list', 'Lists the people in the order of the team, with drafts and published ones')]
final readonly class ListPeople implements Query
{
    public function __construct(
        #[Description('Language of the roles; left out for the first language of the website')]
        public ?string $language = null,
    ) {}

    /**
     * @return list<PersonSummary>
     */
    public function handle(PersonStore $store, Languages $languages): array
    {
        $language = null !== $this->language && $languages->has($this->language) ? $this->language : $languages->default()->code;
        $people = [];

        foreach ($store->ids() as $id) {
            $details = $store->details($id);
            $people[] = [$details->current(), new PersonSummary($id, $details->status, $details->current()->name(), $details->current()->text($language)->role, array_keys($details->current()->translations))];
        }

        usort($people, static fn(array $a, array $b): int => [$a[0]->sortKey(), $a[1]->id] <=> [$b[0]->sortKey(), $b[1]->id]);

        return array_map(static fn(array $person): PersonSummary => $person[1], $people);
    }
}
