// The note for guests with a preview link (decision 0152): "Preview, not
// published yet", until when the link works, and "End the preview". Plain
// DOM without Lit, shielded from the theme like the editor bar (0151).
//
// With comments (0156): "Comment" lets the guest click a field or block,
// write and send; "Comments" lists the threads of their link with the
// replies and the status, and pins mark the places on the page.
import { WHOLE_DESIGN_PAGE, elementOf, isContent, pinAt, placeLine, placeOf } from './comments/place.js';

const source = document.getElementById('fb-preview-config');
const NAME = 'frootbox-comment-name';

const STYLES = `
    :host {
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: var(--fb-layer-edit) !important;
        display: block !important;
        pointer-events: none !important;
    }

    * { box-sizing: border-box; }

    .note, .panel, .pin, .hint { pointer-events: auto; }

    .note {
        position: fixed;
        inset-block-end: var(--fb-space-4);
        inset-inline-start: 50%;
        translate: -50% 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--fb-space-1) var(--fb-space-3);
        align-items: center;
        max-inline-size: calc(100vw - 2 * var(--fb-space-4));
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-lg);
        background: var(--fb-surface);
        color: var(--fb-text);
        box-shadow: var(--fb-shadow-lg);
    }

    .note, .panel, .pin, .hint {
        font-family: var(--fb-font-family);
        font-size: var(--fb-text-sm);
        line-height: var(--fb-leading-normal);
    }

    strong { font-weight: var(--fb-weight-semibold); }

    .muted { color: var(--fb-text-muted); }

    .actions { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); }

    a, button {
        display: inline-flex;
        gap: var(--fb-space-1);
        align-items: center;
        justify-content: center;
        min-block-size: var(--fb-size-control-sm);
        padding-inline: var(--fb-space-3);
        border: 0;
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
        color: var(--fb-text);
        font: inherit;
        font-weight: var(--fb-weight-medium);
        text-decoration: none;
        cursor: pointer;
    }

    a:hover, button:hover { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

    button.primary { background: var(--fb-accent); color: var(--fb-on-accent); }

    button.primary:hover { background: var(--fb-accent-hover); color: var(--fb-on-accent); }

    button[aria-pressed="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

    button:disabled { cursor: progress; opacity: 0.6; }

    a:focus-visible, button:focus-visible, textarea:focus-visible, input:focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .count {
        min-inline-size: var(--fb-size-icon-sm);
        padding-inline: var(--fb-space-1);
        border-radius: var(--fb-radius-full);
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        text-align: center;
    }

    .hint {
        position: fixed;
        inset-block-start: var(--fb-space-4);
        inset-inline-start: var(--fb-space-4);
        display: flex;
        flex-wrap: wrap;
        gap: var(--fb-space-2) var(--fb-space-3);
        align-items: center;
        max-inline-size: min(var(--fb-size-form), calc(100vw - 2 * var(--fb-space-4)));
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        border-radius: var(--fb-radius-lg);
        background: var(--fb-inverse-bg);
        color: var(--fb-inverse-text);
        box-shadow: var(--fb-shadow-lg);
    }

    .outline {
        position: fixed;
        border: var(--fb-size-focus) solid var(--fb-accent);
        border-radius: var(--fb-radius-sm);
        background: var(--fb-accent-soft);
        opacity: 0.5;
        pointer-events: none;
    }

    .outline span {
        position: absolute;
        inset-block-end: 100%;
        inset-inline-start: calc(-1 * var(--fb-size-focus));
        padding: 0 var(--fb-space-1);
        border-radius: var(--fb-radius-sm);
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-family: var(--fb-font-family);
        font-size: var(--fb-text-xs);
        white-space: nowrap;
    }

    .pin {
        position: fixed;
        min-inline-size: var(--fb-size-icon);
        min-block-size: var(--fb-size-icon);
        padding: 0 var(--fb-space-1);
        border: var(--fb-size-border) solid var(--fb-on-accent);
        border-radius: var(--fb-radius-full);
        border-end-start-radius: 0;
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        box-shadow: var(--fb-shadow-sm);
    }

    .pin.done { background: var(--fb-surface-2); color: var(--fb-text-muted); }

    .pin.draft { pointer-events: none; display: grid; place-items: center; border-color: var(--fb-accent); background: var(--fb-surface); color: var(--fb-accent); }

    .panel {
        position: fixed;
        inset-block: var(--fb-space-4) calc(var(--fb-size-control) + 3 * var(--fb-space-4));
        inset-inline-end: var(--fb-space-4);
        display: flex;
        flex-direction: column;
        inline-size: min(var(--fb-size-narrow), calc(100vw - 2 * var(--fb-space-4)));
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-lg);
        background: var(--fb-surface);
        color: var(--fb-text);
        box-shadow: var(--fb-shadow-lg);
    }

    .panel header {
        display: flex;
        gap: var(--fb-space-2);
        align-items: center;
        justify-content: space-between;
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        border-block-end: var(--fb-size-border) solid var(--fb-border);
    }

    h2, h3 { margin: 0; font-size: var(--fb-text-md); font-weight: var(--fb-weight-semibold); }

    h3 { font-size: var(--fb-text-sm); }

    .body { flex: 1; overflow: auto; padding: var(--fb-space-4); }

    .body > * + * { margin-block-start: var(--fb-space-4); }

    p { margin: 0; }

    form { display: grid; gap: var(--fb-space-2); }

    label { display: grid; gap: var(--fb-space-1); font-weight: var(--fb-weight-medium); }

    textarea, input {
        inline-size: 100%;
        min-block-size: var(--fb-size-control-sm);
        padding: var(--fb-space-2);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-input-bg);
        color: var(--fb-text);
        font: inherit;
    }

    textarea { min-block-size: calc(3 * var(--fb-size-control-sm)); resize: vertical; }

    blockquote {
        margin: 0;
        padding-inline-start: var(--fb-space-2);
        border-inline-start: var(--fb-size-indicator) solid var(--fb-border-strong);
        color: var(--fb-text-muted);
    }

    .thread {
        display: grid;
        gap: var(--fb-space-2);
        padding: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
    }

    .thread:target, .thread.current { border-color: var(--fb-accent); }

    .meta { display: flex; flex-wrap: wrap; gap: var(--fb-space-1) var(--fb-space-2); align-items: center; }

    .badge {
        padding: 0 var(--fb-space-2);
        border-radius: var(--fb-radius-full);
        background: var(--fb-info-bg);
        color: var(--fb-info-text);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-medium);
    }

    .badge.done { background: var(--fb-success-bg); color: var(--fb-success-text); }

    .message p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }

    .reply { padding-inline-start: var(--fb-space-3); border-inline-start: var(--fb-size-border) solid var(--fb-border); }

    .error { margin: 0; color: var(--fb-danger-text); }

    @media print { :host { display: none !important; } }
`;

/**
 * Creates an element with attributes and children.
 */
function h(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);

    for (const [name, value] of Object.entries(attributes)) {
        if (name.startsWith('on')) {
            element.addEventListener(name.slice(2), value);
        } else if (true === value) {
            element.setAttribute(name, '');
        } else if (false !== value && null !== value && undefined !== value) {
            element.setAttribute(name, String(value));
        }
    }

    element.append(...children.flat().filter((child) => null !== child && undefined !== child && false !== child));

    return element;
}

class PreviewNote extends HTMLElement {
    threads = [];

    picking = false;

    connectedCallback() {
        if (this.shadowRoot) {
            return;
        }

        this.settings = this.config ?? {};
        this.labels = this.settings.labels ?? {};
        this.root = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `${this.settings.tokens ?? ''}${STYLES}`;
        this.layer = h('div');
        this.root.append(style, this.layer, this.note());

        this.onPick = this.pick.bind(this);
        this.onHover = this.hover.bind(this);
        this.onKey = this.key.bind(this);
        this.onMove = () => this.placePins();
        window.addEventListener('scroll', this.onMove, { passive: true });
        window.addEventListener('resize', this.onMove);

        this.ready = this.settings.comments ? this.load() : Promise.resolve();
    }

    t(key, parameters = {}) {
        return Object.entries(parameters).reduce((text, [name, value]) => text.replace(`{${name}}`, value), this.labels[key] ?? key);
    }

    note() {
        const note = h('div', { class: 'note', role: 'region', 'aria-label': this.t('region') }, h('strong', {}, this.t('title')));
        const until = new Date(this.settings.expiresAt ?? '');

        if (!Number.isNaN(until.getTime()) && this.labels.until) {
            const date = new Intl.DateTimeFormat(document.documentElement.lang || undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(until);
            note.append(h('span', { class: 'muted' }, this.t('until', { date })));
        }

        if (this.settings.comments) {
            this.commentButton = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => (this.picking ? this.stopPicking() : this.startPicking()) }, this.t('comment'));
            this.listButton = h('button', { type: 'button', 'aria-expanded': 'false', onclick: async () => {
                if (this.panel?.dataset.view === 'list') {
                    this.closePanel();
                } else {
                    // The threads load with the page; a quick click waits for them.
                    await this.ready;
                    this.showList();
                }
            } }, this.t('comments'));
            note.append(this.commentButton, this.listButton);
        }

        note.append(h('a', { href: this.settings.end ?? '?fb-preview=0' }, this.t('end')));

        return note;
    }

    // Picking a place.

    startPicking() {
        this.closePanel();
        this.picking = true;
        this.commentButton.setAttribute('aria-pressed', 'true');
        this.hint = h('div', { class: 'hint', role: 'status' },
            h('span', {}, this.t('pickHint')),
            h('button', { type: 'button', onclick: () => this.compose({ blockId: null, field: null, site: false, landmark: null, label: null, excerpt: null, element: null, pointX: null, pointY: null }) }, this.t('wholePage')),
            h('button', { type: 'button', onclick: () => this.stopPicking() }, this.t('cancel')),
        );
        this.root.append(this.hint);
        document.addEventListener('click', this.onPick, true);
        document.addEventListener('mouseover', this.onHover, true);
        document.addEventListener('keydown', this.onKey, true);
    }

    stopPicking() {
        this.picking = false;
        this.commentButton?.setAttribute('aria-pressed', 'false');
        this.hint?.remove();
        this.outline?.remove();
        this.outline = null;
        document.removeEventListener('click', this.onPick, true);
        document.removeEventListener('mouseover', this.onHover, true);
        document.removeEventListener('keydown', this.onKey, true);
    }

    hover(event) {
        if (!isContent(event.target)) {
            return;
        }

        const place = placeOf(event.target, { labels: this.labels });
        this.outline?.remove();
        this.outline = null;

        if (!place.element) {
            return;
        }

        const rect = place.element.getBoundingClientRect();
        this.outline = h('div', { class: 'outline' }, place.label ? h('span', {}, place.label) : null);
        Object.assign(this.outline.style, { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px` });
        this.layer.append(this.outline);
    }

    pick(event) {
        // Clicks on the note itself do what they say.
        if (!isContent(event.target)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.compose(placeOf(event.target, { event, labels: this.labels }));
    }

    key(event) {
        if ('Escape' === event.key) {
            event.preventDefault();
            this.stopPicking();
        }
    }

    // The panel: writing a comment or the list of threads.

    openPanel(view, title, ...content) {
        this.panel?.remove();
        this.panel = h('section', { class: 'panel', 'aria-label': title, 'data-view': view, onkeydown: (event) => 'Escape' === event.key && this.closePanel() },
            h('header', {}, h('h2', {}, title), h('button', { type: 'button', onclick: () => this.closePanel() }, this.t('close'))),
            h('div', { class: 'body' }, ...content),
        );
        this.root.append(this.panel);
        this.listButton?.setAttribute('aria-expanded', String('list' === view));

        // Only a comment being written shows its place ahead.
        if ('compose' !== view && this.draft) {
            this.draft = null;
            this.placePins();
        }
    }

    closePanel() {
        this.panel?.remove();
        this.panel = null;
        this.listButton?.setAttribute('aria-expanded', 'false');

        if (this.draft) {
            this.draft = null;
            this.placePins();
        }
    }

    compose(place) {
        this.stopPicking();
        const name = this.storedName();
        const error = h('p', { class: 'error', role: 'alert', hidden: true });
        const form = h('form', { onsubmit: (event) => this.send(event, place, error) },
            h('p', { class: 'muted' }, place.label ? this.t('about', { place: place.label }) : this.t('aboutPage')),
            place.excerpt ? h('blockquote', {}, place.excerpt.length > 120 ? `${place.excerpt.slice(0, 120)} …` : place.excerpt) : null,
            h('label', {}, this.t('yourComment'), h('textarea', { name: 'body', required: true, maxlength: 2000 })),
            name ? null : h('label', {}, this.t('yourName'), h('input', { name: 'authorName', required: true, maxlength: 80, autocomplete: 'name' })),
            error,
            h('div', { class: 'actions' }, h('button', { type: 'submit', class: 'primary' }, this.t('send')), h('button', { type: 'button', onclick: () => this.closePanel() }, this.t('cancel'))),
        );
        this.openPanel('compose', this.t('newComment'), form);
        this.draft = place.element ? place : null;
        this.placePins();
        form.querySelector('textarea').focus();
    }

    async send(event, place, error) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const authorName = String(data.get('authorName') ?? this.storedName() ?? '').trim();

        await this.submit(form, error, async () => {
            // On the design page an element of it instead of a page (decision 0210).
            const design = this.settings.design ? place.design ?? WHOLE_DESIGN_PAGE : null;
            await this.call('action', 'comment.create', {
                pageId: design ? null : this.settings.pageId,
                design,
                body: String(data.get('body') ?? ''),
                authorName,
                blockId: place.blockId,
                field: place.field,
                site: place.site,
                landmark: place.landmark ?? null,
                pointX: place.pointX ?? null,
                pointY: place.pointY ?? null,
                language: this.settings.language,
                path: design ? location.pathname + location.search : location.pathname,
                excerpt: place.excerpt,
                viewport: window.innerWidth,
            });
            this.storeName(authorName);
            await this.load();
            this.showList(this.threads[0]?.id);
        });
    }

    async reply(event, thread, error) {
        event.preventDefault();
        const form = event.currentTarget;
        const body = String(new FormData(form).get('body') ?? '');
        const authorName = String(new FormData(form).get('authorName') ?? this.storedName() ?? '').trim();

        await this.submit(form, error, async () => {
            await this.call('action', 'comment.reply', { commentId: thread.id, body, authorName });
            this.storeName(authorName);
            await this.load();
            this.showList(thread.id);
        });
    }

    async submit(form, error, run) {
        const buttons = [...form.querySelectorAll('button')];
        buttons.forEach((button) => (button.disabled = true));
        error.hidden = true;

        try {
            await run();
        } catch (problem) {
            error.textContent = problem.message;
            error.hidden = false;
        } finally {
            buttons.forEach((button) => (button.disabled = false));
        }
    }

    showList(current = null) {
        const here = this.threads.filter((thread) => this.isHere(thread));
        const elsewhere = this.threads.filter((thread) => !this.isHere(thread));
        const content = 0 === this.threads.length
            ? [h('p', { class: 'muted' }, this.t('noComments'))]
            : [
                here.length ? h('h3', {}, this.t('onThisPage')) : null,
                ...here.map((thread) => this.thread(thread, current)),
                elsewhere.length ? h('h3', {}, this.t('onOtherPages')) : null,
                ...elsewhere.map((thread) => this.thread(thread, current)),
            ];
        this.openPanel('list', this.t('comments'), ...content);
        this.panel.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
    }

    thread(thread, current) {
        const done = 'done' === thread.status;
        const element = this.isHere(thread) ? elementOf(thread) : null;
        const place = !this.isHere(thread)
            ? h('a', { href: thread.path ?? '/' }, thread.pageTitle ?? (thread.design ? this.t('designElements') : this.t('page')))
            : element
                ? h('button', { type: 'button', onclick: () => element.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, this.t('showPlace'))
                : null;
        const error = h('p', { class: 'error', role: 'alert', hidden: true });
        const name = this.storedName();

        return h('article', { class: `thread${thread.id === current ? ' current' : ''}`, 'data-thread': thread.id },
            h('div', { class: 'meta' }, h('span', { class: `badge${done ? ' done' : ''}` }, done ? this.t('doneThread') : this.t('openThread')), h('span', { class: 'muted' }, placeLine(thread, this.labels) ?? this.t('aboutPage')), place),
            this.message(thread.comment),
            ...thread.replies.map((reply) => h('div', { class: 'reply' }, this.message(reply))),
            h('form', { onsubmit: (event) => this.reply(event, thread, error) },
                h('label', {}, this.t('reply'), h('textarea', { name: 'body', required: true, maxlength: 2000 })),
                name ? null : h('label', {}, this.t('yourName'), h('input', { name: 'authorName', required: true, maxlength: 80, autocomplete: 'name' })),
                error,
                h('div', { class: 'actions' }, h('button', { type: 'submit' }, this.t('sendReply'))),
            ),
        );
    }

    message(entry) {
        const date = entry.createdAt ? new Intl.DateTimeFormat(document.documentElement.lang || undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.createdAt)) : '';

        return h('div', { class: 'message' }, h('div', { class: 'meta' }, h('strong', {}, entry.authorName), h('span', { class: 'muted' }, date)), h('p', {}, entry.body));
    }

    // Pins at the places of the threads on this page.

    placePins() {
        this.pins?.forEach((pin) => pin.remove());
        this.pins = [];
        // Newest first in the list, numbered from the oldest as in the editor bar.
        const here = this.threads.filter((thread) => this.isHere(thread));

        for (const [index, thread] of here.entries()) {
            const number = here.length - index;
            const element = elementOf(thread);

            if (!element) {
                continue;
            }

            const pin = h('button', { type: 'button', class: `pin${'done' === thread.status ? ' done' : ''}`, 'aria-label': this.t('commentPin', { number, text: thread.comment.body.slice(0, 60) }), onclick: () => this.showList(thread.id) }, String(number));
            this.pinTo(pin, thread, element);
        }

        // The place of the comment being written.
        if (this.draft?.element.isConnected) {
            this.pinTo(h('span', { class: 'pin draft', 'aria-hidden': 'true' }, '+'), this.draft, this.draft.element);
        }
    }

    pinTo(pin, place, element) {
        const { x, y, rect, point } = pinAt(place, element);

        if (rect.bottom < 0 || rect.top > window.innerHeight || (0 === rect.width && 0 === rect.height)) {
            return;
        }

        this.layer.append(pin);
        this.pins.push(pin);
        // The note runs in the direction of the backend, the pin with it.
        const fromStart = 'rtl' === this.dir ? document.documentElement.clientWidth - x : x;
        const [block, inline] = point ? [y - pin.offsetHeight, fromStart] : [y - pin.offsetHeight / 2, fromStart - pin.offsetWidth / 2];
        Object.assign(pin.style, { insetBlockStart: `${Math.max(0, block)}px`, insetInlineStart: `${Math.max(0, inline)}px` });
    }

    /** Whether a thread belongs to this page, or to the design page shown. */
    isHere(thread) {
        return this.settings.design ? Boolean(thread.design) : !thread.design && thread.pageId === this.settings.pageId;
    }

    async load() {
        try {
            this.threads = await this.call('query', 'comment.list', {});
        } catch {
            this.threads = [];
        }

        const open = this.threads.filter((thread) => 'open' === thread.status).length;
        this.listButton?.replaceChildren(this.t('comments'), ...(open ? [h('span', { class: 'count', 'aria-label': this.t('openCount', { count: open }) }, String(open))] : []));
        this.placePins();
    }

    async call(kind, name, input) {
        const post = 'action' === kind;
        const query = new URLSearchParams(Object.entries(input).filter(([, value]) => null !== value && undefined !== value));
        const response = await fetch(post ? `${this.settings.actions}${name}` : `${this.settings.queries}${name}${query.size ? `?${query}` : ''}`, {
            method: post ? 'POST' : 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'X-Frootbox-Preview': '1', ...(post ? { 'Content-Type': 'application/json' } : {}) },
            body: post ? JSON.stringify(Object.fromEntries(Object.entries(input).filter(([, value]) => null !== value && '' !== value))) : undefined,
        });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
            const fields = { '/body': this.t('yourComment'), '/authorName': this.t('yourName') };
            const errors = (Array.isArray(body?.errors) ? body.errors : []).map(({ pointer, message }) => (fields[pointer] ? `${fields[pointer]}: ${message}` : message));
            throw new Error(errors.length ? errors.join(' ') : (body?.detail ?? this.t('commentFailed')));
        }

        return body?.data;
    }

    storedName() {
        try {
            return localStorage.getItem(NAME);
        } catch {
            return null;
        }
    }

    storeName(name) {
        try {
            if (name) {
                localStorage.setItem(NAME, name);
            }
        } catch {
            // Without storage the name is asked again next time.
        }
    }
}

if (source) {
    customElements.define('fb-preview-note', PreviewNote);
    const note = document.createElement('fb-preview-note');
    note.config = JSON.parse(source.textContent ?? '{}');
    // The note speaks the language of the backend (decision 0133).
    note.lang = note.config.ui?.language ?? '';
    note.dir = note.config.ui?.direction ?? 'ltr';
    document.body.append(note);
}
