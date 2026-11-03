<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Person;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Url\Urls;
use Frootbox\Database\Ulid;
use Frootbox\People\Details;

/**
 * @implements Query<Details<PersonData>>
 */
#[AsQuery('frootbox/people/person.show', 'Returns a person with its draft, its published version and the addresses of the profile by language')]
final readonly class ShowPerson implements Query
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    /**
     * @return Details<PersonData>
     */
    public function handle(PersonStore $store, Urls $urls, Languages $languages): Details
    {
        $details = $store->details($this->id);
        $addresses = [];

        foreach ($languages->all() as $language) {
            $href = $urls->href(PersonStore::TYPE . ':' . $this->id, $language->code);

            if (null !== $href) {
                $addresses[$language->code] = $href;
            }
        }

        return $details->withUrls($addresses);
    }
}
