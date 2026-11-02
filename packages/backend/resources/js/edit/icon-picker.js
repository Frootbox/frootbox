import { css, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { sendInParts } from '../ui/parts.js';

const PER_PAGE = 120;
const SEARCH_DELAY = 300;
const SVG_TYPES = ['image/svg+xml', '.svg'];

/**
 * Choosing a symbol for an icon field (decisions 0179, 0182): a dialog
 * of the bar with the sets (theme, extensions, own symbols from the
 * media library), a search and a grid of symbols, page by page from
 * icon.list. An SVG uploaded here goes into the media library and is
 * chosen at once. Fields and the settings panel open it with open().
 *
 * The picker remembers every symbol it has seen, so the panel can show
 * the chosen one with describe().
 */
export class IconPicker {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
        this.seen = new Map();
        this.asked = new Set();
    }

    get labels() {
        return this.bar.labels;
    }

    /**
     * value: the stored name or null; apply(name) and remove() save,
     * done() gives the focus back.
     */
    open({ value, apply, remove, done }) {
        this.state = {
            value, chosen: value ?? null, query: '', set: '', apply, remove, done,
            items: [], total: 0, page: 1, sets: [], loading: true, uploading: null, problems: [],
        };
        this.load(1);
        this.bar.requestUpdate();
        this.bar.updateComplete.then(() => this.bar.renderRoot.querySelector('dialog.icons')?.showModal());
    }

    /** One page of icon.list, null if loading fails. */
    async fetch(params) {
        try {
            const response = await fetch(this.bar.config.queries + 'icon.list?' + new URLSearchParams(params), { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            const body = response.ok ? await response.json() : null;
            (body?.data?.items ?? []).forEach((item) => this.seen.set(item.name, item));

            return body?.data ?? null;
        } catch {
            return null;
        }
    }

    async load(page) {
        const state = this.state;
        const params = { page: String(page), perPage: String(PER_PAGE) };

        if (state.query.trim() !== '') {
            params.search = state.query.trim();
        }

        if (state.set !== '') {
            params.set = state.set;
        }

        this.update({ loading: true });
        const data = await this.fetch(params);
        const first = page === 1 && this.state?.items.length === 0;

        // A newer search, another set or a closed dialog wins.
        if (this.state !== null && this.state.query === state.query && this.state.set === state.set) {
            this.update({
                loading: false,
                page,
                total: data?.total ?? 0,
                sets: data?.sets ?? this.state.sets,
                items: page === 1 ? (data?.items ?? []) : [...this.state.items, ...(data?.items ?? [])],
                problems: data ? [] : [this.labels.failed],
            });

            if (first) {
                this.bar.updateComplete.then(() => {
                    const pressed = this.bar.renderRoot.querySelector('dialog.icons .icon-grid [aria-pressed="true"]');
                    (pressed ?? this.bar.renderRoot.querySelector('dialog.icons input[type="search"]'))?.focus();
                });
            }
        }
    }

    /**
     * The symbol of a name as far as known: {name, label, svg} or null.
     * An unknown one is asked for once; the bar updates when it arrives.
     */
    describe(name) {
        if (!name || this.seen.has(name)) {
            return name ? this.seen.get(name) : null;
        }

        if (!this.asked.has(name)) {
            this.asked.add(name);
            this.fetch({ name, perPage: '1' }).then(() => this.bar.requestUpdate());
        }

        return null;
    }

    search(text) {
        this.update({ query: text });
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.load(1), SEARCH_DELAY);
    }

    choose(set) {
        this.update({ set, items: [], total: 0 });
        this.load(1);
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
    }

    /** An SVG from the computer: into the media library, then chosen. */
    pickFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = SVG_TYPES.join(',');
        input.addEventListener('change', () => input.files?.[0] && this.upload(input.files[0]));
        input.click();
    }

    async upload(file) {
        const labels = this.labels;
        const text = (percent) => labels.uploading.replace('{done}', '1').replace('{total}', '1').replace('{percent}', String(percent));
        this.update({ uploading: text(0), problems: [] });
        const sent = await sendInParts(this.bar.config.uploads, file, {
            headers: { 'X-CSRF-Token': this.bar.config.csrf ?? '' },
            partBytes: this.bar.config.uploadPart,
            failed: labels.failed,
            progress: (done, total) => this.state && this.update({ uploading: text(Math.round((done / Math.max(1, total)) * 100)) }),
        });

        if (!this.state) {
            return;
        }

        if (!sent.ok) {
            this.update({ uploading: null, problems: [`${file.name}: ${sent.problem.errors?.[0]?.message ?? sent.problem.detail}`] });

            return;
        }

        const created = await this.bar.run('media.create', { upload: sent.data.upload });

        if (!this.state) {
            return;
        }

        if (!created.ok || created.data.type !== 'image/svg+xml') {
            this.update({ uploading: null, problems: [`${file.name}: ${created.ok ? labels.notAnSvg : (this.bar.message?.text ?? labels.failed)}`] });

            return;
        }

        this.update({ uploading: null, query: '', set: 'media', items: [], chosen: 'media:' + created.data.id });
        await this.load(1);
    }

    apply() {
        const state = this.state;

        if (!state?.chosen) {
            return;
        }

        this.close(state.chosen === state.value ? null : () => state.apply(state.chosen));
    }

    close(then = null) {
        const state = this.state;
        clearTimeout(this.timer);
        this.bar.renderRoot.querySelector('dialog.icons')?.close();
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
        const mayUpload = this.bar.config.mayUpload;
        const sets = state.sets.filter((set) => set.count > 0 || (set.name === 'media' && mayUpload) || set.name === state.set);
        const all = state.sets.reduce((sum, set) => sum + set.count, 0);
        const more = state.items.length < state.total;
        let list;

        if (state.items.length === 0) {
            const empty = state.set === 'media' ? labels.noOwnIcons : all === 0 ? labels.noIcons : labels.noIconFound;
            list = html`<p class="hint">${state.loading ? labels.loading : empty}</p>`;
        } else {
            list = html`<ul class="icon-grid" aria-label=${labels.icons}>
                ${state.items.map((item) => html`<li><button type="button" aria-pressed=${String(item.name === state.chosen)}
                    @click=${() => this.update({ chosen: item.name })} @dblclick=${() => { this.update({ chosen: item.name }); this.apply(); }}>
                    ${unsafeSVG(item.svg)}<span>${item.label}</span></button></li>`)}
            </ul>
            ${more ? html`<button type="button" class="more" ?disabled=${state.loading} @click=${() => this.load(state.page + 1)}>${labels.loadMore}</button>` : nothing}`;
        }

        return html`<dialog class="icons" aria-labelledby="fb-icons-title" @cancel=${(event) => { event.preventDefault(); this.close(); }}>
            <form @submit=${(event) => { event.preventDefault(); this.apply(); }}>
                <h2 id="fb-icons-title">${labels.chooseIcon}</h2>
                <div class="media-tools">
                    ${sets.length > 1 ? html`<label>${labels.iconSet}
                        <select @change=${(event) => this.choose(event.target.value)}>
                            <option value="" ?selected=${state.set === ''}>${labels.allIconSets}</option>
                            ${sets.map((set) => html`<option .value=${set.name} ?selected=${set.name === state.set}>${set.label} (${set.count})</option>`)}
                        </select></label>` : nothing}
                    <label>${labels.search}
                        <input type="search" .value=${state.query} autocomplete="off" @input=${(event) => this.search(event.target.value)}></label>
                    ${mayUpload ? html`<button type="button" ?disabled=${state.uploading !== null} @click=${() => this.pickFile()}>${labels.uploadSvg}</button>` : nothing}
                </div>
                <p class="hint" role="status">${state.uploading ?? ''}</p>
                ${state.problems.length > 0 ? html`<ul class="problems" role="alert">${state.problems.map((problem) => html`<li>${problem}</li>`)}</ul>` : nothing}
                ${list}
                <div class="actions">
                    ${state.value ? html`<button type="button" class="danger" @click=${() => this.close(state.remove)}>${labels.removeIcon}</button>` : nothing}
                    <button type="button" @click=${() => this.close()}>${labels.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!state.chosen}>${labels.apply}</button>
                </div>
            </form>
        </dialog>`;
    }
}

export const iconPickerStyles = css`
    dialog.icons { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--fb-space-16) * 1.5), 1fr));
        gap: var(--fb-space-2);
        max-block-size: calc(var(--fb-space-16) * 5);
        margin: 0;
        padding: var(--fb-space-1);
        overflow-y: auto;
        list-style: none;
    }

    .icon-grid button {
        display: grid;
        justify-items: center;
        gap: var(--fb-space-1);
        inline-size: 100%;
        padding: var(--fb-space-2) var(--fb-space-1);
        border-color: transparent;
        font-weight: var(--fb-weight-regular);
    }

    .icon-grid svg {
        inline-size: var(--fb-space-8);
        block-size: var(--fb-space-8);
        color: var(--fb-text);
    }

    .icon-grid span {
        max-inline-size: 100%;
        overflow: hidden;
        font-size: var(--fb-text-xs);
        color: var(--fb-text-muted);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .icon-grid button[aria-pressed="true"] {
        border-color: var(--fb-accent);
        background: var(--fb-accent-soft);
        box-shadow: inset 0 0 0 var(--fb-size-focus) var(--fb-accent);
    }

    dialog.icons .more { justify-self: start; }
`;
