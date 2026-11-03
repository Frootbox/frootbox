<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Catalog;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Action\Schema\Range;

/**
 * @implements Query<list<CatalogFont>>
 */
#[AsQuery('frootbox/google-fonts/catalog.search', 'Searches the catalog of Google Fonts by family, the most used first; the server asks Google at most once a day')]
final readonly class SearchCatalog implements Query
{
    public function __construct(
        #[Length(0, 100)]
        #[Description('Part of the name of the family, e.g. "sans"')]
        public string $q = '',
        #[Pattern('^(|sans-serif|serif|display|handwriting|monospace)$')]
        #[Description('Only fonts of this kind')]
        public string $category = '',
        #[Range(1, 100)]
        public int $limit = 30,
    ) {}

    /**
     * @return list<CatalogFont>
     */
    public function handle(Catalog $catalog): array
    {
        $q = mb_strtolower(trim($this->q));
        $found = [];

        foreach ($catalog->all() as $font) {
            if (('' === $this->category || $font->category === $this->category) && ('' === $q || str_contains(mb_strtolower($font->family), $q))) {
                $found[] = $font;

                if (\count($found) >= $this->limit) {
                    break;
                }
            }
        }

        return $found;
    }
}
