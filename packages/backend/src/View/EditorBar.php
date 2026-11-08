<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Design\Design;
use Frootbox\Backend\Http\Access\AccessHandler;
use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Asset\PublicAssets;
use Frootbox\Core\Design\DesignPage;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Language\Direction;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Media\ListMedia;
use Frootbox\Core\Media\ListMediumUsages;
use Frootbox\Core\Media\UploadReceiver;
use Frootbox\Core\ObjectField\MarkedObjects;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PageStatus;
use Frootbox\Core\Page\ShowPage;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Routing\Router;
use Frootbox\Core\Site\ShowProtection;
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
    private const string PAGE_CSS = 'fb-field,fb-area,fb-list,[data-fb-field]{outline:none}'
        . 'fb-field[data-fb-type="richtext"],fb-field[data-fb-type="table"],fb-area,fb-list{display:block}'
        . 'fb-area[data-fb-empty],fb-list[data-fb-empty]{display:grid;place-items:center;min-block-size:4rem;cursor:pointer}'
        . 'fb-area[data-fb-empty]::before,fb-list[data-fb-empty]::before{content:attr(data-fb-hint);opacity:.6;font:inherit}'
        . 'fb-missing{display:block;padding:1rem;border:1px dashed currentColor;opacity:.7}'
        . '[data-fb-field][contenteditable]{cursor:text}'
        . '[data-fb-field]:empty::before{content:attr(data-fb-label);opacity:.5}'
        . '[data-fb-field][data-fb-placeholder]:empty::before{content:attr(data-fb-placeholder)}'
        . '.ProseMirror{white-space:pre-wrap;overflow-wrap:break-word}'
        . '.ProseMirror-hideselection *::selection{background:transparent}'
        . '.ProseMirror :is(td,th)>p{margin:0}'
        . '.ProseMirror .selectedCell{background-color:color-mix(in srgb,Highlight 30%,transparent)}';

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
        private MarkedObjects $marked,
    ) {}

    public function __invoke(BuildingHead $event): void
    {
        if (null === $this->view->user() || !$this->permissions->can('page.show')) {
            return;
        }

        $id = null !== $event->target && $event->target->isPage() ? $event->target->id : null;
        $page = null === $id ? null : $this->page($id, $event->head->language);
        $config = [
            'editing' => $this->mode->active(),
            'marking' => $this->mode->marking(),
            'csrf' => $this->csrf->token($event->request),
            // Unsaved changes stay in the browser by person (decision 0330).
            'user' => $this->view->user()->id,
            'actions' => substr($this->router->path('backend.action', ['name' => 'x']), 0, -1),
            'queries' => substr($this->router->path('backend.query', ['name' => 'x']), 0, -1),
            'language' => $event->head->language,
            // The bar follows the language of the backend, not of the page (decision 0133).
            'ui' => ['language' => $this->translator->language(), 'direction' => Direction::of($this->translator->language())->value],
            'toggle' => $this->router->path('backend.edit-mode'),
            'pages' => $this->router->path('backend.pages'),
            // The search of the backend (decision 0217).
            'search' => ['src' => $this->router->path('backend.search'), 'labels' => $this->searchLabels()],
            // The help about editing (decision 0218).
            'help' => $this->help(),
            'uploads' => $this->router->path('backend.uploads'),
            // Files go in parts of this size (decision 0177).
            'uploadPart' => UploadReceiver::partBytes(),
            'mayUpload' => $this->permissions->can('media.create'),
            'mayReplace' => $this->permissions->can('media.replace'),
            'mayUpdateMedia' => $this->permissions->can('media.update'),
            'site' => $this->site(),
            'design' => $this->permissions->can('design.update') ? ['publish' => $this->permissions->can('design.publish'), 'discard' => $this->permissions->can('design.discard')] : null,
            'tokens' => $this->design->hostCss(),
            // Preview links and password protection (decisions 0152 and 0153).
            'preview' => $this->permissions->can('preview.create') ? ['durations' => $this->durations(), 'manage' => $this->permissions->can('preview.list') ? $this->router->path('backend.access') : null] : null,
            'access' => $this->permissions->can('preview.list') ? $this->router->path('backend.access') : null,
            'protection' => $this->runner->ask(new ShowProtection())->on,
            // Comments of the page (decision 0156).
            'comments' => $this->permissions->can('comment.list') ? ['resolve' => $this->permissions->can('comment.resolve'), 'delete' => $this->permissions->can('comment.delete')] : null,
            'page' => $page,
            // The history of a block (decision 0174).
            'history' => null === $id || null === $page ? null : [
                'screen' => $this->router->path('backend.pages.history', ['id' => $id]),
                'names' => HistoryNames::translated($this->translator->get(...)),
            ],
            // The design page of the core is no page one changes (decision 0207).
            'designPage' => true === $event->request->getAttribute(DesignPage::class),
            'media' => null === $id || null === $page ? null : $this->media($id),
            // Objects whose further fields the page marked (decision 0241).
            'objects' => null === $page ? [] : $this->objects(),
            'labels' => $this->labels(),
        ];

        $json = json_encode($config, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_HEX_TAG | \JSON_HEX_AMP);
        $event->head->add('<script type="application/json" id="' . self::CONFIG . '">' . $json . '</script>');

        if ($this->mode->active()) {
            $event->head->add('<style>' . self::PAGE_CSS . $this->partCss() . '</style>');
        }

        $event->head->add('<script type="module" src="' . Html::escape($this->public->versioned(self::SCRIPT)) . '"></script>');
    }

    /**
     * Names for the empty parts of fields while editing, e.g. the caption
     * of an image (decision 0203).
     */
    private function partCss(): string
    {
        $css = '';

        foreach (['caption' => 'Caption', 'copyright' => 'Copyright'] as $part => $label) {
            $css .= \sprintf('[data-fb-field][data-fb-part="%s"]:empty::before{content:"%s"}', $part, addcslashes($this->translator->get($label), '"\\'));
        }

        return $css;
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
            // For the bounds of its lists (decision 0145).
            'layout' => ($details->draft ?? $details->published)?->layout,
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
     * The media the page uses that have a draft (decision 0147), each with
     * how many published places elsewhere it changes, and what the user may
     * do with them; null without the right to see the media library.
     *
     * @return array{drafts: list<array{id: string, name: string, elsewhere: int}>, publish: bool, discard: bool}|null
     */
    private function media(string $id): ?array
    {
        if (!$this->permissions->can('media.list')) {
            return null;
        }

        $drafts = [];

        foreach ($this->runner->ask(new ListMedia(changed: true, pageId: $id, perPage: 200))->items as $medium) {
            $elsewhere = 0;

            foreach ($this->runner->ask(new ListMediumUsages($medium->id)) as $usage) {
                if ($usage->published && !('page' === $usage->type && $usage->id === $id)) {
                    ++$elsewhere;
                }
            }

            $drafts[] = ['id' => $medium->id, 'name' => $medium->fileName, 'elsewhere' => $elsewhere];
        }

        return ['drafts' => $drafts, 'publish' => $this->permissions->can('media.publish'), 'discard' => $this->permissions->can('media.discard')];
    }

    /**
     * The objects whose further fields the page marked for editing, e.g.
     * the article on its detail page (decision 0241): whether each has a
     * draft and what the user may do with it.
     *
     * @return list<array{target: string, type: string, id: string, name: string, draft: bool, publish: bool, discard: bool}>
     */
    private function objects(): array
    {
        $objects = [];

        foreach ($this->marked->all() as $object) {
            $label = $this->translator->get($object['label']);

            $objects[] = [
                'target' => $object['type'] . ':' . $object['id'],
                'type' => $object['type'],
                'id' => $object['id'],
                'name' => '' === $object['title'] ? $label : $this->translator->get('{type} "{title}"', ['type' => $label, 'title' => $object['title']]),
                'draft' => $object['draft'],
                'publish' => $this->permissions->can($object['type'] . '.publish', ['ids' => [$object['id']]]),
                'discard' => $this->permissions->can($object['type'] . '.discard', ['id' => $object['id']]),
            ];
        }

        return $objects;
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
     * How long a new preview link works, 14 days chosen.
     *
     * @return list<array{value: string, label: string, selected: bool}>
     */
    private function durations(): array
    {
        return array_map(fn(array $duration): array => [
            'value' => $duration['value'],
            'label' => $this->translator->get(['{count} day', '{count} days'], ['count' => $duration['days']]),
            'selected' => $duration['selected'],
        ], AccessHandler::durations());
    }

    /**
     * The help page about editing on the website for <fb-help>, if there is one.
     *
     * @return array{src: string, base: string, labels: array<string, string>}|null
     */
    private function help(): ?array
    {
        $link = HelpLink::find($this->runner, $this->router, 'screen:edit-mode');

        return null === $link ? null : ['src' => $link->url, 'base' => $this->router->path('backend.help'), 'labels' => HelpLink::labels($this->translator)];
    }

    /**
     * The texts of <fb-search>, as the macro ui.search gives them.
     *
     * @return array<string, string>
     */
    private function searchLabels(): array
    {
        $t = $this->translator->get(...);

        return [
            'search' => $t('Search'),
            'placeholder' => $t('Search pages, media, users …'),
            'close' => $t('Close'),
            'searching' => $t('Searching …'),
            'none' => $t('Nothing found for “{q}”.'),
            'found' => $t('{count} hits'),
            'failed' => $t('The search did not answer. Try again.'),
            'all' => $t('Show all hits'),
            'hint' => $t('↑ ↓ to choose, ↵ to open, Esc to close'),
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
            'changed' => $t('Pending changes'),
            'locked' => $t('Locked for visitors'),
            'readOnly' => $t('You may not change this page.'),
            'designPage' => $t('Every element of the website, in the draft.'),
            'publish' => $t('Publish'),
            'publishDone' => $t('The page is published.'),
            'changesPublished' => $t('The changes are published.'),
            'mediaElsewhere' => $t('Also changes {images} on other published pages.'),
            'mediaStayOpen' => $t('The page is published. The changes to {images} stay open: you may not publish images.'),
            'objectsStayOpen' => $t('The page is published. The changes to {objects} stay open: you may not publish them.'),
            'offlineParents' => $t('These pages above it are not online yet and are published with it: {pages}.'),
            'discard' => $t('Discard the draft'),
            'discardConfirm' => $t('Discard the draft?'),
            'discardYes' => $t('Discard'),
            'cancel' => $t('Cancel'),
            'discardDone' => $t('The draft is discarded.'),
            'showAll' => $t('Show all places'),
            'backend' => $t('Open in the backend'),
            'more' => $t('More options'),
            'thisPage' => $t('This page'),
            'website' => $t('Website'),
            'share' => $t('Share a preview …'),
            'shareTitle' => $t('Share a preview'),
            'shareNote' => $t('Note (optional)'),
            'shareNotePlaceholder' => $t('for Ms Miller'),
            'shareNoteHint' => $t('Who the link is for, so you know it again in the list.'),
            'shareDays' => $t('Works for'),
            'shareHint' => $t('The link shows the whole website with all drafts, without the editor bar. Whoever has it can pass it on. Revoke it when it is no longer needed.'),
            'shareCreate' => $t('Create the link'),
            'shareReady' => $t('The preview link is ready'),
            'shareLink' => $t('Preview link'),
            'shareCopy' => $t('Copy link'),
            'shareCopied' => $t('The link is copied.'),
            'shareDone' => $t('Done'),
            'shareManage' => $t('All preview links'),
            'access' => $t('Access and preview links'),
            'protectedSite' => $t('The website is password protected. Visitors need the password, search engines stay out.'),
            'collapse' => $t('Collapse the editor bar'),
            'expand' => $t('Show the editor bar'),
            'failed' => $t('The server cannot be reached. Check the connection and try again.'),
            'saving' => $t('Saving …'),
            'saved' => $t('Saved'),
            'error' => $t('Error'),
            'showError' => $t('Show what went wrong'),
            'explainStatus' => $t('What does that mean?'),
            'explainPublished' => $t('Visitors see exactly this version.'),
            'explainChanged' => $t('Visitors still see the published version until you publish.'),
            'explainDraft' => $t('The page is not online yet. Visitors see it once you publish it.'),
            'allSaved' => $t('All changes are saved.'),
            'oneProblem' => $t('One field still needs something.'),
            'problems' => $t('{count} fields still need something.'),
            'firstProblem' => $t('Go to the first one'),
            'nothingToUndo' => $t('Nothing to undo yet'),
            'allPublished' => $t('Everything is published'),
            'undo' => $t('Undo'),
            'reload' => $t('Load again'),
            'oneUnsaved' => $t('One change from your last visit was not saved.'),
            'unsaved' => $t('{count} changes from your last visit were not saved.'),
            'unsavedChanged' => $t('changed since'),
            'restoreUnsaved' => $t('Save them now'),
            'forgetUnsaved' => $t('Discard'),
            'keptUnsaved' => $t('This browser keeps your change and offers it again when you load the page.'),
            'formatting' => $t('Formatting'),
            'bold' => $t('Bold'),
            'italic' => $t('Italic'),
            'textStyle' => $t('Text style'),
            'textStyleHint' => $t('Text or heading. Also with Ctrl+Alt+0 to 3, or #, ## and ### at the start of a line.'),
            'normalText' => $t('Normal text'),
            'heading' => $t('Heading'),
            'subheading' => $t('Subheading'),
            'smallHeading' => $t('Small heading'),
            // The panel "Outline" (decision 0129).
            'outline' => $t('Outline'),
            'outlineHint' => $t('Each heading gets its level from where it stands. A click goes there.'),
            'outlineEmpty' => $t('This page has no headings yet.'),
            'outlineFailed' => $t('The outline could not be loaded.'),
            'outlineLevel' => $t('Heading level {level}'),
            'outlineAdjusted' => $t('Its level is adjusted so no level is skipped.'),
            'outlineFixed' => $t('The template writes this level.'),
            'outlineSkips' => $t('Skips a level.'),
            'outlineSecondMain' => $t('A second main heading.'),
            'outlineAdded' => $t('The page has no main heading of its own. Screen readers get its title as an invisible one at the start.'),
            'bulletList' => $t('List'),
            'orderedList' => $t('Numbered list'),
            'quote' => $t('Quote'),
            'otherDirection' => $t('Other writing direction'),
            'headerRow' => $t('Header row'),
            'headerColumn' => $t('Header column'),
            'rowsAndColumns' => $t('Rows and columns'),
            'rowAbove' => $t('Insert a row above'),
            'rowBelow' => $t('Insert a row below'),
            'columnBefore' => $t('Insert a column before'),
            'columnAfter' => $t('Insert a column after'),
            'deleteRow' => $t('Delete the row'),
            'deleteColumn' => $t('Delete the column'),
            'link' => $t('Link'),
            'linkText' => $t('Text'),
            'linkTarget' => $t('Address or page'),
            'linkHint' => $t('Search for a page or enter an address such as https://example.com.'),
            'linkPage' => $t('Page'),
            'noPages' => $t('No page found.'),
            'newWindow' => $t('Open in a new window'),
            'apply' => $t('Apply'),
            'removeLink' => $t('Remove the link'),
            'editLink' => $t('Edit the link'),
            'openLink' => $t('Open the link'),
            'openLinkHint' => $t('Open the link, also with Ctrl-click or Cmd-click on it'),
            'fieldTools' => $t('Field {field}'),
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
            'uploading' => $t('Uploading {done} of {total} … {percent} %'),
            'noMedia' => $t('No images yet. Upload the first one.'),
            'noMediaFound' => $t('Nothing found'),
            'alreadyInLibrary' => $t('“{name}” is already in the media library. The image there is used.'),
            'replaceWhere' => $t('The image here is used at other places as well. Should “{name}” replace it only here or everywhere?'),
            'replaceHere' => $t('Only here'),
            'replaceEverywhere' => $t('Everywhere ({count} places)'),
            'replacedInDraft' => $t('The new file counts everywhere. Visitors see it once the image is published.'),
            'replacedEverywhere' => $t('The new file counts everywhere.'),
            'loadMore' => $t('Show more'),
            'atThisPlace' => $t('At this place'),
            'pickImageFirst' => $t('Choose an image from the media library first.'),
            'pickVideoFirst' => $t('Choose a video from the media library first.'),
            'pickDocumentFirst' => $t('Choose a document from the media library first.'),
            'altHere' => $t('Alternative text'),
            'altHereHint' => $t('Leave it empty to use the text from the media library.'),
            'captionHere' => $t('Caption'),
            'copyrightHere' => $t('Copyright'),
            'copyrightExample' => $t('e.g. Anna Muster / image agency'),
            'copyrightHereHint' => $t('Leave it empty to use the copyright from the media library.'),
            'copyrightToMedium' => $t('Saved in the media library, it counts at every place that uses the image.'),
            'copyrightOnlyHere' => $t('Counts only at this place.'),
            'ai' => $t('AI'),
            'aiNone' => $t('Not made with AI'),
            'aiGenerated' => $t('Generated with AI'),
            'aiEdited' => $t('Edited with AI'),
            'aiHint' => $t('Saved in the media library. Images made or changed with AI show a small badge “AI” on the website.'),
            'removeImage' => $t('Remove the image'),
            'setFocusPoint' => $t('Set the focus point'),
            'focusPoint' => $t('Focus point'),
            'focusPosition' => $t('{x} % from the left, {y} % from the top'),
            'focusPointHint' => $t('Click where the image stays in view when a place cuts it. Saved in the media library, it counts at every place that uses the image.'),
            'clearField' => $t('Empty the field'),
            'imageChosen' => $t('Change the image'),
            'noImage' => $t('No image'),
            'chooseVideo' => $t('Choose a video'),
            'videoChosen' => $t('Change the video'),
            'removeVideo' => $t('Remove the video'),
            'noVideo' => $t('No video'),
            'noVideos' => $t('No videos yet. Upload the first one.'),
            'chooseDocument' => $t('Choose a document'),
            'documentChosen' => $t('Change the document'),
            'removeDocument' => $t('Remove the document'),
            'noDocument' => $t('No document'),
            'noDocuments' => $t('No documents yet. Upload the first one.'),
            'linkTextHere' => $t('Link text'),
            'linkTextHereHint' => $t('Leave it empty to use the title from the media library, else the file name.'),
            'chooseIcon' => $t('Choose a symbol'),
            'removeIcon' => $t('Remove the symbol'),
            'noIcon' => $t('No symbol'),
            'noChoice' => $t('None'),
            'icons' => $t('Symbols'),
            'noIcons' => $t('There are no symbols yet.'),
            'noIconFound' => $t('Nothing found'),
            'noOwnIcons' => $t('No own symbols yet. Upload an SVG graphic.'),
            'iconSet' => $t('Set'),
            'allIconSets' => $t('All sets'),
            'uploadSvg' => $t('Upload an SVG'),
            'notAnSvg' => $t('This is no SVG graphic. It is in the media library now.'),
            'videoTab' => $t('Video'),
            'posterTab' => $t('Poster image'),
            'videoHint' => $t('The description from the media library names the video for people who cannot see it.'),
            'posterHint' => $t('Shown before the video starts. Without one the browser shows the first picture of the video.'),
            'noPoster' => $t('No poster image'),
            'blockTools' => $t('Block {block}'),
            'parentBlock' => $t('Select the block around it'),
            'moveUp' => $t('Move up'),
            'moveDown' => $t('Move down'),
            'copyBlock' => $t('Copy the block'),
            'blockSettings' => $t('Settings of the block'),
            'insertAbove' => $t('Insert a block at the top'),
            'insertBelow' => $t('Insert a block below'),
            'removeBlock' => $t('Delete the block'),
            'blockHistory' => $t('History of the block'),
            'historyOf' => $t('History: {block}'),
            'noHistory' => $t('No changes yet.'),
            'historyFailed' => $t('The history cannot be loaded.'),
            'wholeHistory' => $t('Whole history in the backend'),
            'moreHistory' => $t('Older changes are in the backend.'),
            'before' => $t('Before:'),
            'after' => $t('After:'),
            'undone' => $t('Undone'),
            'system' => $t('System'),
            'unknown' => $t('Unknown'),
            'historyAdded' => $t('added'),
            'historyRemoved' => $t('removed'),
            'historyChanged' => $t('changed'),
            'removeConfirm' => $t('Delete "{block}"?'),
            'removeYes' => $t('Delete'),
            'addBlock' => $t('Insert a block'),
            'intoArea' => $t('Into: {area}'),
            'search' => $t('Search'),
            'loading' => $t('Loading …'),
            'noBlocks' => $t('No block fits here.'),
            'blockGroups' => $t('Groups'),
            // The groups of the core (decision 0148); those of extensions bring their title.
            'groups' => [
                'header' => $t('Headers'),
                'heading' => $t('Headings'),
                'text' => $t('Texts'),
                'media' => $t('Images and media'),
                'teaser' => $t('Teasers'),
                'callout' => $t('Callouts'),
                'list' => $t('Lists'),
                'form' => $t('Forms'),
                'structure' => $t('Structure'),
            ],
            'otherGroup' => $t('Other'),
            'siteGroup' => $t('For this website'),
            'allGroup' => $t('Show all'),
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
            'emptyList' => $t('{list}: add an entry'),
            'removeEntry' => $t('Remove the entry'),
            'entryTools' => $t('Entry {number} of "{list}"'),
            'moveEarlier' => $t('Move forward'),
            'moveLater' => $t('Move back'),
            'insertEntry' => $t('Add an entry after it'),
            'entriesMin' => $t('The list needs at least {count} entries.'),
            'entriesMax' => $t('The list takes at most {count} entries.'),
            'noSettings' => $t('There is nothing to set for this block. Edit its content right on the page.'),
            ...PreviewNote::commentLabels($this->translator),
            'resolve' => $t('Mark as done'),
            'reopen' => $t('Open again'),
            'deleteThread' => $t('Delete thread'),
            'deleteThreadConfirm' => $t('Delete the thread with all replies?'),
            'doneBy' => $t('Marked as done by {name}.'),
            'guest' => $t('Preview link'),
        ];
    }
}
