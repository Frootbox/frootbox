import { LitElement, css, html, nothing } from 'lit';
import { Arranging, arrangingStyles } from './arranging.js';
import { Editing } from './editing.js';
import { icon } from './icons.js';

const COLLAPSED = 'fb-edit-bar-collapsed';
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

    return element.hasAttribute('data-fb-block') ? 'block' : 'area';
}

/**
 * <fb-edit-bar>: the bar of the editing mode on the website (decision
 * 0119). It floats at the bottom over the theme, lives in its own shadow
 * DOM with the tokens of the backend and draws the outlines of the
 * marked places itself, so no CSS of the theme touches it. Its data come
 * from the JSON block #fb-edit-config that the backend puts into the head.
 */
export class EditBar extends LitElement {
    static properties = {
        config: { attribute: false },
        collapsed: { state: true },
        busy: { state: true },
        message: { state: true },
        confirming: { state: true },
        showAll: { state: true },
        current: { state: true },
        undo: { state: true },
        link: { state: true },
        toolbar: { state: true },
    };

    static styles = [css`
        :host {
            all: initial;
            position: fixed;
            inset: 0;
            z-index: var(--fb-layer-edit);
            pointer-events: none;
            font-family: var(--fb-font-family);
            font-size: var(--fb-text-sm);
            line-height: var(--fb-leading-tight);
            color: var(--fb-text);
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
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: var(--fb-space-2);
            inline-size: max-content;
            max-inline-size: calc(100vw - 2 * var(--fb-space-4));
            padding: var(--fb-space-2);
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

        .brand {
            display: flex;
            align-items: center;
            padding-inline: var(--fb-space-2);
            font-weight: var(--fb-weight-bold);
            font-size: var(--fb-text-md);
        }

        .brand img { block-size: var(--fb-size-icon); inline-size: auto; }

        .divider {
            align-self: stretch;
            inline-size: var(--fb-size-border);
            background: var(--fb-border);
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

        .badge {
            display: inline-flex;
            align-items: center;
            gap: var(--fb-space-1);
            padding: var(--fb-space-1) var(--fb-space-2);
            border-radius: var(--fb-radius-full);
            font-size: var(--fb-text-xs);
            font-weight: var(--fb-weight-semibold);
        }

        .badge::before {
            content: "";
            inline-size: var(--fb-size-dot);
            block-size: var(--fb-size-dot);
            border-radius: var(--fb-radius-full);
            background: currentcolor;
        }

        .badge[data-status="published"] { background: var(--fb-success-bg); color: var(--fb-success-text); }
        .badge[data-status="draft"], .badge[data-status="changed"] { background: var(--fb-warning-bg); color: var(--fb-warning-text); }
        .badge.locked { background: var(--fb-danger-bg); color: var(--fb-danger-text); }
        .badge.locked::before { display: none; }

        .note { padding-inline: var(--fb-space-2); color: var(--fb-text-muted); }

        .message {
            flex-basis: 100%;
            padding: var(--fb-space-1) var(--fb-space-2);
            text-align: center;
            color: var(--fb-text-muted);
        }

        .message:empty { display: none; }
        .message[data-tone="danger"] { color: var(--fb-danger-text); }

        .outline {
            position: absolute;
            border: var(--fb-size-focus) solid var(--fb-accent);
            border-radius: var(--fb-radius-sm);
        }

        .outline[data-kind="block"], .outline[data-kind="area"] { border-style: dashed; }
        .outline[data-kind="area"] { background: var(--fb-accent-soft); opacity: 0.8; }

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

        .message button { display: inline-flex; margin-inline-start: var(--fb-space-2); }

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

        @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; }
        }
    `, arrangingStyles];

    constructor() {
        super();
        this.config = null;
        this.collapsed = read(COLLAPSED) === '1';
        this.busy = false;
        this.message = null;
        this.confirming = false;
        this.showAll = false;
        this.current = null;
        this.undo = [];
        this.link = null;
        this.toolbar = null;
        this.saving = 0;
        this.pages = null;
        this.editing = null;
        this.arranging = null;
        this.frame = 0;
        this.redraw = () => {
            if (this.frame === 0 && (this.current || this.showAll || this.toolbar || this.arranging?.block)) {
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
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.editing?.stop();
        this.arranging?.stop();
        document.removeEventListener('pointerover', this.onPoint, true);
        document.removeEventListener('pointerout', this.onLeave, true);
        document.removeEventListener('focusin', this.onFocus, true);
        removeEventListener('scroll', this.redraw, { capture: true });
        removeEventListener('resize', this.redraw);
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

        return html`${this.outlines()}${arranging?.tools() ?? nothing}${this.toolbarView()}${arranging?.panelView() ?? nothing}${this.collapsed ? this.round() : this.bar()}${arranging?.pickerDialog() ?? nothing}${this.linkDialog()}`;
    }

    round() {
        return html`<button type="button" class="round" aria-label=${this.labels.expand} title=${this.labels.expand}
            aria-expanded="false" @click=${() => this.collapse(false)}>${icon('pencil')}</button>`;
    }

    bar() {
        const { editing, page } = this.config;
        const labels = this.labels;

        return html`<div class="bar" role="region" aria-label=${labels.bar}>
            ${this.brand()}
            <span class="divider"></span>
            <button type="button" role="switch" aria-checked=${editing ? 'true' : 'false'} ?disabled=${this.busy}
                @click=${() => this.toggle(!editing)}>
                <span class="switch-track" aria-hidden="true"></span>${labels.edit}
            </button>
            ${editing ? this.pageControls(page) : nothing}
            ${page ? html`<a href=${page.backend}>${icon('external')}${labels.backend}</a>` : nothing}
            <button type="button" aria-label=${labels.collapse} title=${labels.collapse} aria-expanded="true"
                @click=${() => this.collapse(true)}>${icon('collapse')}</button>
            <p class="message" role="status" data-tone=${this.message?.tone ?? 'info'}>${this.message?.text ?? ''}${this.message?.reload
                ? html`<button type="button" @click=${() => location.reload()}>${labels.reload}</button>` : nothing}</p>
        </div>`;
    }

    brand() {
        const { brand } = this.config;
        const logo = this.isDark() ? brand.logoDark ?? brand.logo : brand.logo;

        return html`<span class="brand">${logo
            ? html`<img src=${logo} alt=${brand.name}>`
            : brand.name}</span>`;
    }

    pageControls(page) {
        const labels = this.labels;

        if (!page) {
            return html`<span class="note">${labels.readOnly}</span>`;
        }

        if (this.confirming) {
            return html`<span class="note">${labels.discardConfirm}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${() => this.discard()}>${labels.discardYes}</button>
                <button type="button" @click=${() => { this.confirming = false; }}>${labels.cancel}</button>`;
        }

        return html`
            <span class="badge" data-status=${page.status}><span class="visually-hidden">${labels.status}: </span>${labels[page.status] ?? page.status}</span>
            ${page.locked ? html`<span class="badge locked">${icon('lock')}${labels.locked}</span>` : nothing}
            ${this.config.marking ? nothing : html`<span class="note">${labels.readOnly}</span>`}
            ${this.config.marking ? html`<button type="button" aria-pressed=${this.showAll ? 'true' : 'false'}
                @click=${() => { this.showAll = !this.showAll; }}>${icon('places')}${labels.showAll}</button>` : nothing}
            ${this.undo.length > 0 ? html`<button type="button" ?disabled=${this.busy}
                @click=${() => this.undoLast()}>${icon('undo')}${labels.undo}</button>` : nothing}
            ${page.canPublish ? html`<button type="button" class="primary" ?disabled=${this.busy}
                title=${page.offlineParents.length ? labels.offlineParents.replace('{pages}', page.offlineParents.join(', ')) : nothing}
                @click=${() => this.publish()}>${labels.publish}</button>` : nothing}
            ${page.canDiscard ? html`<button type="button" class="danger" ?disabled=${this.busy}
                @click=${() => { this.confirming = true; }}>${labels.discard}</button>` : nothing}`;
    }

    /** Outlines with labels over the marked places, fixed to the viewport. */
    outlines() {
        if (!this.marking) {
            return nothing;
        }

        const selected = this.arranging?.block;
        const elements = this.showAll
            ? [...document.querySelectorAll(MARKED)]
            : [...new Set([selected, this.current].filter((element) => element?.isConnected))];

        return elements.map((element) => {
            const rect = element.getBoundingClientRect();

            if (rect.width === 0 && rect.height === 0) {
                return nothing;
            }

            const below = rect.top < 24;

            return html`<div class="outline ${below ? 'below' : ''}" data-kind=${kindOf(element)}
                style="inset-block-start: ${rect.top}px; inset-inline-start: ${rect.left}px; inline-size: ${rect.width}px; block-size: ${rect.height}px">
                <span class="label">${labelOf(element)}</span>
            </div>`;
        });
    }

    point(target) {
        this.arranging?.select(target);
        const element = target instanceof Element ? target.closest(MARKED) : null;

        if (element !== this.current) {
            this.current = element;
        }
    }

    isDark() {
        if (this.dataset.theme) {
            return this.dataset.theme === 'dark';
        }

        return matchMedia('(prefers-color-scheme: dark)').matches;
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

    async publish() {
        const page = this.config.page;
        this.busy = true;
        await this.editing?.flushAll();
        const response = await this.action('page.publish', { ids: page.publish });
        this.busy = false;

        if (!response?.ok) {
            this.fail(response);

            return;
        }

        this.forget();

        // Visitors now find the page where the draft is.
        this.config = { ...this.config, page: { ...page, status: 'published', published: true, canPublish: false, canDiscard: false, offlineParents: [], visitorUrl: page.draftUrl } };
        this.message = { tone: 'info', text: this.labels.publishDone };
    }

    async discard() {
        const page = this.config.page;
        this.busy = true;
        const response = await this.action('page.discard', { id: page.id });

        if (!response?.ok) {
            this.busy = false;
            this.confirming = false;
            this.fail(response);

            return;
        }

        this.forget();

        // A page that was never published is gone then.
        if (page.published) {
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
        this.saving++;
        this.message = { tone: 'info', text: this.labels.saving };
        const response = await this.action(name, input);
        const body = response ? await response.json().catch(() => null) : null;
        this.saving--;

        if (response?.ok) {
            if (this.saving === 0) {
                this.message = { tone: 'info', text: this.labels.saved };
            }

            return { ok: true, data: body?.data };
        }

        const reason = body?.errors?.[0]?.message ?? body?.detail ?? this.labels.failed;
        this.message = { tone: 'danger', text: reason, reload: response?.status === 409 };

        return { ok: false, status: response?.status ?? 0 };
    }

    /** After a saved change: the page has a draft now, which may be undone. */
    changed(entry) {
        const page = this.config.page;

        if (entry) {
            this.undo = [...this.undo, entry];
            writeSession(this.undoKey, this.undo);
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
        this.renderRoot.querySelector('.toolbar button')?.focus();
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
            ['heading', ['heading', { level: 2 }], labels.subheading, () => run((chain) => chain.toggleHeading({ level: 2 }))],
            ['list', 'bulletList', labels.bulletList, () => run((chain) => chain.toggleBulletList())],
            ['ordered', 'orderedList', labels.orderedList, () => run((chain) => chain.toggleOrderedList())],
            ['quote', 'blockquote', labels.quote, () => run((chain) => chain.toggleBlockquote())],
            ['link', 'link', labels.link, () => this.richLink(editor)],
        ];

        return html`<div class="toolbar ${below ? 'below' : ''}" role="toolbar" aria-label=${labels.formatting}
            style="inset-block-start: ${top}px; inset-inline-start: ${left}px"
            @keydown=${(event) => this.toolbarKey(event, editor)}
            @focusout=${(event) => this.toolbarLeft(event, editor)}>
            ${items.map(([name, active, label, action]) => {
                const pressed = Array.isArray(active) ? editor.isActive(...active) : editor.isActive(active);

                return html`<button type="button" aria-label=${label} title=${label} aria-pressed=${pressed ? 'true' : 'false'}
                    @mousedown=${(event) => event.preventDefault()} @click=${action}>${icon(name)}</button>`;
            })}
        </div>`;
    }

    toolbarKey(event, editor) {
        const buttons = [...this.renderRoot.querySelectorAll('.toolbar button')];
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

    async fail(response) {
        this.busy = false;
        const problem = response ? await response.json().catch(() => null) : null;
        this.message = { tone: 'danger', text: problem?.detail ?? this.labels.failed };
    }
}
