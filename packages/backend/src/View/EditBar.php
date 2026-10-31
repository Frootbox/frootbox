<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Design\Design;
use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\I18n\Translator;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Asset\PublicAssets;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PageStatus;
use Frootbox\Core\Page\ShowPage;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Routing\Router;
use Frootbox\Core\View\BuildingHead;
use Frootbox\RichText\Html;

/**
 * Puts the bar of the editing mode into pages of the website for users
 * who may see pages (decision 0119): its data as JSON, the tokens of the
 * backend for its shadow DOM, a small rule without a layer for the
 * marked places and the script edit.js, which brings Lit along. Guests
 * get nothing of it.
 */
final readonly class EditBar
{
    public const string SCRIPT = BackendExtension::ROOT . '/assets/build/edit.js';

    public const string CONFIG = 'fb-edit-config';

    /**
     * Without a layer, so it counts above all layers of the theme. The
     * outlines and labels are drawn by the bar, not here.
     */
    private const string PAGE_CSS = 'fb-field,fb-area,[data-fb-field]{outline:none}'
        . 'fb-field[data-fb-type="richtext"],fb-area{display:block}'
        . 'fb-area[data-fb-empty]{min-block-size:4rem}';

    public function __construct(
        private TwigExtension $permissions,
        private BackendView $view,
        private Runner $runner,
        private EditMode $mode,
        private Design $design,
        private Csrf $csrf,
        private Router $router,
        private Translator $translator,
        private Languages $languages,
        private PublicAssets $public,
    ) {}

    public function __invoke(BuildingHead $event): void
    {
        if (null === $this->view->user() || !$this->permissions->can('page.show')) {
            return;
        }

        $id = null !== $event->target && $event->target->isPage() ? $event->target->id : null;
        $config = [
            'editing' => $this->mode->active(),
            'marking' => $this->mode->marking(),
            'csrf' => $this->csrf->token($event->request),
            'actions' => substr($this->router->path('backend.action', ['name' => 'x']), 0, -1),
            'toggle' => $this->router->path('backend.edit-mode'),
            'pages' => $this->router->path('backend.pages'),
            'tokens' => $this->design->hostCss(),
            'brand' => ['name' => $this->design->brand()->name, 'logo' => $this->design->logo(), 'logoDark' => $this->design->logo(true)],
            'page' => null === $id ? null : $this->page($id, $event->head->language),
            'labels' => $this->labels(),
        ];

        $json = json_encode($config, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_HEX_TAG | \JSON_HEX_AMP);
        $event->head->add('<script type="application/json" id="' . self::CONFIG . '">' . $json . '</script>');

        if ($this->mode->active()) {
            $event->head->add('<style>' . self::PAGE_CSS . '</style>');
        }

        $event->head->add('<script type="module" src="' . Html::escape($this->public->versioned(self::SCRIPT)) . '"></script>');
    }

    /**
     * The page as the bar shows it, null if the user may not see it.
     *
     * @return array<string, mixed>|null
     */
    private function page(string $id, string $language): ?array
    {
        try {
            $details = $this->runner->ask(new ShowPage($id));
            $tree = PageTree::of($this->runner->ask(new ShowPageTree()), $this->languages);
        } catch (AccessDeniedException) {
            return null;
        }

        $draft = null !== $details->draft;

        // Parents that were never published go online together with the page.
        $offline = $tree->has($id) ? array_values(array_filter($tree->ancestors($id), static fn(string $ancestor): bool => !$tree->row($ancestor)['online'])) : [];
        $publish = [...$offline, $id];

        // Where the switch leads: the draft at its address, visitors to the published one.
        $path = $tree->has($id) ? $tree->path($id, $language) : '';
        $start = $tree->has($id) && $tree->row($id)['start'];
        $draftUrl = $this->languages->has($language) && ('' !== $path || $start) ? $this->languages->get($language)->path($path) : null;

        return [
            'id' => $id,
            'status' => $details->status->value,
            'locked' => null !== $details->visibility->lockedBy,
            'publish' => $publish,
            'offlineParents' => array_map(static fn(string $ancestor): string => $tree->row($ancestor)['title'], $offline),
            'canPublish' => $draft && $this->permissions->can('page.publish', ['ids' => $publish]),
            'canDiscard' => $draft && $this->permissions->can('page.discard', ['id' => $id]),
            'published' => PageStatus::Draft !== $details->status,
            'backend' => $this->router->path('backend.pages.show', ['id' => $id]),
            'draftUrl' => $draftUrl,
            'visitorUrl' => $details->urls[$language] ?? null,
        ];
    }

    /**
     * @return array<string, string>
     */
    private function labels(): array
    {
        $t = $this->translator->get(...);

        return [
            'bar' => $t('Editing mode'),
            'edit' => $t('Edit'),
            'status' => $t('Status'),
            'published' => $t('Published'),
            'draft' => $t('Draft'),
            'changed' => $t('Changed'),
            'locked' => $t('Locked for visitors'),
            'readOnly' => $t('You may not change this page.'),
            'publish' => $t('Publish'),
            'publishDone' => $t('The page is published.'),
            'offlineParents' => $t('These pages above it are not online yet and are published with it: {pages}.'),
            'discard' => $t('Discard the draft'),
            'discardConfirm' => $t('Discard the draft?'),
            'discardYes' => $t('Discard'),
            'cancel' => $t('Cancel'),
            'discardDone' => $t('The draft is discarded.'),
            'showAll' => $t('Show all places'),
            'backend' => $t('Open in the backend'),
            'collapse' => $t('Collapse the bar'),
            'expand' => $t('Show the bar'),
            'failed' => $t('The server cannot be reached. Check the connection and try again.'),
        ];
    }
}
