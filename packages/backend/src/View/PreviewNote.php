<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Design\Design;
use Frootbox\Core\Asset\PublicAssets;
use Frootbox\Core\Design\DesignPage;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Language\Direction;
use Frootbox\Core\Preview\PreviewAccess;
use Frootbox\Core\Preview\PreviewEditor;
use Frootbox\Core\Routing\Router;
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
        private Router $router,
    ) {}

    public function __invoke(BuildingHead $event): void
    {
        $access = $event->request->getAttribute(PreviewAccess::class);

        if (!$access instanceof PreviewAccess || null !== $this->view->user()) {
            return;
        }

        $t = $this->translator->get(...);
        $pageId = null !== $event->target && $event->target->isPage() ? $event->target->id : null;
        // The design page has comments of its own, without a page (decision 0210).
        $design = true === $event->request->getAttribute(DesignPage::class);
        $config = [
            'expiresAt' => $access->expiresAt->format(DATE_ATOM),
            'end' => $event->request->getUri()->getPath() . '?' . PreviewEditor::PARAMETER . '=0',
            'tokens' => $this->design->hostCss(),
            // Comments on the pages of the website (decision 0156).
            'comments' => null !== $pageId || $design,
            'pageId' => $pageId,
            'design' => $design,
            'language' => $event->head->language,
            // The bar follows the language of the backend, not of the page (decision 0133).
            'ui' => ['language' => $this->translator->language(), 'direction' => Direction::of($this->translator->language())->value],
            'actions' => substr($this->router->path('backend.preview.action', ['name' => 'x']), 0, -1),
            'queries' => substr($this->router->path('backend.preview.query', ['name' => 'x']), 0, -1),
            'labels' => [
                'region' => $t('Preview'),
                'title' => $t('Preview, not published yet'),
                'until' => $t('The link works until {date}.'),
                'end' => $t('End the preview'),
                ...self::commentLabels($this->translator),
            ],
        ];

        $json = json_encode($config, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_HEX_TAG | \JSON_HEX_AMP);
        $event->head->add('<script type="application/json" id="' . self::CONFIG . '">' . $json . '</script>');
        $event->head->add('<script type="module" src="' . Html::escape($this->public->versioned(self::SCRIPT)) . '"></script>');
    }

    /**
     * The texts of comments, for the preview and the editor bar.
     *
     * @return array<string, string>
     */
    public static function commentLabels(Translator $translator): array
    {
        $t = $translator->get(...);

        return [
            'comment' => $t('Comment'),
            'comments' => $t('Comments'),
            'pickHint' => $t('Click the place you want to comment on.'),
            'wholePage' => $t('The whole page'),
            'cancel' => $t('Cancel'),
            'close' => $t('Close'),
            'newComment' => $t('New comment'),
            'about' => $t('About: {place}'),
            'aboutPage' => $t('About the whole page'),
            'yourComment' => $t('Your comment'),
            'yourName' => $t('Your name'),
            'send' => $t('Send'),
            'reply' => $t('Reply'),
            'sendReply' => $t('Send reply'),
            'noComments' => $t('No comments yet.'),
            'onThisPage' => $t('On this page'),
            'onOtherPages' => $t('On other pages'),
            'page' => $t('Page'),
            'designElements' => $t('All elements'),
            'showPlace' => $t('Show'),
            'openThread' => $t('Open thread'),
            'doneThread' => $t('Done thread'),
            'openCount' => $t('{count} open'),
            'commentPin' => $t('Comment {number}: {text}'),
            'commentFailed' => $t('That did not work. Try again.'),
        ];
    }
}
