<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts;

use Frootbox\Backend\Screen;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\Theme\Fonts;
use Frootbox\GoogleFonts\Backend\FontsHandler;
use Frootbox\GoogleFonts\Catalog\SearchCatalog;
use Frootbox\GoogleFonts\Font\DeleteFont;
use Frootbox\GoogleFonts\Font\GoogleFontSource;
use Frootbox\GoogleFonts\Font\ImportFont;
use Frootbox\GoogleFonts\Font\ListFonts;

/**
 * Google Fonts (decision 0252): imports families once to the website,
 * so visitors load them from the own domain and Google sees none of them.
 */
final class GoogleFontsExtension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->query(SearchCatalog::class);
        $registry->query(ListFonts::class);
        $registry->action(ImportFont::class);
        $registry->action(DeleteFont::class);
        $registry->add(Fonts::class, new Fonts(GoogleFontSource::class));

        if (class_exists(Screen::class)) {
            $registry->mount('backend.path', '/cms')
                ->get('/google-fonts', FontsHandler::class, 'frootbox.google-fonts.fonts');
            $registry->add(Screen::class, new Screen('Fonts', 'frootbox.google-fonts.fonts', Screen::WEBSITE, 'type', FontsHandler::PERMISSION, order: 11));
        }
    }
}
