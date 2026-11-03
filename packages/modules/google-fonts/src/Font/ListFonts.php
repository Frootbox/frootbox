<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Font;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;

/**
 * @implements Query<list<FontSummary>>
 */
#[AsQuery('frootbox/google-fonts/font.list', 'The fonts imported from Google Fonts, by family; their key is the value of a font token in the design')]
final readonly class ListFonts implements Query
{
    /**
     * @return list<FontSummary>
     */
    public function handle(ImportedFonts $fonts): array
    {
        return array_map(FontSummary::of(...), $fonts->sorted());
    }
}
