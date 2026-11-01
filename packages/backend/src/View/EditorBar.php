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
use Frootbox\Core\Site\ShowSite;
use Frootbox\Core\View\BuildingHead;
use Frootbox\RichText\Html;

/**
 * Puts the editor bar into pages of the website for users who may see
 * pages (decisions 0119, 0137): its data as JSON, the tokens of the
 * backend for its shadow DOM, a small rule without a layer for the
 * marked places and the script edit.js, which brings Lit along. Guests
 * get nothing of it.
 */
final readonly class EditorBar
{
    public const string SCRIPT = BackendExtension::ROOT . '/assets/build/edit.js';

    public const string CONFIG = 'fb-edit-config';

    /**
     * Without a layer, so it counts above all layers of the theme. The
     * outlines and labels are drawn by the bar, not here.
     */
    private const string PAGE_CSS = 'fb-field,fb-area,[data-fb-field]{outline:none}'
        . 'fb-field[data-fb-type="richtext"],fb-area{display:block}'
        . 'fb-area[data-fb-empty]{min-block-size:4rem}'
        . '[data-fb-field][contenteditable]{cursor:text}'
        . '[data-fb-field]:empty::before{content:attr(data-fb-label);opacity:.5}'
        . '.ProseMirror{white-space:pre-wrap;overflow-wrap:break-word}'
        . '.ProseMirror-hideselection *::selection{background:transparent}';

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
            'queries' => substr($this->router->path('backend.query', ['name' => 'x']), 0, -1),
            'language' => $event->head->language,
            'toggle' => $this->router->path('backend.edit-mode'),
            'pages' => $this->router->path('backend.pages'),
            'uploads' => $this->router->path('backend.uploads'),
            'mayUpload' => $this->permissions->can('media.create'),
            'site' => $this->site(),
            'design' => $this->permissions->can('design.update') ? ['publish' => $this->permissions->can('design.publish'), 'discard' => $this->permissions->can('design.discard')] : null,
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
        $mayPublish = $this->permissions->can('page.publish', ['ids' => $publish]);
        $mayDiscard = $this->permissions->can('page.discard', ['id' => $id]);

        return [
            'id' => $id,
            'status' => $details->status->value,
            'locked' => null !== $details->visibility->lockedBy,
            'publish' => $publish,
            'offlineParents' => array_map(static fn(string $ancestor): string => $tree->row($ancestor)['title'], $offline),
            // Whether the buttons come once a change makes a draft.
            'mayPublish' => $mayPublish,
            'mayDiscard' => $mayDiscard,
            'canPublish' => $draft && $mayPublish,
            'canDiscard' => $draft && $mayDiscard,
            'published' => PageStatus::Draft !== $details->status,
            'backend' => $this->router->path('backend.pages.show', ['id' => $id]),
            'draftUrl' => $draftUrl,
            'visitorUrl' => $details->urls[$language] ?? null,
        ];
    }

    /**
     * The fields of the website (decision 0128): whether they have a draft
     * and what the user may do with it, null without the right to change
     * them.
     *
     * @return array{draft: bool, publish: bool, discard: bool}|null
     */
    private function site(): ?array
    {
        if (!$this->permissions->can('site.update-field')) {
            return null;
        }

        return [
            'draft' => $this->runner->ask(new ShowSite())->draft,
            'publish' => $this->permissions->can('site.publish'),
            'discard' => $this->permissions->can('site.discard'),
        ];
    }

    /**
     * @return array<string, string|array<string, string>> Texts by key, the names of the system fonts by font
     */
    private function labels(): array
    {
        $t = $this->translator->get(...);

        return [
            'bar' => $t('Editor bar'),
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
            'collapse' => $t('Collapse the editor bar'),
            'expand' => $t('Show the editor bar'),
            'failed' => $t('The server cannot be reached. Check the connection and try again.'),
            'saving' => $t('Saving …'),
            'saved' => $t('Saved'),
            'undo' => $t('Undo'),
            'reload' => $t('Load again'),
            'formatting' => $t('Formatting'),
            'bold' => $t('Bold'),
            'italic' => $t('Italic'),
            'subheading' => $t('Subheading'),
            'bulletList' => $t('List'),
            'orderedList' => $t('Numbered list'),
            'quote' => $t('Quote'),
            'link' => $t('Link'),
            'linkText' => $t('Text'),
            'linkTarget' => $t('Address or page'),
            'linkHint' => $t('Search for a page or enter an address such as https://example.com.'),
            'linkPage' => $t('Page'),
            'noPages' => $t('No page found.'),
            'newWindow' => $t('Open in a new window'),
            'apply' => $t('Apply'),
            'removeLink' => $t('Remove the link'),
            'design' => $t('Design'),
            'designTitle' => $t('Design of the website'),
            'designDraft' => $t('Only you see the changes until you publish them.'),
            'designLive' => $t('Visitors see this design.'),
            'designColors' => $t('Colours'),
            'designFonts' => $t('Fonts'),
            'designSizes' => $t('Sizes'),
            'designMore' => $t('More'),
            'designReset' => $t('Back to the value of the theme'),
            'designResetOf' => $t('Reset {token}'),
            'designHex' => $t('Hex value of {token}'),
            'designContrast' => $t('Only {ratio} : 1 against “{other}”. Text needs at least 4.5 : 1 to be easy to read.'),
            'designPublish' => $t('Publish the design'),
            'designDiscard' => $t('Discard the changes'),
            'designDiscardConfirm' => $t('Discard all changes to the design?'),
            'designIsPublished' => $t('The design is published.'),
            'designIsDiscarded' => $t('The changes to the design are discarded.'),
            'designNone' => $t('The theme has no settings for the design.'),
            'fontNames' => ['sans' => $t('Sans-serif'), 'serif' => $t('Serif'), 'rounded' => $t('Rounded'), 'mono' => $t('Monospace')],
            'chooseImage' => $t('Choose an image'),
            'mediaLibrary' => $t('Media'),
            'upload' => $t('Upload'),
            'uploading' => $t('Uploading {done} of {total} …'),
            'noMedia' => $t('No images yet. Upload the first one.'),
            'noMediaFound' => $t('Nothing found'),
            'loadMore' => $t('Show more'),
            'altHere' => $t('Alternative text for this place'),
            'altHereHint' => $t('Leave it empty to use the text from the media library.'),
            'removeImage' => $t('Remove the image'),
            'imageChosen' => $t('Change the image'),
            'noImage' => $t('No image'),
            'blockTools' => $t('Block {block}'),
            'parentBlock' => $t('Select the block around it'),
            'moveUp' => $t('Move up'),
            'moveDown' => $t('Move down'),
            'copyBlock' => $t('Copy the block'),
            'blockSettings' => $t('Settings of the block'),
            'insertBelow' => $t('Insert a block below'),
            'removeBlock' => $t('Delete the block'),
            'removeConfirm' => $t('Delete "{block}"?'),
            'removeYes' => $t('Delete'),
            'addBlock' => $t('Insert a block'),
            'intoArea' => $t('Into: {area}'),
            'search' => $t('Search'),
            'loading' => $t('Loading …'),
            'noBlocks' => $t('No block fits here.'),
            'areaFull' => $t('The area "{area}" takes no more blocks.'),
            'settingsOf' => $t('Settings: {block}'),
            'close' => $t('Close'),
            'blockGone' => $t('The block is no longer there. Load the page again.'),
            'variant' => $t('Variant'),
            'options' => $t('Options'),
            'content' => $t('Content'),
            'noLink' => $t('No link'),
            'entry' => $t('Entry {number}'),
            'addEntry' => $t('Add an entry'),
            'removeEntry' => $t('Remove the entry'),
            'noSettings' => $t('There is nothing to set for this block. Edit its content right on the page.'),
        ];
    }
}
