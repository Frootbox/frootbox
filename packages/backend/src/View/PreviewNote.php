<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Design\Design;
use Frootbox\Backend\I18n\Translator;
use Frootbox\Core\Asset\PublicAssets;
use Frootbox\Core\Preview\PreviewAccess;
use Frootbox\Core\Preview\PreviewEditor;
use Frootbox\Core\View\BuildingHead;
use Frootbox\RichText\Html;

/**
 * The note for guests who look at the website with a preview link
 * (decision 0152): "Preview, not published yet", until when the link
 * works and "End the preview". Signed-in users get the editor bar instead.
 */
final readonly class PreviewNote
{
    public const string SCRIPT = BackendExtension::ROOT . '/assets/build/preview.js';

    public const string CONFIG = 'fb-preview-config';

    public function __construct(
        private BackendView $view,
        private Design $design,
        private Translator $translator,
        private PublicAssets $public,
    ) {}

    public function __invoke(BuildingHead $event): void
    {
        $access = $event->request->getAttribute(PreviewAccess::class);

        if (!$access instanceof PreviewAccess || null !== $this->view->user()) {
            return;
        }

        $t = $this->translator->get(...);
        $config = [
            'expiresAt' => $access->expiresAt->format(DATE_ATOM),
            'end' => $event->request->getUri()->getPath() . '?' . PreviewEditor::PARAMETER . '=0',
            'tokens' => $this->design->hostCss(),
            'labels' => [
                'region' => $t('Preview'),
                'title' => $t('Preview, not published yet'),
                'until' => $t('The link works until {date}.'),
                'end' => $t('End the preview'),
            ],
        ];

        $json = json_encode($config, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_HEX_TAG | \JSON_HEX_AMP);
        $event->head->add('<script type="application/json" id="' . self::CONFIG . '">' . $json . '</script>');
        $event->head->add('<script type="module" src="' . Html::escape($this->public->versioned(self::SCRIPT)) . '"></script>');
    }
}
