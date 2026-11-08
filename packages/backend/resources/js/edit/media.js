import { css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { DOCUMENT_TYPES, IMAGE_TYPES, VIDEO_TYPES, sendInParts } from '../ui/parts.js';
import '../ui/focus.js';
import { icon } from './icons.js';

const PER_PAGE = 24;
const SEARCH_DELAY = 300;

/**
 * Choosing an image in the editing mode (decision 0126): a dialog of the
 * bar in two columns (decision 0203). The media library on one side with
 * a search and uploads chooses the medium; "At this place" on the other
 * shows it and sets what counts only here: alternative text, caption
 * (if the field has one) and copyright. A copyright typed for a medium
 * without one goes to the medium, so it counts everywhere. The bar
 * keeps one instance; fields and the settings panel open it with open().
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
 *
 * A file field (decision 0179) lists the documents and has a link text
 * instead of the alternative text: {media, text?}.
 */
export class MediaPicker {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
        this.timer = null;
        // Counts the openings, so late answers know whether their dialog is still open.
        this.opened = 0;
    }

    get labels() {
        return this.bar.labels;
    }

    /**
     * kind: "image", "video" or "file"; value: the stored value {media, alt?,
     * caption?, copyright?}, {media, poster?}, {media, text?} or null; caption:
     * whether the image field has one; focus: "alt", "caption",
     * "copyright" or "focus" (the focus point, decision 0346) to start there; apply(value) and remove() save, done() gives the focus back.
     */
    open({ kind = 'image', value, caption = false, focus = null, apply, remove, done }) {
        this.opened++;
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
            text: value?.text ?? '',
            withCaption: kind === 'image' && caption,
            caption: value?.caption ?? '',
            copyright: value?.copyright ?? '',
            // The AI label of the chosen medium, null while untouched (decision 0251).
            ai: null,
            // The focus point {x, y} of the chosen medium, null while untouched (decision 0346).
            point: null,
            refresh: false,
            query: '',
            items: [],
            total: 0,
            page: 0,
            loading: true,
            uploading: null,
            question: null,
            replaced: false,
            applying: false,
            problems: [],
            notices: [],
        };
        this.load(1);

        const shown = [value?.media, value?.poster].filter(Boolean).map((id) => this.show(id));
        const opened = this.opened;

        this.bar.requestUpdate();
        this.bar.updateComplete.then(async () => {
            this.bar.renderRoot.querySelector('dialog.media')?.showModal();

            // The focus point needs the medium, which comes a moment later.
            if (focus === 'focus' && this.state?.chosen) {
                await Promise.all(shown);
                await this.bar.updateComplete;
            }

            if (this.opened !== opened) {
                return;
            }

            const start = !focus || !this.state?.chosen ? null
                : focus === 'focus' ? 'dialog.media .fb-focus__marker'
                : `dialog.media [name="${focus}"]`;
            ((start && this.bar.renderRoot.querySelector(start)) ?? this.bar.renderRoot.querySelector('dialog.media input[type="search"]'))?.focus();
        });
    }

    /** Loads a chosen medium that may not be on the first page of the list, for its preview and texts. */
    async show(id) {
        const opened = this.opened;
        let body = null;

        try {
            const response = await fetch(this.bar.config.queries + 'media.show?' + new URLSearchParams({ id }), { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            body = response.ok ? await response.json() : null;
        } catch {
            body = null;
        }

        if (body?.data && this.state && this.opened === opened) {
            this.update({ seen: { ...this.state.seen, [id]: body.data } });
        }
    }

    /** A medium of the list or one seen before. */
    item(id, state = this.state) {
        return id ? (state.items.find((entry) => entry.id === id) ?? state.seen[id] ?? null) : null;
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
    }

    /** What the list shows: videos on the first tab of a video field, documents for a file, else images. */
    listKind(state = this.state) {
        if (state.kind === 'file') {
            return 'document';
        }

        return state.kind === 'video' && state.tab === 'media' ? 'video' : 'image';
    }

    /** The choice of the open tab. */
    picked(state = this.state) {
        return state.tab === 'poster' ? state.poster : state.chosen;
    }

    pick(id) {
        const item = this.state.items.find((entry) => entry.id === id);
        const seen = item ? { ...this.state.seen, [id]: item } : this.state.seen;
        this.update(this.state.tab === 'poster' ? { poster: id, seen } : { chosen: id, seen, ai: null, point: null });
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
        input.accept = ({ video: VIDEO_TYPES, document: DOCUMENT_TYPES }[this.listKind()] ?? IMAGE_TYPES).join(',');
        input.addEventListener('change', () => this.upload([...(input.files ?? [])]));
        input.click();
    }

    async apply() {
        const state = this.state;

        if (!state?.chosen || state.applying) {
            return;
        }

        const opened = this.opened;
        const value = { media: state.chosen };
        const item = (id) => this.item(id, state);
        this.bar.mediaChosen(item(state.chosen));

        if (state.kind === 'video') {
            if (state.poster) {
                value.poster = state.poster;
                this.bar.mediaChosen(item(state.poster));
            }
        } else if (state.kind === 'file') {
            if (state.text.trim() !== '') {
                value.text = state.text.trim();
            }
        } else {
            if (state.alt.trim() !== '') {
                value.alt = state.alt.trim();
            }

            if (state.withCaption && state.caption.trim() !== '') {
                value.caption = state.caption.trim();
            }

            const copyright = state.copyright.trim();
            const medium = item(state.chosen);

            if (copyright !== '' && copyright !== (medium?.copyright ?? '')) {
                // The first copyright of a medium counts everywhere (decision 0203).
                const saved = this.toMedium(medium) ? await this.saveCopyright(medium, copyright) : false;

                if (!saved) {
                    value.copyright = copyright;
                }
            }

            // The label belongs to the medium and counts everywhere (decision 0251).
            if (state.ai !== null && medium && state.ai !== (medium.ai ?? 'none') && this.bar.config.mayUpdateMedia) {
                await this.saveMedium(medium, { ai: state.ai });
            }

            // So does the focus point; the page shows the new cut once swapped (decision 0346).
            if (state.point && this.focusable(medium) && !samePoint(state.point, medium.focus)) {
                if (await this.saveMedium(medium, { focusX: round(state.point.x), focusY: round(state.point.y) }) && this.state) {
                    this.update({ refresh: true });
                }
            }

            // Closed meanwhile.
            if (!this.state || this.opened !== opened) {
                return;
            }
        }

        this.close(() => state.apply(value));
    }

    /** Whether the focus point of a medium can be set here: an image other than SVG, and the right to change media. */
    focusable(medium) {
        return Boolean(medium && medium.kind === 'image' && medium.type !== 'image/svg+xml' && medium.focus && this.bar.config.mayUpdateMedia);
    }

    /** Whether a copyright typed here goes to the medium: it has none yet and the user may change it. */
    toMedium(medium) {
        return Boolean(medium && this.bar.config.mayUpdateMedia && (medium.copyright ?? '') === '');
    }

    async saveCopyright(medium, copyright) {
        return this.saveMedium(medium, { copyright });
    }

    /** Saves values of the medium itself, in its draft when it is public. */
    async saveMedium(medium, values) {
        this.update({ applying: true });
        const updated = await this.bar.run('media.update', { id: medium.id, ...values });

        if (this.state) {
            this.update({ applying: false });
        }

        if (!updated.ok) {
            return false;
        }

        this.bar.mediaChosen(updated.data);

        return true;
    }

    close(then = null) {
        const state = this.state;
        clearTimeout(this.timer);
        this.bar.renderRoot.querySelector('dialog.media')?.close();
        this.state = null;
        this.bar.requestUpdate();
        const saving = then?.();
        state?.done?.();

        // A new file or focus point for every place: the page shows it once shown again, like after undo.
        if (state?.replaced || state?.refresh) {
            Promise.resolve(saving).finally(() => this.bar.refresh());
        }
    }

    /** The chosen medium as a small preview with its file name. */
    preview(item) {
        if (!item) {
            return nothing;
        }

        const media = item.kind === 'document'
            ? html`<span class="file-tile" aria-hidden="true">${icon('file')}<b>${item.format}</b></span>`
            : item.kind === 'video'
            ? html`<video src=${item.preview} preload="metadata" muted playsinline aria-hidden="true"></video>`
            : html`<img src=${item.preview} alt="" width=${item.width} height=${item.height} decoding="async">`;

        return html`<figure class="media-chosen">${media}<figcaption>${item.fileName}</figcaption></figure>`;
    }

    /** What counts at this place: the texts of an image, the link text of a file, hints for a video. */
    place(state) {
        const labels = this.labels;
        const picked = this.picked(state);
        const item = this.item(picked, state);

        if (!picked) {
            const first = { video: labels.pickVideoFirst, document: labels.pickDocumentFirst }[this.listKind(state)] ?? labels.pickImageFirst;

            return html`<p class="hint">${first}</p>`;
        }

        if (state.kind === 'video') {
            return html`${this.preview(item)}
                ${state.tab === 'poster'
                    ? html`<p class="hint">${labels.posterHint}</p>
                        <div class="actions start"><button type="button" @click=${() => this.update({ poster: null })}>${labels.noPoster}</button></div>`
                    : html`<p class="hint">${labels.videoHint}</p>`}`;
        }

        if (state.kind === 'file') {
            return html`${this.preview(item)}
                <label>${labels.linkTextHere}
                    <input type="text" name="text" .value=${state.text} maxlength="200" placeholder=${item?.texts?.[this.bar.config.language]?.title ?? ''} aria-describedby="fb-media-text-hint"
                        @input=${(event) => this.update({ text: event.target.value })}></label>
                <p class="hint" id="fb-media-text-hint">${labels.linkTextHereHint}</p>`;
        }

        const own = item?.copyright ?? '';
        const copyrightHint = own !== '' ? labels.copyrightHereHint : this.toMedium(item) ? labels.copyrightToMedium : labels.copyrightOnlyHere;

        const point = state.point ?? item?.focus;

        return html`${this.focusable(item)
                ? html`<figure class="media-chosen">
                    <fb-focus class="fb-focus" .x=${point.x} .y=${point.y} label=${labels.focusPoint} position=${labels.focusPosition}
                        style=${styleMap({ '--ratio': `${item.width} / ${item.height}` })}
                        @fb-focus-change=${(event) => this.update({ point: { x: event.detail.x, y: event.detail.y } })}>
                        <img src=${item.preview} alt="" width=${item.width} height=${item.height} decoding="async">
                    </fb-focus>
                    <figcaption>${item.fileName}</figcaption></figure>
                    <p class="hint">${labels.focusPointHint}</p>`
                : this.preview(item)}
            <label>${labels.altHere}
                <input type="text" name="alt" .value=${state.alt} maxlength="500" placeholder=${item?.texts?.[this.bar.config.language]?.alt ?? ''} aria-describedby="fb-media-alt-hint"
                    @input=${(event) => this.update({ alt: event.target.value })}></label>
            <p class="hint" id="fb-media-alt-hint">${labels.altHereHint}</p>
            ${state.withCaption ? html`<label>${labels.captionHere}
                <input type="text" name="caption" .value=${state.caption} maxlength="300"
                    @input=${(event) => this.update({ caption: event.target.value })}></label>` : nothing}
            <label>${labels.copyrightHere}
                <input type="text" name="copyright" .value=${state.copyright} maxlength="300" placeholder=${own !== '' ? own : labels.copyrightExample} aria-describedby="fb-media-copyright-hint"
                    @input=${(event) => this.update({ copyright: event.target.value })}></label>
            <p class="hint" id="fb-media-copyright-hint">${copyrightHint}</p>
            <label>${labels.ai}
                <select name="ai" .value=${state.ai ?? item?.ai ?? 'none'} ?disabled=${!this.bar.config.mayUpdateMedia} aria-describedby="fb-media-ai-hint"
                    @change=${(event) => this.update({ ai: event.target.value })}>
                    ${['none', 'generated', 'edited'].map((value) => html`<option value=${value} ?selected=${(state.ai ?? item?.ai ?? 'none') === value}>${labels[{ none: 'aiNone', generated: 'aiGenerated', edited: 'aiEdited' }[value]]}</option>`)}
                </select></label>
            <p class="hint" id="fb-media-ai-hint">${labels.aiHint}</p>`;
    }

    dialog() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;
        const more = state.items.length < state.total;
        const video = state.kind === 'video';
        const file = state.kind === 'file';
        const picked = this.picked(state);
        let list;

        if (state.items.length === 0) {
            const empty = { video: labels.noVideos, document: labels.noDocuments }[this.listKind(state)] ?? labels.noMedia;
            list = html`<p class="hint">${state.loading ? labels.loading : state.query.trim() !== '' ? labels.noMediaFound : empty}</p>`;
        } else {
            list = html`<ul class="media-grid" aria-label=${labels.mediaLibrary}>
                ${state.items.map((item) => html`<li><button type="button" aria-pressed=${String(item.id === picked)}
                    @click=${() => this.pick(item.id)} @dblclick=${() => { this.pick(item.id); this.apply(); }}>
                    ${item.kind === 'document'
                        ? html`<span class="file-tile" aria-hidden="true">${icon('file')}<b>${item.format}</b></span>`
                        : item.kind === 'video'
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

        return html`<dialog class="media" aria-labelledby="fb-media-title" @cancel=${(event) => { event.preventDefault(); this.close(); }}>
            <form @submit=${(event) => { event.preventDefault(); this.apply(); }}>
                <h2 id="fb-media-title">${video ? labels.chooseVideo : file ? labels.chooseDocument : labels.chooseImage}</h2>
                ${tabs}
                <div class="media-columns">
                    <section class="media-library" aria-labelledby="fb-media-library">
                        <h3 id="fb-media-library">${labels.mediaLibrary}</h3>
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
                    </section>
                    <section class="media-place" aria-labelledby="fb-media-place">
                        <h3 id="fb-media-place">${labels.atThisPlace}</h3>
                        ${this.place(state)}
                    </section>
                </div>
                <div class="actions">
                    ${state.value ? html`<button type="button" class="danger" @click=${() => this.close(state.remove)}>${video ? labels.removeVideo : file ? labels.removeDocument : labels.removeImage}</button>` : nothing}
                    <button type="button" @click=${() => this.close()}>${labels.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!state.chosen || state.question !== null || state.applying}>${labels.apply}</button>
                </div>
            </form>
        </dialog>`;
    }
}

/** Shares to three places, as media.update takes them. */
function round(share) {
    return Math.round(Math.min(1, Math.max(0, share)) * 1000) / 1000;
}

function samePoint(a, b) {
    return Boolean(b) && round(a.x) === round(b.x) && round(a.y) === round(b.y);
}

export const mediaStyles = css`
    dialog.media { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    /* Choosing and setting apart (decision 0203): side by side, stacked once narrow. */
    .media-columns { display: flex; flex-wrap: wrap; gap: var(--fb-space-4); align-items: start; }

    .media-library { display: grid; flex: 999 1 0; gap: var(--fb-space-3); min-inline-size: 55%; }

    .media-place {
        display: grid;
        flex: 1 1 calc(var(--fb-size-narrow) - var(--fb-space-16));
        gap: var(--fb-space-3);
        padding: var(--fb-space-4);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
    }

    .media-columns h3 { margin: 0; font-size: var(--fb-text-md); font-weight: var(--fb-weight-bold); }

    .media-chosen { display: grid; gap: var(--fb-space-1); margin: 0; }

    .media-chosen :is(img, video, .file-tile) {
        inline-size: 100%;
        block-size: auto;
        max-block-size: calc(var(--fb-space-16) * 3);
        object-fit: contain;
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface);
    }

    /* The focus point on the chosen image (decision 0346): the box is the image itself. */
    .media-chosen .fb-focus {
        position: relative;
        display: block;
        inline-size: min(100%, calc(var(--fb-space-16) * 3 * var(--ratio, 1)));
        justify-self: center;
        cursor: crosshair;
    }

    /* Sized by its ratio before it loads, so the point sits right at once. */
    .media-chosen .fb-focus img {
        display: block;
        inline-size: 100%;
        block-size: auto;
        max-block-size: none;
        aspect-ratio: var(--ratio, auto);
        object-fit: fill;
    }

    .fb-focus__marker {
        position: absolute;
        inline-size: var(--fb-size-control-sm);
        block-size: var(--fb-size-control-sm);
        padding: 0;
        border: calc(var(--fb-size-focus) * 1.5) solid var(--fb-inverse-text);
        border-radius: var(--fb-radius-full);
        background: transparent;
        box-shadow: 0 0 0 var(--fb-size-focus) var(--fb-inverse-bg), inset 0 0 0 var(--fb-size-focus) var(--fb-inverse-bg);
        cursor: grab;
        translate: -50% -50%;
    }

    .fb-focus__marker:focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .media-chosen figcaption {
        overflow: hidden;
        font-size: var(--fb-text-xs);
        color: var(--fb-text-muted);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .media-place input { background: var(--fb-surface); }

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

    .file-tile {
        display: grid;
        place-content: center;
        justify-items: center;
        gap: var(--fb-space-1);
        aspect-ratio: 1;
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface-2);
        color: var(--fb-text-muted);
    }

    .file-tile svg { inline-size: var(--fb-space-8); block-size: var(--fb-space-8); }

    .file-tile b { font-size: var(--fb-text-xs); font-weight: var(--fb-weight-semibold); }

    .media-grid > li > button > span:last-child {
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
