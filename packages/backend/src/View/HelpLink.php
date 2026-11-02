<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Help\HelpEntry;
use Frootbox\Core\Help\ListHelp;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Routing\Router;

/**
 * The help page about a screen (decisions 0215, 0218): the first one
 * "about" its route, else about a route it belongs to, e.g.
 * "screen:backend.pages" for "backend.pages.show".
 */
final readonly class HelpLink
{
    public function __construct(
        public string $id,
        public string $title,
        public string $url,
    ) {}

    public static function find(Runner $runner, Router $router, string $about): ?self
    {
        [$kind, $name] = explode(':', $about, 2) + ['', ''];

        try {
            while ('' !== $name) {
                $entries = $runner->ask(new ListHelp($kind . ':' . $name));

                if ([] !== $entries) {
                    return self::of($entries[0], $router);
                }

                $dot = strrpos($name, '.');
                $name = false === $dot ? '' : substr($name, 0, $dot);
            }
        } catch (ActionException) {
            // Without a sign-in there is no help.
        }

        return null;
    }

    public static function of(HelpEntry $entry, Router $router): self
    {
        return new self($entry->id, $entry->title, $router->path('backend.help.show', ['id' => $entry->id]));
    }

    /**
     * The texts of <fb-help>, as the macro ui.help gives them.
     *
     * @return array<string, string>
     */
    public static function labels(Translator $translator): array
    {
        $t = $translator->get(...);

        return [
            'help' => $t('Help'),
            'close' => $t('Close'),
            'open' => $t('Open in the help'),
            'loading' => $t('Loading …'),
            'failed' => $t('The help could not be loaded. Try again.'),
            'english' => $t('This page is only available in English so far.'),
        ];
    }
}
