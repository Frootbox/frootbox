import { css, html, nothing } from 'lit';
import { IMAGE_TYPES, VIDEO_TYPES, sendInParts } from '../ui/parts.js';

const PER_PAGE = 24;
const SEARCH_DELAY = 300;

/**
 * Choosing an image in the editing mode (decision 0126): a dialog of the
 * bar with the media library, a search, uploads and the alternative text
 * for this place. The bar keeps one instance; fields and the settings
 * panel open it with open().
 *
 * Uploading one image for a field that has one already: if the image
 * there is used at other places as well, the dialog asks whether the
 * new one counts only here (a new medium) or everywhere (media.replace,
 * decision 0146).
 *
 * A video field (decision 0177) has two tabs: the video and the image
 * shown before it starts. Its value is {media, poster?}; the description
 * from the media library names the video, so it has no text here.
 * Files go in parts, so large videos arrive as well.
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
     * kind: "image" or "video"; value: the stored value {media, alt?} or
     * {media, poster?} or null; apply(value) and remove() save, done()
     * gives the focus back.
     */
    open({ kind = 'image', value, apply, remove, done }) {
        this.state = {
            kind,
            tab: 'media',
            value,
            apply,
            remove,
            done,
            chosen: value?.media ?? null,
            poster: value?.poster ?? null,
            seen: {},
            alt: value?.alt ?? '',
            query: '',
            items: [],
            total: 0,
            page: 0,
            loading: true,
            uploading: null,
            question: null,
            replaced: false,
            problems: [],
            notices: [],
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

    /** What the list shows: videos on the first tab of a video field, else images. */
    listKind(state = this.state) {
        return state.kind === 'video' && state.tab === 'media' ? 'video' : 'image';
    }

    /** The choice of the open tab. */
    picked(state = this.state) {
        return state.tab === 'poster' ? state.poster : state.chosen;
    }

    pick(id) {
        const item = this.state.items.find((entry) => entry.id === id);
        const seen = item ? { ...this.state.seen, [id]: item } : this.state.seen;
        this.update(this.state.tab === 'poster' ? { poster: id, seen } : { chosen: id, seen });
    }

    tab(name) {
        if (this.state.tab !== name) {
            this.update({ tab: name, items: [], total: 0, problems: [], notices: [] });
            this.load(1);
        }
    }

    async load(page) {
        const state = this.state;
        const query = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE), kind: this.listKind(state) });

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

        // A newer search, another tab or a closed dialog wins.
        if (this.state !== null && this.state.query === state.query && this.state.tab === state.tab) {
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
        const notices = [];
        // Replacing everywhere is for the image or video itself, not for a poster.
        const current = this.state.tab === 'media' ? (this.state.value?.media ?? null) : null;

        for (const [index, file] of files.entries()) {
            const text = (percent) => this.labels.uploading.replace('{done}', String(index + 1)).replace('{total}', String(files.length)).replace('{percent}', String(percent));
            this.update({ uploading: text(0) });
            const sent = await sendInParts(this.bar.config.uploads, file, {
                headers: { 'X-CSRF-Token': this.bar.config.csrf ?? '' },
                partBytes: this.bar.config.uploadPart,
                failed: this.labels.failed,
                progress: (done, total) => this.state && this.update({ uploading: text(Math.round((done / Math.max(1, total)) * 100)) }),
            });

            if (!sent.ok) {
                problems.push(`${file.name}: ${sent.problem.errors?.[0]?.message ?? sent.problem.detail}`);

                continue;
            }

            const elsewhere = files.length === 1 && current && this.bar.config.mayReplace ? await this.elsewhere(current) : 0;

            if (elsewhere > 0 && this.state) {
                this.update({ uploading: null, problems, notices, question: { upload: sent.data.upload, name: file.name, media: current, places: elsewhere + 1 } });

                return;
            }

            await this.create(sent.data.upload, file.name, problems, notices);
        }

        if (this.state) {
            this.update({ uploading: null, problems, notices });
        }
    }

    /** How many other places use the medium, besides this page in this language. */
    async elsewhere(id) {
        let body = null;

        try {
            const response = await fetch(this.bar.config.queries + 'media.usages?' + new URLSearchParams({ id }), { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            body = response.ok ? await response.json() : null;
        } catch {
            body = null;
        }

        const page = this.bar.config.page?.id ?? null;
        const language = this.bar.config.language;

        return (body?.data ?? []).filter((usage) => !(usage.type === 'page' && usage.id === page && usage.language === language)).length;
    }

    /** A new medium from the upload, or the one with the same file. */
    async create(upload, name, problems, notices) {
        const created = await this.bar.run('media.create', { upload });

        if (created.ok && this.state) {
            // The same file is already in the library: no second copy (decision 0146).
            const others = this.state.items.filter((item) => item.id !== created.data.id);
            this.update({ items: [created.data, ...others], total: this.state.total + (created.data.existing ? 0 : 1) });
            this.pick(created.data.id);

            if (created.data.existing) {
                notices.push(this.labels.alreadyInLibrary.replace('{name}', created.data.fileName));
            }
        } else if (!created.ok) {
            problems.push(`${name}: ${this.bar.message?.text ?? this.labels.failed}`);
        }
    }

    /** Answers the question: only here (a new medium) or everywhere (media.replace). */
    async answer(everywhere) {
        const question = this.state?.question;

        if (!question) {
            return;
        }

        const problems = [];
        const notices = [];
        this.update({ question: null, uploading: this.labels.uploading.replace('{done}', '1').replace('{total}', '1') });

        if (!everywhere) {
            await this.create(question.upload, question.name, problems, notices);
        } else {
            const replaced = await this.bar.run('media.replace', { id: question.media, upload: question.upload });

            if (replaced.ok && this.state) {
                const others = this.state.items.filter((item) => item.id !== replaced.data.id);
                this.update({ items: [replaced.data, ...others], replaced: true });
                this.pick(replaced.data.id);
                notices.push(replaced.data.draft ? this.labels.replacedInDraft : this.labels.replacedEverywhere);
            } else if (!replaced.ok) {
                problems.push(`${question.name}: ${this.bar.message?.text ?? this.labels.failed}`);
            }
        }

        if (this.state) {
            this.update({ uploading: null, problems, notices });
        }
    }

    choose() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = (this.listKind() === 'video' ? VIDEO_TYPES : IMAGE_TYPES).join(',');
        input.addEventListener('change', () => this.upload([...(input.files ?? [])]));
        input.click();
    }

    apply() {
        const state = this.state;

        if (!state?.chosen) {
            return;
        }

        const value = { media: state.chosen };
        const item = (id) => state.items.find((entry) => entry.id === id) ?? state.seen[id];
        this.bar.mediaChosen(item(state.chosen));

        if (state.kind === 'video') {
            if (state.poster) {
                value.poster = state.poster;
                this.bar.mediaChosen(item(state.poster));
            }
        } else if (state.alt.trim() !== '') {
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
        const saving = then?.();
        state?.done?.();

        // A new file for every place: the page shows it once loaded again, like after undo.
        if (state?.replaced) {
            Promise.resolve(saving).finally(() => location.reload());
        }
    }

    dialog() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;
        const more = state.items.length < state.total;
        const video = state.kind === 'video';
        const picked = this.picked(state);
        let list;

        if (state.items.length === 0) {
            const empty = this.listKind(state) === 'video' ? labels.noVideos : labels.noMedia;
            list = html`<p class="hint">${state.loading ? labels.loading : state.query.trim() !== '' ? labels.noMediaFound : empty}</p>`;
        } else {
            list = html`<ul class="media-grid" aria-label=${labels.mediaLibrary}>
                ${state.items.map((item) => html`<li><button type="button" aria-pressed=${String(item.id === picked)}
                    @click=${() => this.pick(item.id)} @dblclick=${() => { this.pick(item.id); this.apply(); }}>
                    ${item.kind === 'video'
                        ? html`<video src=${item.preview} preload="metadata" muted playsinline aria-hidden="true"></video>`
                        : html`<img src=${item.preview} alt="" width=${item.width} height=${item.height} loading="lazy" decoding="async">`}
                    <span>${item.fileName}</span></button></li>`)}
            </ul>
            ${more ? html`<button type="button" ?disabled=${state.loading} @click=${() => this.load(state.page + 1)}>${labels.loadMore}</button>` : nothing}`;
        }

        const tabs = video
            ? html`<div class="media-tabs" role="group" aria-label=${labels.chooseVideo}>
                ${[['media', labels.videoTab], ['poster', labels.posterTab]].map(([name, label]) => html`<button type="button" aria-pressed=${String(state.tab === name)} @click=${() => this.tab(name)}>${label}</button>`)}
            </div>`
            : nothing;
        const texts = video
            ? (state.tab === 'poster'
                ? html`<p class="hint">${labels.posterHint}</p>
                    ${state.poster ? html`<div class="actions start"><button type="button" @click=${() => this.update({ poster: null })}>${labels.noPoster}</button></div>` : nothing}`
                : html`<p class="hint">${labels.videoHint}</p>`)
            : html`<label>${labels.altHere}
                    <input type="text" .value=${state.alt} maxlength="500" aria-describedby="fb-media-alt-hint"
                        @input=${(event) => this.update({ alt: event.target.value })}></label>
                <p class="hint" id="fb-media-alt-hint">${labels.altHereHint}</p>`;

        return html`<dialog class="media" aria-labelledby="fb-media-title" @cancel=${(event) => { event.preventDefault(); this.close(); }}>
            <form @submit=${(event) => { event.preventDefault(); this.apply(); }}>
                <h2 id="fb-media-title">${video ? labels.chooseVideo : labels.chooseImage}</h2>
                ${tabs}
                <div class="media-tools">
                    <label>${labels.search}
                        <input type="search" .value=${state.query} autocomplete="off" @input=${(event) => this.search(event.target.value)}></label>
                    ${this.bar.config.mayUpload ? html`<button type="button" ?disabled=${state.uploading !== null || state.question !== null} @click=${() => this.choose()}>${labels.upload}</button>` : nothing}
                </div>
                <p class="hint" role="status">${state.uploading ?? ''}</p>
                ${state.question ? html`<div class="question" role="group" aria-labelledby="fb-media-question">
                    <p id="fb-media-question">${labels.replaceWhere.replace('{name}', state.question.name)}</p>
                    <div class="actions">
                        <button type="button" @click=${() => this.answer(false)}>${labels.replaceHere}</button>
                        <button type="button" class="primary" @click=${() => this.answer(true)}>${labels.replaceEverywhere.replace('{count}', String(state.question.places))}</button>
                    </div>
                </div>` : nothing}
                ${state.problems.length > 0 ? html`<ul class="problems" role="alert">${state.problems.map((problem) => html`<li>${problem}</li>`)}</ul>` : nothing}
                ${state.notices.length > 0 ? html`<ul class="notices" role="status">${state.notices.map((notice) => html`<li>${notice}</li>`)}</ul>` : nothing}
                ${list}
                ${texts}
                <div class="actions">
                    ${state.value ? html`<button type="button" class="danger" @click=${() => this.close(state.remove)}>${video ? labels.removeVideo : labels.removeImage}</button>` : nothing}
                    <button type="button" @click=${() => this.close()}>${labels.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!state.chosen || state.question !== null}>${labels.apply}</button>
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

    .media-tabs { display: flex; gap: var(--fb-space-2); }

    .media-tabs button[aria-pressed="true"] {
        border-color: var(--fb-accent);
        background: var(--fb-accent-soft);
        color: var(--fb-accent-text);
    }

    .actions.start { justify-content: flex-start; }

    .media-grid :is(img, video) {
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

    .notices { margin: 0; padding-inline-start: var(--fb-space-4); color: var(--fb-text-muted); }

    .question {
        display: grid;
        gap: var(--fb-space-3);
        padding: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
    }

    .question p { margin: 0; }
`;
