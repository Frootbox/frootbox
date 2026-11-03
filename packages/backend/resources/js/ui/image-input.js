// SPDX-License-Identifier: MIT
import { LitElement, css, html, nothing } from 'lit';

const PER_PAGE = 24;
const SEARCH_DELAY = 300;

const LABELS = {
    choose: 'Choose an image',
    change: 'Change',
    remove: 'Remove',
    title: 'Choose an image',
    search: 'Search the media',
    more: 'Show more',
    close: 'Close',
    alt: 'Alternative text',
    altHint: 'What the image shows, for people who cannot see it.',
    none: 'No images found.',
    loading: 'Loading …',
    failed: 'The media could not be loaded. Try again.',
};

/**
 * <fb-image-input>: an image from the media library in a form of the
 * backend (decision 0220), stored like an image field: {media, alt}. The
 * hidden field inside holds it as JSON, {} for none:
 *
 *     <fb-image-input src="/cms/queries/media.list" preview="/media/…" file="beans.jpg" labels='{…}'>
 *         <input type="hidden" name="image" data-type="json" value='{"media": "01J…", "alt": "Beans"}'>
 *     </fb-image-input>
 *
 * - src: the query media.list of the backend
 * - preview, file: the address of a preview and the file name of the current image
 * - labels: the texts, see LABELS
 *
 * New files go up on the screen "Media"; the dialog lists what is there.
 */
export class ImageInput extends LitElement {
    static properties = {
        src: {},
        preview: {},
        file: {},
        labels: { type: Object },
        value: { state: true },
        state: { state: true },
    };

    static styles = css`
        :host { display: block; }

        .chosen { display: flex; flex-wrap: wrap; gap: var(--fb-space-4); align-items: flex-start; }

        figure { display: flex; flex-direction: column; gap: var(--fb-space-1); margin: 0; }

        figure img {
            display: block;
            inline-size: calc(var(--fb-size-dialog) * 0.3);
            max-inline-size: 100%;
            block-size: auto;
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-md);
            background: var(--fb-surface-2);
        }

        figcaption { color: var(--fb-text-muted); font-size: var(--fb-text-sm); overflow-wrap: anywhere; }

        .side { display: flex; flex: 1; flex-direction: column; gap: var(--fb-space-3); min-inline-size: min(100%, calc(var(--fb-size-dialog) * 0.4)); }

        label { font-weight: var(--fb-weight-medium); font-size: var(--fb-text-sm); }

        .hint { margin: 0; color: var(--fb-text-muted); font-size: var(--fb-text-sm); }

        input[type="search"], input[type="text"] {
            box-sizing: border-box;
            inline-size: 100%;
            min-block-size: var(--fb-size-control);
            padding: 0 var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border-strong);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: var(--fb-text);
            font: inherit;
        }

        .buttons { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); }

        button {
            min-block-size: var(--fb-size-control-sm);
            padding: 0 var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border-strong);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: var(--fb-text);
            font: inherit;
            font-size: var(--fb-text-sm);
            cursor: pointer;
        }

        button:hover { background: var(--fb-surface-2); }

        button:disabled { cursor: not-allowed; opacity: 0.6; }

        button:focus-visible, input:focus-visible { outline: var(--fb-size-focus) solid var(--fb-focus); outline-offset: var(--fb-size-focus-offset); }

        dialog {
            box-sizing: border-box;
            inline-size: min(var(--fb-size-dialog), 100% - 2 * var(--fb-space-4));
            max-block-size: calc(100% - 2 * var(--fb-space-6));
            padding: 0;
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            background: var(--fb-surface);
            color: var(--fb-text);
            font-family: var(--fb-font-family);
            font-size: var(--fb-text-base);
            box-shadow: var(--fb-shadow-lg);
        }

        dialog[open] { display: flex; flex-direction: column; }

        dialog::backdrop { background: var(--fb-backdrop); }

        header { display: flex; gap: var(--fb-space-3); align-items: center; justify-content: space-between; padding: var(--fb-space-4) var(--fb-space-6); border-block-end: var(--fb-size-border) solid var(--fb-border); }

        h2 { margin: 0; font-size: var(--fb-text-lg); font-weight: var(--fb-weight-bold); }

        .body { display: flex; flex: 1 1 auto; flex-direction: column; gap: var(--fb-space-4); min-block-size: 0; padding: var(--fb-space-4) var(--fb-space-6) var(--fb-space-6); overflow-y: auto; }

        ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(var(--fb-size-dialog) * 0.2), 1fr)); gap: var(--fb-space-3); margin: 0; padding: 0; list-style: none; }

        ul button { display: flex; flex-direction: column; gap: var(--fb-space-1); inline-size: 100%; padding: var(--fb-space-1); text-align: start; }

        ul button[aria-pressed="true"] { border-color: var(--fb-accent); outline: var(--fb-size-focus) solid var(--fb-accent); }

        ul img { display: block; inline-size: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--fb-radius-sm); background: var(--fb-surface-2); }

        ul span { overflow: hidden; color: var(--fb-text-muted); font-size: var(--fb-text-sm); text-overflow: ellipsis; white-space: nowrap; }

        .status { margin: 0; color: var(--fb-text-muted); font-size: var(--fb-text-sm); }
    `;

    constructor() {
        super();
        this.src = '';
        this.preview = '';
        this.file = '';
        this.labels = {};
        this.value = null;
        this.state = { query: '', items: [], total: 0, page: 0, loading: false, failed: false };
        this.timer = null;
    }

    get text() {
        return { ...LABELS, ...this.labels };
    }

    get input() {
        return this.querySelector('input');
    }

    connectedCallback() {
        super.connectedCallback();

        try {
            const value = JSON.parse(this.input?.value || '{}');
            this.value = value && typeof value.media === 'string' ? value : null;
        } catch {
            this.value = null;
        }
    }

    /** Writes the value into the hidden field, as the form sends it. */
    store(value) {
        this.value = value;

        if (this.input) {
            this.input.value = JSON.stringify(value ?? {});
            this.input.dispatchEvent(new Event('input', { bubbles: true }));
            this.input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    open() {
        this.renderRoot.querySelector('dialog').showModal();
        this.renderRoot.querySelector('input[type="search"]')?.focus();

        if (this.state.page === 0) {
            this.load(1);
        }
    }

    close() {
        this.renderRoot.querySelector('dialog')?.close();
        this.renderRoot.querySelector('.open')?.focus();
    }

    async load(page) {
        const query = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE), kind: 'image' });
        const search = this.state.query.trim();

        if (search !== '') {
            query.set('search', search);
        }

        this.state = { ...this.state, loading: true, failed: false };
        let body = null;

        try {
            const response = await fetch(this.src + '?' + query, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            body = response.ok ? await response.json() : null;
        } catch {
            body = null;
        }

        // A newer search wins.
        if (search !== this.state.query.trim()) {
            return;
        }

        const items = body?.data?.items ?? [];
        this.state = {
            ...this.state,
            loading: false,
            failed: body === null,
            page,
            total: body?.data?.total ?? 0,
            items: page === 1 ? items : [...this.state.items, ...items],
        };
    }

    search(text) {
        this.state = { ...this.state, query: text };
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.load(1), SEARCH_DELAY);
    }

    choose(item) {
        this.preview = item.preview;
        this.file = item.fileName;
        this.store({ media: item.id, alt: this.value?.media === item.id ? this.value.alt ?? '' : '' });
        this.close();
    }

    remove() {
        this.preview = '';
        this.file = '';
        this.store(null);
    }

    onKey(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.close();
        }
    }

    render() {
        const text = this.text;
        const disabled = this.input?.disabled ?? false;
        const value = this.value;

        return html`
            <slot></slot>
            ${value ? html`<div class="chosen">
                <figure>${this.preview ? html`<img src=${this.preview} alt="" decoding="async">` : nothing}<figcaption>${this.file || value.media}</figcaption></figure>
                <div class="side">
                    <label for="alt">${text.alt}</label>
                    <input id="alt" type="text" maxlength="500" aria-describedby="alt-hint" .value=${value.alt ?? ''} ?disabled=${disabled}
                        @input=${(event) => this.store({ ...value, alt: event.target.value })}>
                    <p class="hint" id="alt-hint">${text.altHint}</p>
                    <div class="buttons">
                        <button class="open" type="button" ?disabled=${disabled} @click=${() => this.open()}>${text.change}</button>
                        <button type="button" ?disabled=${disabled} @click=${() => this.remove()}>${text.remove}</button>
                    </div>
                </div>
            </div>` : html`<button class="open" type="button" ?disabled=${disabled} @click=${() => this.open()}>${text.choose}</button>`}
            <dialog aria-labelledby="title" @keydown=${this.onKey}>
                <header>
                    <h2 id="title">${text.title}</h2>
                    <button type="button" @click=${() => this.close()}>${text.close}</button>
                </header>
                <div class="body">
                    <input type="search" aria-label=${text.search} placeholder=${text.search} .value=${this.state.query} @input=${(event) => this.search(event.target.value)}>
                    ${this.state.failed ? html`<p class="status" role="alert">${text.failed}</p>` : nothing}
                    ${this.state.items.length > 0 ? html`<ul>${this.state.items.map((item) => html`<li><button type="button" aria-pressed=${String(item.id === value?.media)} @click=${() => this.choose(item)}>
                        <img src=${item.preview} alt="" loading="lazy" decoding="async"><span>${item.fileName}</span></button></li>`)}</ul>` : nothing}
                    ${!this.state.loading && !this.state.failed && this.state.page > 0 && this.state.items.length === 0 ? html`<p class="status">${text.none}</p>` : nothing}
                    ${this.state.loading ? html`<p class="status" role="status">${text.loading}</p>` : nothing}
                    ${!this.state.loading && this.state.items.length < this.state.total ? html`<div><button type="button" @click=${() => this.load(this.state.page + 1)}>${text.more}</button></div>` : nothing}
                </div>
            </dialog>
        `;
    }
}

customElements.define('fb-image-input', ImageInput);
