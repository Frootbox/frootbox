import { css, html, nothing } from 'lit';

/** The image types the media library takes (decision 0126). */
const TYPES = 'image/jpeg,image/png,image/webp,image/gif';
const PER_PAGE = 24;
const SEARCH_DELAY = 300;

/**
 * Choosing an image in the editing mode (decision 0126): a dialog of the
 * bar with the media library, a search, uploads and the alternative text
 * for this place. The bar keeps one instance; fields and the settings
 * panel open it with open().
 */
export class MediaPicker {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
        this.timer = null;
    }

    get labels() {
        return this.bar.labels;
    }

    /**
     * value: the stored value {media, alt?} or null; apply(value) and
     * remove() save, done() gives the focus back.
     */
    open({ value, apply, remove, done }) {
        this.state = {
            value,
            apply,
            remove,
            done,
            chosen: value?.media ?? null,
            alt: value?.alt ?? '',
            query: '',
            items: [],
            total: 0,
            page: 0,
            loading: true,
            uploading: null,
            problems: [],
        };
        this.load(1);
        this.bar.requestUpdate();
        this.bar.updateComplete.then(() => {
            this.bar.renderRoot.querySelector('dialog.media')?.showModal();
            this.bar.renderRoot.querySelector('dialog.media input[type="search"]')?.focus();
        });
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
    }

    async load(page) {
        const state = this.state;
        const query = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) });

        if (state.query.trim() !== '') {
            query.set('search', state.query.trim());
        }

        this.update({ loading: true });
        let body = null;

        try {
            const response = await fetch(this.bar.config.queries + 'media.list?' + query, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            body = response.ok ? await response.json() : null;
        } catch {
            body = null;
        }

        // A newer search or a closed dialog wins.
        if (this.state !== null && this.state.query === state.query) {
            const items = body?.data?.items ?? [];
            this.update({
                loading: false,
                page,
                total: body?.data?.total ?? 0,
                items: page === 1 ? items : [...this.state.items, ...items],
                problems: body ? [] : [this.labels.failed],
            });
        }
    }

    search(text) {
        this.update({ query: text });
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.load(1), SEARCH_DELAY);
    }

    /** Uploads the files one after another and chooses the last one. */
    async upload(files) {
        const problems = [];

        for (const [index, file] of files.entries()) {
            this.update({ uploading: this.labels.uploading.replace('{done}', String(index + 1)).replace('{total}', String(files.length)) });
            const body = new FormData();
            body.append('file', file, file.name);
            const response = await this.bar.send(this.bar.config.uploads, body);
            const answer = response ? await response.json().catch(() => null) : null;

            if (!response?.ok) {
                problems.push(`${file.name}: ${answer?.errors?.[0]?.message ?? answer?.detail ?? this.labels.failed}`);

                continue;
            }

            const created = await this.bar.run('media.create', { upload: answer.data.upload });

            if (created.ok && this.state) {
                this.update({ items: [created.data, ...this.state.items], total: this.state.total + 1, chosen: created.data.id });
            } else if (!created.ok) {
                problems.push(`${file.name}: ${this.bar.message?.text ?? this.labels.failed}`);
            }
        }

        if (this.state) {
            this.update({ uploading: null, problems });
        }
    }

    choose() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = TYPES;
        input.addEventListener('change', () => this.upload([...(input.files ?? [])]));
        input.click();
    }

    apply() {
        const state = this.state;

        if (!state?.chosen) {
            return;
        }

        const value = { media: state.chosen };

        if (state.alt.trim() !== '') {
            value.alt = state.alt.trim();
        }

        this.close(() => state.apply(value));
    }

    close(then = null) {
        const state = this.state;
        clearTimeout(this.timer);
        this.bar.renderRoot.querySelector('dialog.media')?.close();
        this.state = null;
        this.bar.requestUpdate();
        then?.();
        state?.done?.();
    }

    dialog() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;
        const more = state.items.length < state.total;
        let list;

        if (state.items.length === 0) {
            list = html`<p class="hint">${state.loading ? labels.loading : state.query.trim() !== '' ? labels.noMediaFound : labels.noMedia}</p>`;
        } else {
            list = html`<ul class="media-grid" aria-label=${labels.mediaLibrary}>
                ${state.items.map((item) => html`<li><button type="button" aria-pressed=${String(item.id === state.chosen)}
                    @click=${() => this.update({ chosen: item.id })} @dblclick=${() => { this.update({ chosen: item.id }); this.apply(); }}>
                    <img src=${item.preview} alt="" width=${item.width} height=${item.height} loading="lazy" decoding="async">
                    <span>${item.fileName}</span></button></li>`)}
            </ul>
            ${more ? html`<button type="button" ?disabled=${state.loading} @click=${() => this.load(state.page + 1)}>${labels.loadMore}</button>` : nothing}`;
        }

        return html`<dialog class="media" aria-labelledby="fb-media-title" @cancel=${(event) => { event.preventDefault(); this.close(); }}>
            <form @submit=${(event) => { event.preventDefault(); this.apply(); }}>
                <h2 id="fb-media-title">${labels.chooseImage}</h2>
                <div class="media-tools">
                    <label>${labels.search}
                        <input type="search" .value=${state.query} autocomplete="off" @input=${(event) => this.search(event.target.value)}></label>
                    ${this.bar.config.mayUpload ? html`<button type="button" ?disabled=${state.uploading !== null} @click=${() => this.choose()}>${labels.upload}</button>` : nothing}
                </div>
                <p class="hint" role="status">${state.uploading ?? ''}</p>
                ${state.problems.length > 0 ? html`<ul class="problems" role="alert">${state.problems.map((problem) => html`<li>${problem}</li>`)}</ul>` : nothing}
                ${list}
                <label>${labels.altHere}
                    <input type="text" .value=${state.alt} maxlength="500" aria-describedby="fb-media-alt-hint"
                        @input=${(event) => this.update({ alt: event.target.value })}></label>
                <p class="hint" id="fb-media-alt-hint">${labels.altHereHint}</p>
                <div class="actions">
                    ${state.value ? html`<button type="button" class="danger" @click=${() => this.close(state.remove)}>${labels.removeImage}</button>` : nothing}
                    <button type="button" @click=${() => this.close()}>${labels.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!state.chosen}>${labels.apply}</button>
                </div>
            </form>
        </dialog>`;
    }
}

export const mediaStyles = css`
    dialog.media { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    dialog input[type="search"] {
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-weight: var(--fb-weight-regular);
    }

    .media-tools { display: flex; flex-wrap: wrap; gap: var(--fb-space-3); align-items: end; }

    .media-tools label { flex: 1 1 calc(var(--fb-space-16) * 3); }

    .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--fb-space-16) * 2), 1fr));
        gap: var(--fb-space-3);
        max-block-size: calc(var(--fb-space-16) * 6);
        margin: 0;
        padding: var(--fb-space-1);
        overflow-y: auto;
        list-style: none;
    }

    .media-grid button {
        display: grid;
        gap: var(--fb-space-1);
        inline-size: 100%;
        padding: var(--fb-space-1);
        border-color: transparent;
        font-weight: var(--fb-weight-regular);
        text-align: start;
    }

    .media-grid img {
        inline-size: 100%;
        block-size: auto;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface-2);
    }

    .media-grid span {
        overflow: hidden;
        font-size: var(--fb-text-xs);
        color: var(--fb-text-muted);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .media-grid button[aria-pressed="true"] {
        border-color: var(--fb-accent);
        background: var(--fb-accent-soft);
        box-shadow: inset 0 0 0 var(--fb-size-focus) var(--fb-accent);
    }

    .problems { margin: 0; padding-inline-start: var(--fb-space-4); color: var(--fb-danger-text); }
`;
