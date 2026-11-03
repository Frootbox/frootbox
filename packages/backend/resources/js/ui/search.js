// SPDX-License-Identifier: MIT
import { LitElement, css, html, nothing } from 'lit';

const DELAY = 120;

const LABELS = {
    search: 'Search',
    placeholder: 'Search pages, media, users …',
    close: 'Close',
    searching: 'Searching …',
    none: 'Nothing found for “{q}”.',
    found: '{count} hits',
    failed: 'The search did not answer. Try again.',
    all: 'Show all hits',
    hint: '↑ ↓ to choose, ↵ to open, Esc to close',
};

/** Whether the keys of this device are those of a Mac. */
const mac = () => /mac|iphone|ipad/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? '');

/**
 * <fb-search>: the search of the backend as a dialog (decisions 0214,
 * 0217). What is inside opens it, without a script it leads to the
 * screen of the search:
 *
 *     <fb-search src="/cms/search" shortcut labels='{"search": "Suchen", …}'>
 *         <a href="/cms/search">Search</a>
 *     </fb-search>
 *
 * - src: answers GET ?q=… with Accept: application/json as
 *   {data: [{title, items: [{title, url, excerpt, meta}]}]}
 * - shortcut: Ctrl+K or ⌘+K opens it from anywhere on the page, the
 *   button shows the keys of the system; only one search on a page
 *   should have it
 * - labels: the texts, see LABELS
 * - static: shown open in the flow of the page with the hits of
 *   "groups" for "query", e.g. on the design page
 *
 * The field is a combobox: arrow up and down choose a hit, Enter opens
 * it, Enter without a choice shows all hits on the screen of the search.
 * The dialog has its own styles, so it looks the same in the backend
 * and in the editor bar of the website.
 */
export class Search extends LitElement {
    static properties = {
        src: {},
        shortcut: { type: Boolean },
        labels: { type: Object },
        static: { type: Boolean, reflect: true },
        query: {},
        groups: { type: Object },
        state: { state: true },
        active: { state: true },
    };

    static styles = css`
        :host { display: contents; }

        dialog {
            width: min(var(--fb-size-dialog), calc(100% - var(--fb-space-8)));
            max-height: min(calc(var(--fb-size-dialog) * 1.1), calc(100% - var(--fb-space-16)));
            margin: var(--fb-space-16) auto auto;
            padding: 0;
            overflow: hidden;
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            background: var(--fb-surface);
            color: var(--fb-text);
            font-family: var(--fb-font-family);
            font-size: var(--fb-text-base);
            line-height: var(--fb-leading-normal);
            box-shadow: var(--fb-shadow-lg);
        }

        dialog[open] { display: flex; flex-direction: column; }

        dialog::backdrop { background: var(--fb-backdrop); }

        :host([static]) { display: block; }

        :host([static]) dialog { position: static; width: 100%; max-width: var(--fb-size-dialog); margin: 0; box-shadow: none; }

        form {
            display: flex;
            gap: var(--fb-space-3);
            align-items: center;
            padding: var(--fb-space-3) var(--fb-space-4);
            border-bottom: var(--fb-size-border) solid var(--fb-border);
        }

        svg { flex: none; inline-size: var(--fb-size-icon); block-size: var(--fb-size-icon); color: var(--fb-text-muted); }

        input {
            flex: 1;
            min-width: 0;
            min-height: var(--fb-size-control);
            border: 0;
            background: transparent;
            color: inherit;
            font: inherit;
            font-size: var(--fb-text-lg);
        }

        input:focus { outline: none; }

        input::-webkit-search-cancel-button { display: none; }

        .close {
            min-height: var(--fb-size-control-sm);
            padding: 0 var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: var(--fb-text-muted);
            font: inherit;
            font-size: var(--fb-text-sm);
            cursor: pointer;
        }

        .close:hover { background: var(--fb-surface-2); color: var(--fb-text); }

        .close:focus-visible, a:focus-visible { outline: var(--fb-size-focus) solid var(--fb-focus); outline-offset: var(--fb-size-focus-offset); }

        .results { flex: 1 1 auto; min-height: 0; padding: var(--fb-space-2); overflow-y: auto; }

        .results:empty { display: none; }

        .group {
            margin: 0;
            padding: var(--fb-space-3) var(--fb-space-3) var(--fb-space-1);
            color: var(--fb-text-muted);
            font-size: var(--fb-text-xs);
            font-weight: var(--fb-weight-semibold);
            letter-spacing: var(--fb-tracking-caps);
            text-transform: uppercase;
        }

        .option {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0 var(--fb-space-3);
            align-items: baseline;
            min-height: var(--fb-size-control);
            padding: var(--fb-space-2) var(--fb-space-3);
            border-radius: var(--fb-radius-md);
            color: var(--fb-text);
            text-decoration: none;
        }

        .option:hover { background: var(--fb-surface-2); }

        .option[aria-selected="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

        .title { font-weight: var(--fb-weight-medium); overflow-wrap: anywhere; }

        .meta { color: var(--fb-text-muted); font-size: var(--fb-text-xs); }

        .excerpt {
            grid-column: 1 / -1;
            overflow: hidden;
            color: var(--fb-text-muted);
            font-size: var(--fb-text-sm);
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .footer {
            display: flex;
            flex-wrap: wrap;
            gap: var(--fb-space-2) var(--fb-space-4);
            align-items: center;
            justify-content: space-between;
            padding: var(--fb-space-3) var(--fb-space-4);
            border-top: var(--fb-size-border) solid var(--fb-border);
            color: var(--fb-text-muted);
            font-size: var(--fb-text-sm);
        }

        .footer a { color: var(--fb-accent-text); }

        .status:empty { display: none; }
    `;

    constructor() {
        super();
        this.src = '';
        this.shortcut = false;
        this.static = false;
        this.labels = {};
        this.query = '';
        this.groups = [];
        this.state = 'idle';
        this.active = -1;
        this.timer = 0;
        this.request = null;
        this.onKey = this.onKey.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.static) {
            this.state = 'done';
            this.active = 0;
        }

        if (this.shortcut) {
            document.addEventListener('keydown', this.onKey);
        }

        for (const keys of this.querySelectorAll('[data-fb-keys]')) {
            keys.textContent = Search.keys();
        }
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this.onKey);
        super.disconnectedCallback();
    }

    get text() {
        return { ...LABELS, ...this.labels };
    }

    /** The keys that open the search, e.g. "⌘ K", to show next to a button. */
    static keys() {
        return mac() ? '⌘ K' : 'Ctrl K';
    }

    open() {
        const dialog = this.renderRoot.querySelector('dialog');

        if (!dialog || dialog.open) {
            return;
        }

        dialog.showModal();
        const input = this.renderRoot.querySelector('input');
        input.select();
    }

    close() {
        this.renderRoot.querySelector('dialog')?.close();
    }

    onKey(event) {
        // Both everywhere: keyboards and remote desktops do not always match the system.
        if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            this.open();
        }
    }

    onTrigger(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        event.preventDefault();
        this.open();
    }

    onInput(event) {
        this.query = event.target.value;
        clearTimeout(this.timer);

        if (this.query.trim() === '') {
            this.request?.abort();
            this.groups = [];
            this.state = 'idle';
            this.active = -1;

            return;
        }

        this.state = 'searching';
        this.timer = setTimeout(() => this.find(this.query), DELAY);
    }

    async find(query) {
        this.request?.abort();
        this.request = new AbortController();
        const url = new URL(this.src, location.href);
        url.searchParams.set('q', query);

        try {
            const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: this.request.signal });

            if (!response.ok) {
                throw new Error(String(response.status));
            }

            const body = await response.json();

            if (query !== this.query) {
                return;
            }

            this.groups = Array.isArray(body?.data) ? body.data : [];
            this.state = 'done';
            this.active = this.items().length > 0 ? 0 : -1;
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.groups = [];
                this.state = 'failed';
                this.active = -1;
            }
        }
    }

    items() {
        return this.groups.flatMap((group) => group.items ?? []);
    }

    onFieldKey(event) {
        const count = this.items().length;

        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && count > 0) {
            event.preventDefault();
            this.active = event.key === 'ArrowDown' ? (this.active + 1) % count : (this.active - 1 + count) % count;
            this.updateComplete.then(() => this.renderRoot.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }));
        }
    }

    /** Escape closes only the search, not what is around it, e.g. the editing of a field. */
    onDialogKey(event) {
        if (event.key === 'Escape' && !this.static) {
            event.preventDefault();
            event.stopPropagation();
            this.close();
        }
    }

    onSubmit(event) {
        const item = this.items()[this.active];

        if (item && this.state === 'done') {
            event.preventDefault();
            location.assign(item.url);
        }
    }

    status() {
        const text = this.text;
        const count = this.items().length;

        return {
            idle: '',
            searching: text.searching,
            failed: text.failed,
            done: count === 0 ? text.none.replace('{q}', this.query.trim()) : text.found.replace('{count}', String(count)),
        }[this.state];
    }

    render() {
        const text = this.text;
        const items = this.items();
        let index = -1;

        return html`
            <slot @click=${this.onTrigger}></slot>
            <dialog ?open=${this.static} aria-label=${text.search} @keydown=${this.onDialogKey} @close=${() => this.dispatchEvent(new Event('fb-search-close'))}>
                <form method="get" action=${this.src} role="search" @submit=${this.onSubmit}>
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/></svg>
                    <input type="search" name="q" autocomplete="off" spellcheck="false" maxlength="200"
                        role="combobox" aria-autocomplete="list" aria-controls="results" aria-expanded=${items.length > 0 ? 'true' : 'false'}
                        aria-activedescendant=${this.active >= 0 ? `option-${this.active}` : nothing}
                        aria-label=${text.search} placeholder=${text.placeholder} .value=${this.query}
                        @input=${this.onInput} @keydown=${this.onFieldKey}>
                    <button class="close" type="button" @click=${this.close}>${text.close}</button>
                </form>
                <div class="results" id="results" role="listbox" aria-label=${text.search}>${this.groups.map((group, groupIndex) => html`<div role="group" aria-labelledby="group-${groupIndex}">
                    <p class="group" id="group-${groupIndex}" role="presentation">${group.title}</p>
                    ${(group.items ?? []).map((item) => {
                        index += 1;
                        const current = index;

                        return html`<a class="option" id="option-${current}" role="option" href=${item.url} tabindex="-1"
                            aria-selected=${current === this.active ? 'true' : 'false'} @mousemove=${() => { this.active = current; }}>
                            <span class="title">${item.title}</span>${item.meta ? html`<span class="meta">${item.meta}</span>` : nothing}
                            ${item.excerpt ? html`<span class="excerpt">${item.excerpt}</span>` : nothing}
                        </a>`;
                    })}
                </div>`)}</div>
                <div class="footer">
                    <span class="status" role="status">${this.status()}</span>
                    ${this.state === 'done' && items.length > 0
                        ? html`<a href=${`${this.src}?q=${encodeURIComponent(this.query.trim())}`}>${text.all}</a>`
                        : html`<span>${text.hint}</span>`}
                </div>
            </dialog>
        `;
    }
}

customElements.define('fb-search', Search);
