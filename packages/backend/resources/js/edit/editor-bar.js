import { LitElement, css, html, nothing } from 'lit';
import { Arranging, arrangingStyles } from './arranging.js';
import { CommentsPanel, commentStyles } from './comments.js';
import { DesignPanel, designStyles } from './design.js';
import { Editing } from './editing.js';
import { follow, registerFieldTools, toolsOf } from './field-tools.js';
import { icon } from './icons.js';
import { MediaPicker, mediaStyles } from './media.js';
import { OutlinePanel, outlineStyles } from './outline.js';
import { placesOf } from './problems.js';
import { SharePreview, shareStyles } from './share.js';

const COLLAPSED = 'fb-editor-bar-collapsed';
const THEME = 'fb-theme';
const UNDO = 'fb-edit-undo:';

/** What the bar marks: fields, blocks and empty areas (decision 0119). */
const MARKED = '[data-fb-field], [data-fb-block], fb-area[data-fb-area]';

function read(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key, value) {
    try {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } catch {
        // Private windows may refuse; the bar works without it.
    }
}

/** The name a marked place shows in its label. */
function labelOf(element) {
    return element.dataset.fbLabel ?? element.dataset.fbTitle ?? element.dataset.fbArea ?? '';
}

/** All pages of page.tree as a flat list with title and path. */
function flatten(nodes, language, parents = [], list = []) {
    for (const node of nodes) {
        const slug = node.slugs?.[language] ?? Object.values(node.slugs ?? {})[0] ?? '';
        const segments = slug ? [...parents, slug] : parents;
        const title = node.titles?.[language] ?? Object.values(node.titles ?? {})[0] ?? node.id;
        list.push({ id: node.id, title, path: '/' + segments.join('/') });
        flatten(node.children ?? [], language, segments, list);
    }

    return list;
}

/** Whether the input of the link dialog is an address rather than a search. */
function isAddress(text) {
    return /^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(text) || isDomain(text);
}

/** The address typed into the link dialog as a URL, "example.com" as https. */
function addressUrl(text) {
    try {
        return new URL(isDomain(text) && !/^[a-z][a-z0-9+.-]*:/i.test(text) ? `https://${text}` : text, location.href);
    } catch {
        return null;
    }
}

function isDomain(text) {
    return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text);
}

function readSession(key) {
    try {
        return JSON.parse(sessionStorage.getItem(key) ?? '[]');
    } catch {
        return [];
    }
}

function writeSession(key, list) {
    try {
        if (list.length === 0) {
            sessionStorage.removeItem(key);
        } else {
            sessionStorage.setItem(key, JSON.stringify(list));
        }
    } catch {
        // Undo then lasts until the page is loaded again.
    }
}

function kindOf(element) {
    if (element.hasAttribute('data-fb-field')) {
        return 'field';
    }

    if (element.hasAttribute('data-fb-block')) {
        return 'block';
    }

    return element.hasAttribute('data-fb-entry') ? 'entry' : 'area';
}

/**
 * <fb-editor-bar>: the editor bar of the editing mode on the website
 * (decisions 0119, 0137). It floats at the bottom over the theme, lives
 * in its own shadow DOM with the tokens of the backend and draws the
 * outlines of the marked places itself, so no CSS of the theme touches
 * it. Its data come from the JSON block #fb-edit-config that the backend
 * puts into the head.
 */
export class EditorBar extends LitElement {
    /** Buttons for the tab of a field type, e.g. of an extension (decision 0150). */
    static fieldTools(type, factory) {
        registerFieldTools(type, factory);
    }

    static properties = {
        config: { attribute: false },
        collapsed: { state: true },
        busy: { state: true },
        message: { state: true },
        confirming: { state: true },
        confirmingPublish: { state: true },
        showAll: { state: true },
        current: { state: true },
        undo: { state: true },
        link: { state: true },
        toolbar: { state: true },
        menu: { state: true },
        flash: { state: true },
        details: { state: true },
        problems: { state: true },
    };

    // Rules of the theme for the host win over normal ones in :host, but
    // not over important ones, so everything here is important (decision 0151).
    static styles = [css`
        :host {
            all: initial !important;
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            z-index: var(--fb-layer-edit) !important;
            pointer-events: none !important;
            font-family: var(--fb-font-family) !important;
            font-size: var(--fb-text-sm) !important;
            line-height: var(--fb-leading-tight) !important;
            color: var(--fb-text) !important;
        }

        *, *::before, *::after { box-sizing: border-box; }

        .bar, .round {
            position: absolute;
            inset-block-end: var(--fb-space-4);
            inset-inline-start: 50%;
            translate: -50% 0;
            pointer-events: auto;
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            box-shadow: var(--fb-shadow-lg);
        }

        .bar {
            --pad: var(--fb-space-2);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: var(--fb-space-2);
            inline-size: max-content;
            max-inline-size: calc(100vw - 2 * var(--fb-space-4));
            padding: var(--pad);
            border-radius: var(--fb-radius-lg);
        }

        .round {
            display: grid;
            place-items: center;
            inline-size: var(--fb-size-control);
            block-size: var(--fb-size-control);
            padding: 0;
            border-radius: var(--fb-radius-full);
            color: var(--fb-accent-text);
            cursor: pointer;
        }

        button, a {
            display: inline-flex;
            align-items: center;
            gap: var(--fb-space-2);
            min-block-size: var(--fb-size-control-sm);
            padding-inline: var(--fb-space-3);
            border: var(--fb-size-border) solid transparent;
            border-radius: var(--fb-radius-md);
            background: transparent;
            color: inherit;
            font: inherit;
            font-weight: var(--fb-weight-semibold);
            text-decoration: none;
            cursor: pointer;
            transition: background-color var(--fb-motion-fast);
        }

        button:hover, a:hover { background: var(--fb-surface-2); }

        button:focus-visible, a:focus-visible, .round:focus-visible {
            outline: var(--fb-size-focus) solid var(--fb-focus);
            outline-offset: var(--fb-size-focus-offset);
        }

        button[disabled] { cursor: progress; opacity: 0.6; }

        .primary { background: var(--fb-accent); color: var(--fb-on-accent); }
        .primary:hover { background: var(--fb-accent-hover); }

        .danger { color: var(--fb-danger-text); }
        .danger:hover { background: var(--fb-danger-bg); }
        .danger.solid { background: var(--fb-danger); color: var(--fb-on-danger); }

        [aria-pressed="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

        .icon {
            inline-size: var(--fb-size-icon-sm);
            block-size: var(--fb-size-icon-sm);
            flex: none;
        }

        .switch-track {
            position: relative;
            inline-size: calc(2 * var(--fb-size-check));
            block-size: var(--fb-size-check);
            border-radius: var(--fb-radius-full);
            background: var(--fb-border-strong);
            transition: background-color var(--fb-motion-fast);
        }

        .switch-track::after {
            content: "";
            position: absolute;
            inset-block-start: var(--fb-space-0);
            inset-inline-start: var(--fb-space-0);
            inline-size: calc(var(--fb-size-check) - 2 * var(--fb-space-0));
            block-size: calc(var(--fb-size-check) - 2 * var(--fb-space-0));
            border-radius: var(--fb-radius-full);
            background: var(--fb-surface);
            transition: translate var(--fb-motion-fast);
        }

        [role="switch"][aria-checked="true"] .switch-track { background: var(--fb-accent); }
        [role="switch"][aria-checked="true"] .switch-track::after { translate: var(--fb-size-check) 0; }

        .note { padding-inline: var(--fb-space-2); color: var(--fb-text-muted); }

        /*
         * The status docks at the end of the bar (decision 0140). All its
         * texts lie on top of each other in one grid cell and only the
         * current one is visible, so its width is that of the longest text
         * in every language and the bar never jumps.
         */
        .state-wrap {
            position: relative;
            display: flex;
            align-self: stretch;
            margin-block: calc(-1 * var(--pad));
            margin-inline-end: calc(-1 * var(--pad));
        }

        .state {
            display: flex;
            align-items: center;
            gap: var(--fb-space-2);
            padding-inline: var(--fb-space-4);
            border: 0;
            border-inline-start: var(--fb-size-border) solid var(--fb-border);
            border-radius: 0;
            border-start-end-radius: var(--fb-radius-lg);
            border-end-end-radius: var(--fb-radius-lg);
            font-weight: var(--fb-weight-semibold);
            cursor: default;
            transition: background-color var(--fb-motion-fast), color var(--fb-motion-fast);
        }

        button.state { cursor: pointer; }

        .state[data-tone="success"] { background: var(--fb-success-bg); color: var(--fb-success-text); }
        .state[data-tone="warning"] { background: var(--fb-warning-bg); color: var(--fb-warning-text); }
        .state[data-tone="danger"], .state[data-tone="danger"]:hover { background: var(--fb-danger-bg); color: var(--fb-danger-text); }

        .state-labels { display: grid; }

        .state-labels > span {
            grid-area: 1 / 1;
            display: flex;
            align-items: center;
            gap: var(--fb-space-2);
            white-space: nowrap;
            visibility: hidden;
        }

        .state-labels > .current { visibility: visible; }

        /* Dot, check and warning take the same room, so the check does not widen the bar. */
        .state-mark {
            display: grid;
            place-items: center;
            inline-size: var(--fb-size-icon-sm);
            block-size: var(--fb-size-icon-sm);
            flex: none;
        }

        .state-dot {
            inline-size: var(--fb-size-dot);
            block-size: var(--fb-size-dot);
            flex: none;
            border-radius: var(--fb-radius-full);
            background: currentcolor;
        }

        .state-dot.ring { background: transparent; box-shadow: inset 0 0 0 var(--fb-size-focus) currentcolor; }

        /* Saving is no state of its own, the mark pulses (decision 0141). */
        .state-dot.pulse { animation: fb-pulse calc(5 * var(--fb-motion-normal)) ease-in-out infinite; }

        @keyframes fb-pulse {
            50% { opacity: 0.25; }
        }

        .details {
            position: absolute;
            inset-block-end: calc(100% + var(--fb-space-2));
            inset-inline-end: 0;
            display: grid;
            gap: var(--fb-space-2);
            inline-size: max-content;
            max-inline-size: min(calc(100vw - 2 * var(--fb-space-4)), var(--fb-size-narrow));
            padding: var(--fb-space-3);
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            box-shadow: var(--fb-shadow-lg);
            color: var(--fb-text);
            font-weight: var(--fb-weight-regular);
        }

        .details[data-tone="danger"] { color: var(--fb-danger-text); }
        .details p, .details ul { margin: 0; }
        .details ul { padding-inline-start: var(--fb-space-4); }
        .details button { justify-self: start; color: var(--fb-text); }

        [aria-disabled="true"] { cursor: default; opacity: 0.5; }
        [aria-disabled="true"]:hover { background: transparent; }
        .primary[aria-disabled="true"], .primary[aria-disabled="true"]:hover { background: var(--fb-surface-2); color: var(--fb-text-muted); opacity: 1; }

        .outline {
            position: absolute;
            border: var(--fb-size-focus) solid var(--fb-accent);
            border-radius: var(--fb-radius-sm);
        }

        .outline[data-kind="block"], .outline[data-kind="area"], .outline[data-kind="entry"] { border-style: dashed; }
        .outline[data-kind="entry"] .label { display: none; }
        .outline[data-kind="area"] { background: var(--fb-accent-soft); opacity: 0.8; }
        .outline[data-kind="problem"] { border-color: var(--fb-danger); }
        .outline[data-kind="problem"] .label { background: var(--fb-danger); color: var(--fb-on-danger); }

        .label {
            position: absolute;
            inset-block-end: 100%;
            inset-inline-start: calc(-1 * var(--fb-size-focus));
            padding: var(--fb-space-0) var(--fb-space-2);
            border-radius: var(--fb-radius-sm) var(--fb-radius-sm) 0 0;
            background: var(--fb-accent);
            color: var(--fb-on-accent);
            font-size: var(--fb-text-2xs);
            font-weight: var(--fb-weight-semibold);
            white-space: nowrap;
        }

        /* The tab of the field under the pointer or with the focus carries its buttons (decision 0150). */
        .label.tools {
            display: flex;
            align-items: center;
            padding: 0;
            pointer-events: auto;
        }

        .label.tools > span { padding-inline: var(--fb-space-2); }

        .label.tools button {
            display: grid;
            place-items: center;
            min-inline-size: var(--fb-space-6);
            min-block-size: var(--fb-space-6);
            padding: 0;
            border: 0;
            border-inline-start: var(--fb-size-border) solid var(--fb-accent-hover);
            border-radius: 0;
            background: transparent;
            color: inherit;
            cursor: pointer;
        }

        .label.tools button:last-child { border-start-end-radius: var(--fb-radius-sm); }
        .label.tools button:hover { background: var(--fb-accent-hover); }
        .label.tools button:focus-visible { outline-offset: calc(-1 * var(--fb-size-focus)); outline-color: var(--fb-on-accent); }
        .label.tools button[disabled] { cursor: default; opacity: 0.5; }
        .label.tools .icon { inline-size: var(--fb-size-icon-sm); block-size: var(--fb-size-icon-sm); }
        .outline.below .label.tools button:last-child { border-start-end-radius: 0; border-end-end-radius: var(--fb-radius-sm); }

        .outline.below .label {
            inset-block: 100% auto;
            border-radius: 0 0 var(--fb-radius-sm) var(--fb-radius-sm);
        }

        .visually-hidden {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }


        .more { position: relative; display: flex; }

        .more > button { padding-inline: var(--fb-space-2); }

        .menu {
            position: absolute;
            inset-block-end: calc(100% + 2 * var(--fb-space-2));
            inset-inline-end: calc(-1 * var(--fb-space-2));
            display: grid;
            gap: var(--fb-space-0);
            min-inline-size: calc(var(--fb-size-narrow) / 2);
            padding: var(--fb-space-1);
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            box-shadow: var(--fb-shadow-lg);
        }

        .menu [role="group"] { display: grid; gap: var(--fb-space-0); }

        .menu [role="group"] + [role="group"] {
            margin-block-start: var(--fb-space-1);
            padding-block-start: var(--fb-space-1);
            border-block-start: var(--fb-size-border) solid var(--fb-border);
        }

        .menu-heading {
            padding: var(--fb-space-1) var(--fb-space-3);
            color: var(--fb-text-muted);
            font-size: var(--fb-text-xs);
            font-weight: var(--fb-weight-semibold);
        }

        .menu [role^="menuitem"] {
            justify-content: flex-start;
            inline-size: 100%;
            font-weight: var(--fb-weight-regular);
            white-space: nowrap;
        }

        .menu [role="menuitemcheckbox"][aria-checked="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

        .toolbar {
            position: absolute;
            display: flex;
            gap: var(--fb-space-1);
            padding: var(--fb-space-1);
            pointer-events: auto;
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-md);
            box-shadow: var(--fb-shadow-sm);
            translate: 0 calc(-100% - var(--fb-space-2));
        }

        .toolbar.below { translate: 0 var(--fb-space-2); }

        .toolbar button {
            justify-content: center;
            min-inline-size: var(--fb-size-control-sm);
            padding-inline: var(--fb-space-1);
        }

        .toolbar select {
            min-block-size: var(--fb-size-control-sm);
            padding-inline: var(--fb-space-2);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: inherit;
            font: inherit;
            font-size: var(--fb-text-sm);
        }

        .toolbar select:focus-visible {
            outline: var(--fb-size-focus) solid var(--fb-focus);
            outline-offset: var(--fb-size-focus-offset);
        }

        dialog {
            pointer-events: auto;
            inline-size: min(calc(100vw - 2 * var(--fb-space-4)), var(--fb-size-dialog));
            padding: var(--fb-space-5);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            background: var(--fb-surface);
            color: var(--fb-text);
            box-shadow: var(--fb-shadow-lg);
            font: inherit;
        }

        dialog::backdrop { background: var(--fb-backdrop); }

        dialog form { display: grid; gap: var(--fb-space-3); }

        dialog h2 {
            margin: 0;
            font-size: var(--fb-text-lg);
            font-weight: var(--fb-weight-bold);
        }

        dialog label { display: grid; gap: var(--fb-space-1); font-weight: var(--fb-weight-semibold); }

        dialog input:not([type]), dialog input[type="text"] {
            min-block-size: var(--fb-size-control);
            padding-inline: var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border-strong);
            border-radius: var(--fb-radius-md);
            background: var(--fb-surface);
            color: inherit;
            font: inherit;
            font-weight: var(--fb-weight-regular);
        }

        dialog input:focus-visible {
            outline: var(--fb-size-focus) solid var(--fb-focus);
            outline-offset: var(--fb-size-focus-offset);
        }

        dialog .check { display: flex; align-items: center; gap: var(--fb-space-2); font-weight: var(--fb-weight-regular); }

        .hint { margin: 0; color: var(--fb-text-muted); font-size: var(--fb-text-xs); }

        .results {
            display: grid;
            gap: var(--fb-space-0);
            max-block-size: calc(6 * var(--fb-size-control));
            margin: 0;
            padding: 0;
            overflow-y: auto;
            list-style: none;
        }

        .results button {
            inline-size: 100%;
            justify-content: space-between;
            font-weight: var(--fb-weight-regular);
            text-align: start;
        }

        .results small, .chosen small { color: var(--fb-text-muted); }

        .chosen {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--fb-space-2);
            min-block-size: var(--fb-size-control);
            padding-inline: var(--fb-space-3);
            border-radius: var(--fb-radius-md);
            background: var(--fb-accent-soft);
        }

        .actions { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); justify-content: flex-end; }
        .actions .open { margin-inline-end: auto; }

        /*
         * On a phone the bar stays one line: the status is a dot like in
         * the sitemap, the switch and "Undo" are icons (their text stays
         * for screen readers and in the tooltip), and only "Publish" may
         * shorten its text if the screen is very narrow.
         */
        @media (max-width: 30rem) {
            .bar { --pad: var(--fb-space-1); flex-wrap: nowrap; gap: var(--fb-space-1); }
            .bar > * { flex-shrink: 0; }
            .bar > button { padding-inline: var(--fb-space-2); }
            .state { padding-inline: var(--fb-space-1); }

            .bar > .primary {
                display: block;
                flex-shrink: 1;
                min-inline-size: 0;
                overflow: hidden;
                line-height: var(--fb-size-control-sm);
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .state-text, .button-text {
                position: absolute;
                inline-size: 1px;
                block-size: 1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; animation: none !important; }
        }
    `, arrangingStyles, mediaStyles, designStyles, shareStyles, commentStyles, outlineStyles];

    constructor() {
        super();
        this.config = null;
        this.collapsed = read(COLLAPSED) === '1';
        this.busy = false;
        this.message = null;
        this.confirming = false;
        this.confirmingPublish = false;
        this.showAll = false;
        this.current = null;
        this.undo = [];
        this.link = null;
        this.toolbar = null;
        this.menu = false;
        this.flash = false;
        this.flashTimer = 0;
        this.details = false;
        // What publishing found missing, with the places to mark (decision 0143).
        this.problems = [];
        this.problemsText = '';
        this.onOutside = (event) => {
            const path = event.composedPath();

            if (this.menu && !path.includes(this.renderRoot.querySelector('.more'))) {
                this.menu = false;
            }

            if (this.details && !path.includes(this.renderRoot.querySelector('.state-wrap'))) {
                this.details = false;
            }
        };
        this.saving = 0;
        this.pages = null;
        this.editing = null;
        this.arranging = null;
        this.media = new MediaPicker(this);
        this.design = new DesignPanel(this);
        this.share = new SharePreview(this);
        this.comments = new CommentsPanel(this);
        this.outline = new OutlinePanel(this);
        this.frame = 0;
        this.redraw = () => {
            if (this.frame === 0 && (this.current || this.showAll || this.toolbar || this.arranging?.block || this.problems.length > 0 || this.comments.threads.length > 0)) {
                this.frame = requestAnimationFrame(() => {
                    this.frame = 0;
                    this.requestUpdate();
                });
            }
        };
        this.onPoint = (event) => this.point(event.target);
        this.onLeave = (event) => {
            if (!event.relatedTarget) {
                this.current = null;
            }
        };
        this.onFocus = (event) => this.point(event.target);
    }

    createRenderRoot() {
        const root = super.createRenderRoot();
        const tokens = new CSSStyleSheet();
        tokens.replaceSync(this.config?.tokens ?? '');
        root.adoptedStyleSheets = [tokens, ...root.adoptedStyleSheets];

        return root;
    }

    connectedCallback() {
        super.connectedCallback();
        this.raise();
        document.addEventListener('pointerdown', this.onOutside, true);
        const theme = read(THEME);

        if (theme === 'light' || theme === 'dark') {
            this.dataset.theme = theme;
        }

        if (this.marking) {
            this.undo = readSession(this.undoKey);
            this.editing = new Editing(this);
            this.editing.start();
            this.arranging = new Arranging(this);
            this.arranging.start();
            document.addEventListener('pointerover', this.onPoint, true);
            document.addEventListener('pointerout', this.onLeave, true);
            document.addEventListener('focusin', this.onFocus, true);
            addEventListener('scroll', this.redraw, { passive: true, capture: true });
            addEventListener('resize', this.redraw, { passive: true });
        } else if (this.config?.editing && this.config?.comments) {
            // Pins of comments follow their places on pages one may not change as well.
            addEventListener('scroll', this.redraw, { passive: true, capture: true });
            addEventListener('resize', this.redraw, { passive: true });
        }

        // Comments of the page, for the counter and the pins (decision 0156).
        if (this.config?.editing) {
            this.comments.load();
        }

        // The menu entry "Design" of the backend opens the website with the panel.
        if (location.hash === '#fb-design' && this.config?.design && this.config.editing) {
            history.replaceState(null, '', location.pathname + location.search);
            this.updateComplete.then(() => this.design.show());
        }
    }

    /**
     * Puts the bar into the top layer, where the window is its frame even
     * if the theme sets a transform or filter on html or body (decision 0151).
     * A manual popover closes neither with Escape nor with other popovers.
     */
    raise() {
        if (typeof this.showPopover !== 'function') {
            return;
        }

        this.popover = 'manual';

        if (!this.matches(':popover-open')) {
            this.showPopover();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('pointerdown', this.onOutside, true);
        this.editing?.stop();
        this.arranging?.stop();
        this.comments.stopPicking();
        document.removeEventListener('pointerover', this.onPoint, true);
        document.removeEventListener('pointerout', this.onLeave, true);
        document.removeEventListener('focusin', this.onFocus, true);
        removeEventListener('scroll', this.redraw, { capture: true });
        removeEventListener('resize', this.redraw);
    }

    /**
     * Panels end above the bar, whose height changes with its content,
     * and the page gets as much room at its end, so the bar never covers
     * the footer.
     */
    updated() {
        const bar = this.renderRoot.querySelector('.bar, .round');
        const height = bar ? `${Math.ceil(bar.getBoundingClientRect().height)}px` : '0px';

        if (this.style.getPropertyValue('--bar-block-size') !== height) {
            this.style.setProperty('--bar-block-size', height);
            document.body.style.paddingBlockEnd = bar ? `calc(${height} + 2rem)` : '';
        }
    }

    get marking() {
        return Boolean(this.config?.editing && this.config?.marking);
    }

    get undoKey() {
        return UNDO + (this.config?.page?.id ?? '');
    }

    get labels() {
        return this.config?.labels ?? {};
    }

    render() {
        if (!this.config) {
            return nothing;
        }

        const arranging = this.arranging;

        return html`${this.outlines()}${this.config.editing ? this.comments.pins() : nothing}${this.comments.pickHint()}${arranging?.tools() ?? nothing}${arranging?.entryTools() ?? nothing}${this.toolbarView()}${arranging?.panelView() ?? nothing}${this.design.view()}${this.comments.view()}${this.outline.view()}${this.collapsed ? this.round() : this.bar()}${arranging?.pickerDialog() ?? nothing}${this.linkDialog()}${this.media.dialog()}${this.share.dialog()}`;
    }

    round() {
        return html`<button type="button" class="round" aria-label=${this.labels.expand} title=${this.labels.expand}
            aria-expanded="false" @click=${() => this.collapse(false)}>${icon('pencil')}</button>`;
    }

    bar() {
        const { editing, page } = this.config;
        const labels = this.labels;

        return html`<div class="bar" role="region" aria-label=${labels.bar}>
            <button type="button" role="switch" aria-checked=${editing ? 'true' : 'false'} ?disabled=${this.busy} title=${labels.edit}
                @click=${() => this.toggle(!editing)}>
                <span class="switch-track" aria-hidden="true"></span><span class="button-text">${labels.edit}</span>
            </button>
            ${editing ? this.pageControls(page) : nothing}
            ${editing ? this.comments.button() : nothing}
            ${this.more()}
            <button type="button" aria-label=${labels.collapse} title=${labels.collapse} aria-expanded="true"
                @click=${() => this.collapse(true)}>${icon('collapse')}</button>
            ${this.stateView()}
            <p class="visually-hidden" role="status">${this.message?.text ?? ''}</p>
        </div>`;
    }

    /**
     * What the status shows: only whether visitors see what one sees
     * (decision 0141), an error first.
     */
    get state() {
        const page = this.config.editing ? this.config.page : null;

        if (this.message?.tone === 'danger' || this.problems.length > 0) {
            return 'error';
        }

        return page ? this.drafts(page).status : null;
    }

    stateView() {
        const state = this.state;

        if (state === null) {
            return nothing;
        }

        const labels = this.labels;
        const tones = { published: 'success', changed: 'warning', draft: 'warning', error: 'danger' };
        const locked = this.config.editing && this.config.page?.locked;
        const text = labels[state] ?? state;

        // Saving only shows in the mark: it pulses, then a check stays for a moment.
        const mark = (key) => {
            if (key === 'error') {
                return icon('warning');
            }

            if (key === state && this.flash && this.saving === 0) {
                return icon('check');
            }

            return html`<span class="state-dot ${key === 'draft' ? 'ring' : ''} ${key === state && this.saving > 0 ? 'pulse' : ''}"></span>`;
        };

        return html`<div class="state-wrap" @keydown=${(event) => this.detailsKey(event)}>
            <button type="button" class="state" data-state=${state} data-tone=${tones[state]}
                title=${state === 'error' ? labels.showError : labels.explainStatus}
                aria-expanded=${this.details ? 'true' : 'false'} aria-controls="fb-state-details"
                @click=${() => { this.details = !this.details; }}>
                <span class="visually-hidden">${labels.status}: ${text}${locked ? `, ${labels.locked}` : ''}</span>
                ${locked ? icon('lock') : nothing}
                <span class="state-labels" aria-hidden="true">${Object.keys(tones).map((key) => html`<span class=${key === state ? 'current' : ''}><span class="state-mark">${mark(key)}</span><span class="state-text">${labels[key] ?? key}</span></span>`)}</span>
            </button>
            ${this.details ? html`<div class="details" id="fb-state-details" data-tone=${tones[state]}>${this.explanation(state, locked)}</div>` : nothing}
        </div>`;
    }

    /** What the status means, in a sentence or two (decision 0141). */
    explanation(state, locked) {
        const labels = this.labels;

        if (state === 'error' && this.problems.length > 0) {
            return this.problemsView();
        }

        if (state === 'error') {
            return html`<p>${this.message.text}</p>
                ${this.message.reload ? html`<button type="button" @click=${() => location.reload()}>${labels.reload}</button>` : nothing}`;
        }

        const saved = state === 'published' ? nothing : html`<p>${this.saving > 0 ? labels.saving : labels.allSaved}</p>`;

        return html`<p>${labels[`explain${state[0].toUpperCase()}${state.slice(1)}`]}</p>
            ${saved}
            ${locked ? html`<p>${labels.locked}.</p>` : nothing}
            ${this.config.protection ? html`<p>${labels.protectedSite}</p>` : nothing}`;
    }

    /**
     * What publishing found missing: how many, a way to the first marked
     * field, and those the page does not show by block and field.
     */
    problemsView() {
        const labels = this.labels;
        const count = this.problems.length;
        const shown = this.problems.filter((problem) => problem.element?.isConnected);
        const hidden = this.problems.filter((problem) => !problem.element?.isConnected);
        const where = (problem) => [problem.block?.dataset.fbTitle, problem.path].filter(Boolean).join(' · ');

        return html`<p>${this.problemsText}</p>
            <p>${count === 1 ? labels.oneProblem : labels.problems.replace('{count}', count)}</p>
            ${hidden.length > 0 ? html`<ul>${hidden.map((problem) => html`<li>${where(problem) ? `${where(problem)}: ` : ''}${problem.message}</li>`)}</ul>` : nothing}
            ${shown.length > 0 ? html`<button type="button" data-fb-first-problem @click=${() => this.showProblem(shown[0].element)}>${labels.firstProblem}</button>` : nothing}`;
    }

    /** Scrolls to a marked field and puts the focus into it. */
    showProblem(element) {
        this.details = false;
        element.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        element.focus({ preventScroll: true });
    }

    /** A field got a value: its mark goes, and with the last one the error. */
    solved(element) {
        if (!this.problems.some((problem) => problem.element === element)) {
            return;
        }

        this.problems = this.problems.filter((problem) => problem.element !== element);

        if (this.problems.length === 0) {
            this.details = false;
        }
    }

    detailsKey(event) {
        if (event.key === 'Escape' && this.details) {
            event.preventDefault();
            event.stopPropagation();
            this.details = false;
            this.renderRoot.querySelector('.state')?.focus();
        }
    }

    /** "Saved" stays a moment, then the status of the page comes back. */
    saved() {
        clearTimeout(this.flashTimer);
        this.flash = true;
        this.flashTimer = setTimeout(() => { this.flash = false; }, 2000);
    }

    /**
     * What the drafts of the page, of the fields of the website (decision
     * 0128) and of the media the page uses (decision 0147) allow.
     */
    drafts(page) {
        const site = this.siteDraft;
        const media = this.mediaDrafts.length > 0;
        // Media drafts count for those who may publish them; others publish only the page.
        const mediaOpen = media && this.config.media.publish;

        return {
            status: page.status === 'published' && (site || mediaOpen) ? 'changed' : page.status,
            canPublish: page.canPublish || (site && this.config.site.publish) || mediaOpen,
            canDiscard: page.canDiscard || (site && this.config.site.discard) || (media && this.config.media.discard),
        };
    }

    /**
     * The menu "More" (decision 0139): what is needed less often, in
     * sections for this page and for the whole website, each entry only
     * with its right. Without entries there is no menu.
     */
    more() {
        const { editing, page } = this.config;
        const labels = this.labels;
        const canDiscard = editing && page && !this.confirming && this.drafts(page).canDiscard;
        const forPage = [
            this.marking ? html`<button type="button" role="menuitemcheckbox" aria-checked=${this.showAll ? 'true' : 'false'}
                @click=${() => this.choose(() => { this.showAll = !this.showAll; })}>${icon('places')}${labels.showAll}</button>` : nothing,
            editing && page ? html`<button type="button" role="menuitem"
                @click=${() => this.choose(() => this.outline.show())}>${icon('outline')}${labels.outline}</button>` : nothing,
            page ? html`<a role="menuitem" href=${page.backend}>${icon('external')}${labels.backend}</a>` : nothing,
            canDiscard ? html`<button type="button" role="menuitem" class="danger" ?disabled=${this.busy}
                @click=${() => this.choose(() => this.confirm())}>${icon('trash')}${labels.discard}</button>` : nothing,
        ].filter((item) => item !== nothing);
        const forSite = [
            this.config.design && editing ? html`<button type="button" role="menuitem"
                @click=${() => this.choose(() => this.design.show())}>${icon('palette')}${labels.design}</button>` : nothing,
            this.config.preview ? html`<button type="button" role="menuitem"
                @click=${() => this.choose(() => this.share.show(() => this.renderRoot.querySelector('[data-fb-more]')?.focus()))}>${icon('link')}${labels.share}</button>` : nothing,
            this.config.access ? html`<a role="menuitem" href=${this.config.access}>${icon('lock')}${labels.access}</a>` : nothing,
        ].filter((item) => item !== nothing);

        if (forPage.length === 0 && forSite.length === 0) {
            return nothing;
        }

        const group = (id, heading, items) => items.length === 0 ? nothing : html`<div role="group" aria-labelledby=${id}>
            <div class="menu-heading" id=${id} role="presentation">${heading}</div>${items}</div>`;

        // A click keeps the focus where it is: Safari would otherwise move it to the page on
        // pressing the mouse, the menu would close, and the click would hit nothing.
        return html`<div class="more" @focusout=${(event) => this.leaveMenu(event)} @mousedown=${(event) => event.preventDefault()}>
            <button type="button" data-fb-more aria-haspopup="menu" aria-expanded=${this.menu ? 'true' : 'false'} aria-controls="fb-more-menu"
                aria-label=${labels.more} title=${labels.more} @click=${() => (this.menu ? this.closeMenu() : this.openMenu(true))}
                @keydown=${(event) => this.moreKey(event)}>${icon('more')}</button>
            ${this.menu ? html`<div class="menu" id="fb-more-menu" role="menu" aria-label=${labels.more} @keydown=${(event) => this.menuKey(event)}>
                ${group('fb-more-page', labels.thisPage, forPage)}${group('fb-more-site', labels.website, forSite)}
            </div>` : nothing}
        </div>`;
    }

    get menuItems() {
        return [...this.renderRoot.querySelectorAll('.menu [role^="menuitem"]')];
    }

    async openMenu(open, last = false) {
        this.menu = open;

        if (open) {
            await this.updateComplete;
            const items = this.menuItems;
            (last ? items.at(-1) : items[0])?.focus();
        }
    }

    async closeMenu() {
        this.menu = false;
        await this.updateComplete;
        this.renderRoot.querySelector('[data-fb-more]')?.focus();
    }

    /** Runs an entry and closes the menu; the entry decides where the focus goes. */
    choose(run) {
        this.menu = false;
        run();
    }

    moreKey(event) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.openMenu(true, event.key === 'ArrowUp');
        }
    }

    /** Arrow keys, Home and End move through the entries, Escape closes (menu pattern of the ARIA guide). */
    menuKey(event) {
        const items = this.menuItems;
        const index = items.indexOf(this.renderRoot.activeElement);
        const next = {
            ArrowDown: (index + 1) % items.length,
            ArrowUp: (index - 1 + items.length) % items.length,
            Home: 0,
            End: items.length - 1,
        }[event.key];

        if (next !== undefined) {
            event.preventDefault();
            items[next]?.focus();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeMenu();
        } else if (event.key === 'Tab') {
            this.menu = false;
        }
    }

    leaveMenu(event) {
        if (this.menu && !event.currentTarget.contains(event.relatedTarget)) {
            this.menu = false;
        }
    }

    /** "Discard the draft" asks in the bar first; the focus waits on "Cancel". */
    async confirm() {
        this.confirming = true;
        await this.updateComplete;
        this.renderRoot.querySelector('[data-fb-cancel]')?.focus();
    }

    async cancelConfirm() {
        this.confirming = false;
        await this.updateComplete;
        this.renderRoot.querySelector('[data-fb-more]')?.focus();
    }

    pageControls(page) {
        const labels = this.labels;

        if (!page) {
            return html`<span class="note">${labels.readOnly}</span>`;
        }

        if (this.confirmingPublish) {
            return html`<span class="note">${labels.mediaElsewhere.replace('{images}', this.imageNames(this.mediaDrafts.filter((draft) => draft.elsewhere > 0)))}</span>
                <button type="button" class="primary" ?disabled=${this.busy} @click=${() => this.publish(true)}>${labels.publish}</button>
                <button type="button" data-fb-cancel @click=${() => this.cancelPublish()}>${labels.cancel}</button>`;
        }

        if (this.confirming) {
            return html`<span class="note">${labels.discardConfirm}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${() => this.discard()}>${labels.discardYes}</button>
                <button type="button" data-fb-cancel @click=${() => this.cancelConfirm()}>${labels.cancel}</button>`;
        }

        const { canPublish } = this.drafts(page);
        const mayPublish = page.mayPublish || this.config.site?.publish || this.config.media?.publish;
        const undo = this.undo.length > 0;

        // Both stay in place without anything to do, so the bar keeps its width (decision 0140).
        return html`
            ${this.config.marking ? nothing : html`<span class="note">${labels.readOnly}</span>`}
            ${this.config.marking ? html`<button type="button" ?disabled=${this.busy} aria-disabled=${undo ? 'false' : 'true'}
                title=${undo ? labels.undo : labels.nothingToUndo}
                @click=${() => { if (undo) { this.undoLast(); } }}>${icon('undo')}<span class="button-text">${labels.undo}</span></button>` : nothing}
            ${mayPublish ? html`<button type="button" class="primary" ?disabled=${this.busy} aria-disabled=${canPublish ? 'false' : 'true'}
                title=${!canPublish ? labels.allPublished : page.canPublish && page.offlineParents.length ? labels.offlineParents.replace('{pages}', page.offlineParents.join(', ')) : nothing}
                @click=${() => { if (canPublish) { this.publish(); } }}>${labels.publish}</button>` : nothing}`;
    }

    /** Outlines with labels over the marked places, fixed to the viewport. */
    outlines() {
        if (!this.marking) {
            return nothing;
        }

        const selected = this.arranging?.block;
        const entry = this.arranging?.entry?.element;
        const elements = this.showAll
            ? [...document.querySelectorAll(`${MARKED}, [data-fb-entry]`)]
            : [...new Set([selected, entry, this.current].filter((element) => element?.isConnected))];

        // A field with a problem has its own outline.
        const marked = new Set(this.problems.map((problem) => problem.element));

        return html`${this.showAll ? this.outline.badges() : nothing}${this.problemOutlines()}${elements.filter((element) => !marked.has(element)).map((element) => {
            const rect = element.getBoundingClientRect();

            if (rect.width === 0 && rect.height === 0) {
                return nothing;
            }

            const below = rect.top < 24;

            return html`<div class="outline ${below ? 'below' : ''}" data-kind=${kindOf(element)}
                style="inset-block-start: ${rect.top}px; inset-inline-start: ${rect.left}px; inline-size: ${rect.width}px; block-size: ${rect.height}px">
                ${this.fieldTab(element, labelOf(element))}
            </div>`;
        })}`;
    }

    /**
     * Fields that publishing found missing, in danger (decision 0143). The
     * one under the pointer or with the focus says why, the others only
     * their name, so labels in narrow places do not cover each other.
     */
    problemOutlines() {
        return this.problems.filter((problem) => problem.element?.isConnected).map(({ element, message }) => {
            const rect = element.getBoundingClientRect();

            if (rect.width === 0 && rect.height === 0) {
                return nothing;
            }

            return html`<div class="outline ${rect.top < 24 ? 'below' : ''}" data-kind="problem"
                style="inset-block-start: ${rect.top}px; inset-inline-start: ${rect.left}px; inline-size: ${rect.width}px; block-size: ${rect.height}px">
                ${this.fieldTab(element, element === this.current ? `${labelOf(element)}: ${message}` : labelOf(element))}
            </div>`;
        });
    }

    /**
     * The tab over a marked place; for the current field with buttons it
     * is a toolbar (decision 0150).
     */
    fieldTab(element, text) {
        const tools = element === this.current && element.hasAttribute('data-fb-field') && this.editing ? toolsOf(element, this) : [];

        if (tools.length === 0) {
            return html`<span class="label">${text}</span>`;
        }

        return html`<div class="label tools" role="toolbar" aria-label=${this.labels.fieldTools.replace('{field}', labelOf(element))}
            @keydown=${(event) => this.fieldToolsKey(event, element)}>
            <span>${text}</span>
            ${tools.map((tool) => html`<button type="button" class=${tool.tone ?? ''} aria-label=${tool.label} title=${tool.title ?? tool.label}
                ?disabled=${tool.disabled || this.busy} @click=${() => tool.run()}>${icon(tool.icon)}</button>`)}
        </div>`;
    }

    /** Whether a field has buttons on its tab, for Alt+F10. */
    hasFieldTools(field) {
        return toolsOf(field, this).length > 0;
    }

    focusFieldTools(field) {
        this.current = field;
        this.requestUpdate();
        this.updateComplete.then(() => this.renderRoot.querySelector('.label.tools button:not([disabled])')?.focus());
    }

    fieldToolsKey(event, field) {
        const buttons = [...this.renderRoot.querySelectorAll('.label.tools button:not([disabled])')];
        const at = buttons.indexOf(this.renderRoot.activeElement);

        if (event.key === 'Escape') {
            event.preventDefault();
            field.focus();
        } else if (event.key === 'F10' && event.altKey) {
            // On to the buttons of the entry and the block.
            event.preventDefault();
            this.arranging?.reachTools(field);
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const step = event.key === 'ArrowRight' ? 1 : -1;
            buttons[(at + step + buttons.length) % buttons.length]?.focus();
        }
    }

    point(target) {
        // The pointer on the bar, e.g. on the buttons of a tab, keeps the current place.
        if (target === this) {
            return;
        }

        this.arranging?.select(target);
        const element = target instanceof Element ? target.closest(MARKED) : null;

        if (element !== this.current) {
            this.current = element;
        }
    }

    collapse(collapsed) {
        this.collapsed = collapsed;
        write(COLLAPSED, collapsed ? '1' : null);
        this.updateComplete.then(() => this.renderRoot.querySelector(collapsed ? '.round' : '[role="switch"]')?.focus());
    }

    async toggle(on) {
        this.busy = true;
        const response = await this.send(this.config.toggle, new URLSearchParams({ on: on ? '1' : '0' }));

        if (response?.ok) {
            this.go(on);

            return;
        }

        this.fail(response);
    }

    /**
     * After switching: the address of the page may differ between draft
     * and published state; a page that was never published has none.
     */
    go(on) {
        const page = this.config.page;
        const target = !page ? null : on ? page.draftUrl : page.visitorUrl ?? page.backend;

        if (target && new URL(target, location.href).pathname !== location.pathname) {
            location.assign(target);
        } else {
            location.reload();
        }
    }

    /** Whether the fields of the website have a draft (decision 0128). */
    get siteDraft() {
        return Boolean(this.config?.site?.draft);
    }

    /** The media the page uses that have a draft: [{ id, name, elsewhere }] (decision 0147). */
    get mediaDrafts() {
        return this.config?.media?.drafts ?? [];
    }

    /** After choosing an image with a draft for a field: it counts for the page now. */
    mediaChosen(medium) {
        if (!medium?.draft || !this.config.media || this.mediaDrafts.some((draft) => draft.id === medium.id)) {
            return;
        }

        this.config = { ...this.config, media: { ...this.config.media, drafts: [...this.mediaDrafts, { id: medium.id, name: medium.fileName, elsewhere: 0 }] } };
    }

    imageNames(drafts) {
        return drafts.map((draft) => `„${draft.name}“`).join(', ');
    }

    async cancelPublish() {
        this.confirmingPublish = false;
        await this.updateComplete;
        this.renderRoot.querySelector('button.primary')?.focus();
    }

    /**
     * Publishes the page, the fields of the website and the media the page
     * uses, whichever has a draft. If a medium changes other published
     * pages as well, the bar says so first (decision 0147).
     */
    async publish(confirmed = false) {
        const page = this.config.page;
        const media = this.config.media;
        const publishMedia = media?.publish && this.mediaDrafts.length > 0;

        if (!confirmed && publishMedia && this.mediaDrafts.some((draft) => draft.elsewhere > 0)) {
            this.confirmingPublish = true;
            await this.updateComplete;
            this.renderRoot.querySelector('[data-fb-cancel]')?.focus();

            return;
        }

        this.confirmingPublish = false;
        this.busy = true;
        this.problems = [];
        await this.editing?.flushAll();

        if (page.canPublish) {
            const response = await this.action('page.publish', { ids: page.publish });

            if (!response?.ok) {
                this.busy = false;
                this.fail(response, true);

                return;
            }

            // Visitors now find the page where the draft is.
            this.config = { ...this.config, page: { ...page, status: 'published', published: true, canPublish: false, canDiscard: false, offlineParents: [], visitorUrl: page.draftUrl } };
        }

        if (this.siteDraft && this.config.site.publish) {
            const response = await this.action('site.publish', {});

            if (!response?.ok) {
                this.busy = false;
                this.fail(response, true);

                return;
            }

            this.config = { ...this.config, site: { ...this.config.site, draft: false } };
        }

        if (publishMedia) {
            const response = await this.action('media.publish', { ids: this.mediaDrafts.map((draft) => draft.id) });

            if (!response?.ok) {
                this.busy = false;
                this.fail(response, true);

                return;
            }

            this.config = { ...this.config, media: { ...media, drafts: [] } };
        }

        this.busy = false;
        this.forget();
        // Without the right to publish media, their drafts stay open; the bar names them.
        this.message = this.mediaDrafts.length > 0
            ? { tone: 'info', text: this.labels.mediaStayOpen.replace('{images}', this.imageNames(this.mediaDrafts)) }
            : { tone: 'info', text: this.labels.publishDone };
    }

    /** Discards the drafts of the page, of the fields of the website and of the media the page uses. */
    async discard() {
        const page = this.config.page;
        this.busy = true;
        const steps = [
            ...(page.canDiscard ? [['page.discard', { id: page.id }]] : []),
            ...(this.siteDraft && this.config.site.discard ? [['site.discard', {}]] : []),
            ...(this.config.media?.discard ? this.mediaDrafts.map((draft) => ['media.discard', { id: draft.id }]) : []),
        ];

        for (const [name, input] of steps) {
            const response = await this.action(name, input);

            if (!response?.ok) {
                this.busy = false;
                this.confirming = false;
                this.fail(response);

                return;
            }
        }

        this.forget();

        // A page that was never published is gone then.
        if (page.published || !page.canDiscard) {
            location.reload();
        } else {
            location.assign(this.config.pages);
        }
    }

    /**
     * Runs an action for a field and tells how it went: "Saving …",
     * "Saved" or why not, with "Load again" on a conflict (decision 0122).
     */
    async run(name, input) {
        // Details of an error would turn into those of the page.
        if (this.state === 'error') {
            this.details = false;
        }

        this.saving++;
        this.message = { tone: 'info', text: this.labels.saving };
        const response = await this.action(name, input);
        const body = response ? await response.json().catch(() => null) : null;
        this.saving--;

        if (response?.ok) {
            if (this.saving === 0) {
                this.message = { tone: 'info', text: this.labels.saved };
                this.saved();
            }

            return { ok: true, data: body?.data };
        }

        const reason = body?.errors?.[0]?.message ?? body?.detail ?? this.labels.failed;
        this.message = { tone: 'danger', text: reason, reload: response?.status === 409 };

        return { ok: false, status: response?.status ?? 0 };
    }

    /**
     * After a saved change: the page, or with $site the fields of the
     * website, have a draft now, which may be undone.
     */
    changed(entry, site = false) {
        const page = this.config.page;

        if (entry) {
            this.undo = [...this.undo, entry];
            writeSession(this.undoKey, this.undo);
        }

        if (site) {
            this.config = { ...this.config, site: { ...this.config.site, draft: true } };

            return;
        }

        this.config = {
            ...this.config,
            page: { ...page, status: page.published ? 'changed' : 'draft', canPublish: page.mayPublish, canDiscard: page.mayDiscard },
        };
    }

    async undoLast() {
        this.busy = true;
        await this.editing?.flushAll();
        const entry = this.undo.at(-1);
        const response = await this.action('action.undo', { id: entry });

        if (!response?.ok) {
            this.fail(response);

            return;
        }

        writeSession(this.undoKey, this.undo.slice(0, -1));
        location.reload();
    }

    /** Publishing or discarding leaves nothing to undo here. */
    forget() {
        this.undo = [];
        writeSession(this.undoKey, []);
    }

    showToolbar(editor) {
        if (editor.view.hasFocus() || this.link) {
            this.toolbar = editor;
            this.requestUpdate();
        }
    }

    hideToolbar(editor) {
        if (this.toolbar === editor && !this.link) {
            this.toolbar = null;
        }
    }

    focusToolbar() {
        this.renderRoot.querySelector('.toolbar :is(button, select)')?.focus();
    }

    /** The floating toolbar of rich text, above the selection (decision 0122). */
    toolbarView() {
        const editor = this.toolbar;

        if (!editor || editor.isDestroyed) {
            return nothing;
        }

        const labels = this.labels;
        const coords = editor.view.coordsAtPos(editor.state.selection.from);
        const below = coords.top < 64;
        const top = below ? coords.bottom : coords.top;
        const left = Math.max(8, Math.min(coords.left, innerWidth - 320));
        const run = (command) => command(editor.chain().focus()).run();
        const items = [
            ['bold', 'bold', labels.bold, () => run((chain) => chain.toggleBold())],
            ['italic', 'italic', labels.italic, () => run((chain) => chain.toggleItalic())],
            ['list', 'bulletList', labels.bulletList, () => run((chain) => chain.toggleBulletList())],
            ['ordered', 'orderedList', labels.orderedList, () => run((chain) => chain.toggleOrderedList())],
            ['quote', 'blockquote', labels.quote, () => run((chain) => chain.toggleBlockquote())],
            ['link', 'link', labels.link, () => this.richLink(editor)],
        ];

        return html`<div class="toolbar ${below ? 'below' : ''}" role="toolbar" aria-label=${labels.formatting}
            style="inset-block-start: ${top}px; inset-inline-start: ${left}px"
            @keydown=${(event) => this.toolbarKey(event, editor)}
            @focusout=${(event) => this.toolbarLeft(event, editor)}>
            ${this.headingSelect(editor, run)}
            ${items.map(([name, active, label, action]) => {
                const pressed = Array.isArray(active) ? editor.isActive(...active) : editor.isActive(active);

                return html`<button type="button" aria-label=${label} title=${label} aria-pressed=${pressed ? 'true' : 'false'}
                    @mousedown=${(event) => event.preventDefault()} @click=${action}>${icon(name)}</button>`;
            })}
        </div>`;
    }

    /**
     * Text or a heading by its rank (decision 0129), as many ranks as the
     * field offers. The page decides the level.
     */
    headingSelect(editor, run) {
        const ranks = editor.extensionManager.extensions.find((extension) => extension.name === 'heading')?.options.levels ?? [];

        if (ranks.length === 0) {
            return nothing;
        }

        const labels = this.labels;
        const names = { 1: labels.heading, 2: labels.subheading, 3: labels.smallHeading };
        const current = ranks.find((rank) => editor.isActive('heading', { level: rank })) ?? 0;
        const change = (event) => {
            const rank = Number(event.target.value);
            run((chain) => (rank === 0 ? chain.setParagraph() : chain.setHeading({ level: rank })));
        };

        return html`<select aria-label=${labels.textStyle} title=${labels.textStyleHint} @change=${change}>
            <option value="0" ?selected=${current === 0}>${labels.normalText}</option>
            ${ranks.map((rank) => html`<option value=${rank} ?selected=${current === rank}>${names[rank]}</option>`)}
        </select>`;
    }

    toolbarKey(event, editor) {
        const buttons = [...this.renderRoot.querySelectorAll('.toolbar :is(button, select)')];
        const at = buttons.indexOf(this.renderRoot.activeElement);

        if (event.key === 'Escape') {
            event.preventDefault();
            editor.commands.focus();
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const step = event.key === 'ArrowRight' ? 1 : -1;
            buttons[(at + step + buttons.length) % buttons.length]?.focus();
        }
    }

    toolbarLeft(event, editor) {
        const next = event.relatedTarget;

        if (!this.link && !(next instanceof Node && (this.renderRoot.contains(next) || editor.view.dom.contains(next)))) {
            this.toolbar = null;
        }
    }

    /** The link dialog for the selection in rich text. */
    richLink(editor) {
        const attributes = editor.getAttributes('link');
        const existing = editor.isActive('link');

        this.openLink({
            withText: false,
            href: attributes.href ?? '',
            newWindow: attributes.target === '_blank',
            existing,
            apply: ({ href, newWindow, label }) => {
                const link = { href, target: newWindow ? '_blank' : null };
                const chain = editor.chain().focus();

                if (editor.state.selection.empty && !existing) {
                    chain.insertContent({ type: 'text', text: label, marks: [{ type: 'link', attrs: link }] });
                } else {
                    chain.extendMarkRange('link').setLink(link);
                }

                chain.run();
            },
            remove: () => editor.chain().focus().extendMarkRange('link').unsetLink().run(),
            done: () => editor.commands.focus(),
        });
    }

    /**
     * Opens the link dialog: text if the field has one, an address or a
     * page from the search, and whether it opens in a new window.
     */
    openLink(options) {
        const page = options.href.startsWith('page:') ? { id: options.href.slice(5), title: '', path: '' } : null;
        this.link = { existing: options.href !== '', ...options, query: page ? '' : options.href, page };
        this.loadPages();
        this.updateComplete.then(() => {
            this.renderRoot.querySelector('dialog.link')?.showModal();
            this.renderRoot.querySelector('dialog.link input')?.focus();
        });
    }

    async loadPages() {
        if (this.pages) {
            return;
        }

        try {
            const response = await fetch(this.config.queries + 'page.tree', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            const body = response.ok ? await response.json() : null;
            this.pages = flatten(body?.data ?? [], this.config.language);
        } catch {
            this.pages = [];
        }

        this.requestUpdate();
    }

    linkDialog() {
        const link = this.link;

        if (!link) {
            return nothing;
        }

        const labels = this.labels;
        const page = link.page ? this.pages?.find((item) => item.id === link.page.id) ?? link.page : null;
        const query = link.query.trim();
        const search = !page && query !== '' && !isAddress(query);
        const needle = query.toLowerCase();
        const results = search && this.pages
            ? this.pages.filter((item) => item.title.toLowerCase().includes(needle) || item.path.includes(needle)).slice(0, 8)
            : [];
        const valid = page !== null || (query !== '' && isAddress(query));
        // Open what is saved or typed, in a new tab, so the dialog stays (decision 0150).
        const openUrl = page
            ? (link.openUrl && link.href === `page:${page.id}` ? link.openUrl : null)
            : (valid ? addressUrl(query) : null);
        const update = (changes) => {
            this.link = { ...this.link, ...changes };
        };

        return html`<dialog class="link" aria-labelledby="fb-link-title" @cancel=${(event) => { event.preventDefault(); this.closeLink(); }}>
            <form @submit=${(event) => { event.preventDefault(); this.applyLink(page, query); }}>
                <h2 id="fb-link-title">${labels.link}</h2>
                ${link.withText ? html`<label>${labels.linkText}
                    <input type="text" .value=${link.text ?? ''} @input=${(event) => update({ text: event.target.value })}></label>` : nothing}
                ${page
                    ? html`<div><span class="hint">${labels.linkTarget}</span><div class="chosen">
                        <span>${labels.linkPage}: ${page.title || page.id} <small>${page.path}</small></span>
                        <button type="button" aria-label=${labels.removeLink} title=${labels.removeLink}
                            @click=${() => update({ page: null, query: '' })}>${icon('close')}</button></div></div>`
                    : html`<label>${labels.linkTarget}
                        <input type="text" .value=${link.query} autocomplete="off" aria-describedby="fb-link-hint"
                            @input=${(event) => update({ query: event.target.value })}></label>
                        <p class="hint" id="fb-link-hint">${labels.linkHint}</p>`}
                ${search ? html`<ul class="results" aria-label=${labels.linkPage}>
                    ${this.pages && results.length === 0 ? html`<li class="hint">${labels.noPages}</li>` : nothing}
                    ${results.map((item) => html`<li><button type="button" @click=${() => update({ page: item, query: '' })}>
                        <span>${item.title}</span><small>${item.path}</small></button></li>`)}
                </ul>` : nothing}
                <label class="check"><input type="checkbox" .checked=${link.newWindow}
                    @change=${(event) => update({ newWindow: event.target.checked })}>${labels.newWindow}</label>
                <div class="actions">
                    ${openUrl ? html`<button type="button" class="open" @click=${() => follow(openUrl, true)}>${icon('external')}${labels.openLink}</button>` : nothing}
                    ${link.existing ? html`<button type="button" class="danger" @click=${() => this.closeLink(link.remove)}>${labels.removeLink}</button>` : nothing}
                    <button type="button" @click=${() => this.closeLink()}>${labels.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!valid}>${labels.apply}</button>
                </div>
            </form>
        </dialog>`;
    }

    applyLink(page, query) {
        const link = this.link;
        const href = page ? 'page:' + page.id : isDomain(query) ? 'https://' + query : query;

        if (!page && !isAddress(query)) {
            return;
        }

        this.closeLink(() => link.apply({ text: (link.text ?? '').trim(), href, newWindow: link.newWindow, label: page?.title || query }));
    }

    closeLink(then = null) {
        const link = this.link;
        this.renderRoot.querySelector('dialog.link')?.close();
        this.link = null;
        then?.();
        link?.done?.();
    }

    action(name, input) {
        return this.send(this.config.actions + name, JSON.stringify(input), 'application/json');
    }

    async send(url, body, type = null) {
        const headers = { Accept: 'application/json', 'X-CSRF-Token': this.config.csrf ?? '' };

        if (type) {
            headers['Content-Type'] = type;
        }

        try {
            return await fetch(url, { method: 'POST', headers, body, credentials: 'same-origin' });
        } catch {
            return null;
        }
    }

    /**
     * Shows why an action failed. For publishing, the fields it names are
     * marked on the page (decision 0143).
     */
    async fail(response, places = false) {
        this.busy = false;
        const problem = response ? await response.json().catch(() => null) : null;
        const text = problem?.detail ?? this.labels.failed;
        const errors = Array.isArray(problem?.errors) ? problem.errors : [];

        if (places && errors.length > 0) {
            this.problemsText = text;
            this.problems = placesOf(errors, this.config.page, this.config.language);
            this.message = { tone: 'info', text: `${text} ${errors.length === 1 ? this.labels.oneProblem : this.labels.problems.replace('{count}', errors.length)}` };
            this.details = true;

            return;
        }

        this.message = { tone: 'danger', text };
    }
}
