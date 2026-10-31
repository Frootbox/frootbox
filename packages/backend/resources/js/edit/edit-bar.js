import { LitElement, css, html, nothing, svg } from 'lit';

const COLLAPSED = 'fb-edit-bar-collapsed';
const THEME = 'fb-theme';

/** What the bar marks: fields, blocks and empty areas (decision 0119). */
const MARKED = '[data-fb-field], [data-fb-block], fb-area[data-fb-area]';

const ICONS = {
    pencil: svg`<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>`,
    external: svg`<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>`,
    collapse: svg`<path d="m6 9 6 6 6-6"/>`,
    lock: svg`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
    places: svg`<rect x="3" y="4" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/>`,
};

function icon(name) {
    return html`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

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
    };

    static styles = css`
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

        @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; }
        }
    `;

    constructor() {
        super();
        this.config = null;
        this.collapsed = read(COLLAPSED) === '1';
        this.busy = false;
        this.message = null;
        this.confirming = false;
        this.showAll = false;
        this.current = null;
        this.frame = 0;
        this.redraw = () => {
            if (this.frame === 0 && (this.current || this.showAll)) {
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
            document.addEventListener('pointerover', this.onPoint, true);
            document.addEventListener('pointerout', this.onLeave, true);
            document.addEventListener('focusin', this.onFocus, true);
            addEventListener('scroll', this.redraw, { passive: true, capture: true });
            addEventListener('resize', this.redraw, { passive: true });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('pointerover', this.onPoint, true);
        document.removeEventListener('pointerout', this.onLeave, true);
        document.removeEventListener('focusin', this.onFocus, true);
        removeEventListener('scroll', this.redraw, { capture: true });
        removeEventListener('resize', this.redraw);
    }

    get marking() {
        return Boolean(this.config?.editing && this.config?.marking);
    }

    get labels() {
        return this.config?.labels ?? {};
    }

    render() {
        if (!this.config) {
            return nothing;
        }

        return html`${this.outlines()}${this.collapsed ? this.round() : this.bar()}`;
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
            <p class="message" role="status" data-tone=${this.message?.tone ?? 'info'}>${this.message?.text ?? ''}</p>
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

        const elements = this.showAll ? [...document.querySelectorAll(MARKED)] : this.current ? [this.current] : [];

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
        const response = await this.action('page.publish', { ids: page.publish });
        this.busy = false;

        if (!response?.ok) {
            this.fail(response);

            return;
        }

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

        // A page that was never published is gone then.
        if (page.published) {
            location.reload();
        } else {
            location.assign(this.config.pages);
        }
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
