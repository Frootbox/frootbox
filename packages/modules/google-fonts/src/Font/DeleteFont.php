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
use Frootbox\Core\Design\DesignTokens;

/**
 * @implements Action<null>
 */
#[AsAction('frootbox/google-fonts/font.delete', 'Removes an imported font and its files; not while the design or its draft uses it', undoable: false)]
final readonly class DeleteFont implements Action
{
    public function __construct(
        #[Length(1, 80)]
        #[Description('The key, e.g. "google-inter"')]
        public string $key,
    ) {}

    public function handle(FontLibrary $library, DesignTokens $design): null
    {
        $library->delete('frootbox/google-fonts/font.delete', $this->key, $design);

        return null;
    }
}
