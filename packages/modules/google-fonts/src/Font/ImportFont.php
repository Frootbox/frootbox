<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Font;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;

/**
 * @implements Action<FontSummary>
 */
#[AsAction('frootbox/google-fonts/font.import', 'Copies a family of Google Fonts to the website, with the files of the scripts its languages need; visitors then load it from the own domain. Importing again replaces the files.', undoable: false)]
final readonly class ImportFont implements Action
{
    public function __construct(
        #[Length(1, 100)]
        #[Description('The family as the catalog names it, e.g. "Inter"')]
        public string $family,
        #[Description('Also the italic styles, if the family has them')]
        public bool $italic = false,
    ) {}

    public function handle(FontLibrary $library): FontSummary
    {
        return FontSummary::of($library->import('frootbox/google-fonts/font.import', $this->family, $this->italic));
    }
}
