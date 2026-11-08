import { css, html, nothing } from 'lit';
import { WHOLE_DESIGN_PAGE, elementOf, isContent, pinAt, placeLine, placeOf } from '../comments/place.js';
import { fromStart } from './edges.js';
import { icon } from './icons.js';

/**
 * The comments of the bar (decision 0156): the threads of the page as a
 * list in a side panel and as pins at their places, with replying,
 * marking done, opening again and deleting. Editors comment on a place
 * like guests of a preview: pick it, write, send. On the design page the
 * threads of its elements instead (decision 0210).
 */
export class CommentsPanel {
    constructor(bar) {
        this.bar = bar;
        this.threads = [];
        this.state = null;
        this.picking = false;
        this.onPick = (event) => this.pick(event);
        this.onKey = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                this.stopPicking();
            }
        };
    }

    get labels() {
        return this.bar.labels;
    }

    get config() {
        return this.bar.config?.comments ?? null;
    }

    get pageId() {
        return this.bar.config?.page?.id ?? null;
    }

    /** The design page has threads of its own, without a page. */
    get designPage() {
        return Boolean(this.bar.config?.designPage);
    }

    /** Whether there are threads to show here at all. */
    get available() {
        return Boolean(this.config && (this.pageId || this.designPage));
    }

    get open() {
        return this.threads.filter((thread) => thread.status === 'open').length;
    }

    /** Loads the threads of the page, for the counter and the pins. */
    async load() {
        if (!this.available) {
            return;
        }

        const filter = this.designPage ? 'design=true' : `pageId=${encodeURIComponent(this.pageId)}`;

        try {
            const response = await fetch(`${this.bar.config.queries}comment.list?${filter}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            this.threads = response.ok ? (await response.json()).data ?? [] : [];
        } catch {
            this.threads = [];
        }

        this.bar.requestUpdate();
    }

    async show(current = null) {
        this.bar.design?.hide();
        this.bar.pagePanel?.hide();
        this.bar.navigationPanel?.hide();
        this.bar.outline?.hide();
        this.bar.arranging?.panel && this.bar.arranging.closePanel();
        this.state = { current, composing: null, confirming: null, error: null, busy: false };
        this.bar.requestUpdate();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('#fb-comments-title')?.focus();
        this.bar.renderRoot.querySelector(`[data-thread="${current}"]`)?.scrollIntoView({ block: 'nearest' });
    }

    hide() {
        this.state = null;
        this.stopPicking();
        this.bar.requestUpdate();
    }

    async close() {
        this.hide();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('[data-fb-comments]')?.focus();
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
    }

    // Picking a place, as in the preview.

    startPicking() {
        this.picking = true;
        this.bar.requestUpdate();
        document.addEventListener('click', this.onPick, true);
        document.addEventListener('keydown', this.onKey, true);
    }

    stopPicking() {
        if (!this.picking) {
            return;
        }

        this.picking = false;
        document.removeEventListener('click', this.onPick, true);
        document.removeEventListener('keydown', this.onKey, true);
        this.bar.requestUpdate();
    }

    pick(event) {
        if (!isContent(event.target)) {
            return;
        }

        // The click picks the place instead of editing it.
        event.preventDefault();
        event.stopPropagation();
        this.stopPicking();
        const place = placeOf(event.target, { event, labels: this.labels });
        this.update({ composing: place, error: null });
        this.bar.updateComplete.then(() => this.bar.renderRoot.querySelector('.panel.comments textarea')?.focus());
    }

    // Actions.

    async run(name, input, after = null) {
        this.update({ busy: true, error: null });
        const response = await this.bar.action(name, input);

        if (!response?.ok) {
            const problem = response ? await response.json().catch(() => null) : null;
            const errors = Array.isArray(problem?.errors) ? problem.errors.map((error) => error.message) : [];
            this.update({ busy: false, error: errors.length > 0 ? errors.join(' ') : (problem?.detail ?? this.labels.commentFailed) });

            return false;
        }

        await this.load();
        this.update({ busy: false, ...(after ?? {}) });

        return true;
    }

    async create(event, place) {
        event.preventDefault();
        const body = new FormData(event.currentTarget).get('body');
        const design = this.designPage ? place?.design ?? WHOLE_DESIGN_PAGE : null;
        const created = await this.run('comment.create', {
            pageId: design ? null : this.pageId,
            design,
            body,
            blockId: place?.blockId ?? null,
            field: place?.field ?? null,
            site: place?.site ?? false,
            landmark: place?.landmark ?? null,
            pointX: place?.pointX ?? null,
            pointY: place?.pointY ?? null,
            language: this.bar.config.language,
            path: design ? location.pathname + location.search : location.pathname,
            excerpt: place?.excerpt ?? null,
            viewport: window.innerWidth,
        }, { composing: null });

        if (created) {
            this.update({ current: this.threads[0]?.id ?? null });
        }
    }

    async reply(event, thread) {
        event.preventDefault();
        const form = event.currentTarget;

        if (await this.run('comment.reply', { commentId: thread.id, body: new FormData(form).get('body') }, { current: thread.id })) {
            form.reset();
        }
    }

    /** Scrolls to the place of a thread. */
    reveal(thread) {
        const element = elementOf(thread);

        if (!element) {
            return;
        }

        element.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        this.update({ current: thread.id });
    }

    // Views.

    /** The button in the bar, with the open threads of the page. */
    button() {
        if (!this.available) {
            return nothing;
        }

        const labels = this.labels;
        const open = this.open;
        const label = open ? `${labels.comments}, ${labels.openCount.replace('{count}', open)}` : labels.comments;

        return html`<button type="button" data-fb-comments aria-label=${label} title=${label} aria-expanded=${this.state ? 'true' : 'false'}
            @click=${() => (this.state ? this.close() : this.show())}>${icon('comment')}${open ? html`<span class="comment-count" aria-hidden="true">${open}</span>` : nothing}</button>`;
    }

    /** Numbered pins at the places of the threads on the page. */
    pins() {
        const draft = this.state?.composing;

        if (!this.config || (this.threads.length === 0 && !draft?.element)) {
            return nothing;
        }

        const labels = this.labels;
        const pins = this.threads.map((thread, index) => {
            const element = elementOf(thread);
            const style = element ? this.pinStyle(thread, element) : null;

            if (!style) {
                return nothing;
            }

            const number = this.threads.length - index;

            return html`<button type="button" class="comment-pin ${thread.status === 'done' ? 'done' : ''} ${this.state?.current === thread.id ? 'current' : ''}"
                style=${style}
                aria-label=${labels.commentPin.replace('{number}', number).replace('{text}', thread.comment.body.slice(0, 60))}
                @click=${() => this.show(thread.id)}>${number}</button>`;
        });

        // The place of the comment being written.
        const style = draft?.element?.isConnected ? this.pinStyle(draft, draft.element) : null;

        return style ? [...pins, html`<span class="comment-pin draft" aria-hidden="true" style=${style}>+</span>`] : pins;
    }

    /**
     * Where a pin goes: with its lower start corner at the point, or
     * centred on the corner of the place; null when out of sight.
     */
    pinStyle(place, element) {
        const { x, y, rect, point } = pinAt(place, element);

        if (rect.bottom < 0 || rect.top > innerHeight || (rect.width === 0 && rect.height === 0)) {
            return null;
        }

        const start = fromStart(this.bar, x);
        const [block, inline] = point ? [`${y}px - var(--fb-size-icon)`, `${start}px`] : [`${y}px - var(--fb-size-icon) / 2`, `${start}px - var(--fb-size-icon) / 2`];

        return `inset-block-start: max(0px, calc(${block})); inset-inline-start: max(0px, calc(${inline}))`;
    }

    /** The hint while picking a place. */
    pickHint() {
        if (!this.picking) {
            return nothing;
        }

        const labels = this.labels;

        return html`<div class="comment-hint" role="status">
            <span>${labels.pickHint}</span>
            <button type="button" @click=${() => { this.stopPicking(); this.update({ composing: { blockId: null, field: null, site: false, landmark: null, label: null, excerpt: null, element: null, pointX: null, pointY: null } }); }}>${labels.wholePage}</button>
            <button type="button" @click=${() => this.stopPicking()}>${labels.cancel}</button>
        </div>`;
    }

    view() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;

        return html`<section class="panel comments" role="region" aria-labelledby="fb-comments-title"
            @keydown=${(event) => { if (event.key === 'Escape' && !this.picking) { event.preventDefault(); this.close(); } }}>
            <header>
                <h2 id="fb-comments-title" tabindex="-1">${labels.comments}</h2>
                <button type="button" aria-label=${labels.close} title=${labels.close} @click=${() => this.close()}>${icon('close')}</button>
            </header>
            <div class="comments-body">
                ${state.error ? html`<p class="comment-error" role="alert">${state.error}</p>` : nothing}
                ${state.composing ? this.composer(state.composing) : html`<button type="button" class="primary" ?disabled=${this.picking}
                    @click=${() => this.startPicking()}>${icon('plus')}${labels.comment}</button>`}
                ${this.threads.length === 0 ? html`<p class="hint">${labels.noComments}</p>` : this.threads.map((thread) => this.thread(thread))}
            </div>
        </section>`;
    }

    composer(place) {
        const labels = this.labels;
        const busy = this.state.busy;

        return html`<form class="comment-form" @submit=${(event) => this.create(event, place)}>
            <p class="hint">${place.label ? labels.about.replace('{place}', place.label) : labels.aboutPage}</p>
            ${place.excerpt ? html`<blockquote>${place.excerpt.length > 120 ? `${place.excerpt.slice(0, 120)} …` : place.excerpt}</blockquote>` : nothing}
            <label>${labels.yourComment}<textarea name="body" required maxlength="2000"></textarea></label>
            <div class="comment-actions">
                <button type="submit" class="primary" ?disabled=${busy}>${labels.send}</button>
                <button type="button" ?disabled=${busy} @click=${() => this.update({ composing: null })}>${labels.cancel}</button>
            </div>
        </form>`;
    }

    thread(thread) {
        const labels = this.labels;
        const done = thread.status === 'done';
        const element = elementOf(thread);
        const busy = this.state.busy;
        const confirming = this.state.confirming === thread.id;

        return html`<article class="comment-thread ${this.state.current === thread.id ? 'current' : ''}" data-thread=${thread.id}>
            <div class="comment-meta">
                <span class="comment-badge ${done ? 'done' : ''}">${done ? labels.doneThread : labels.openThread}</span>
                <span class="hint">${placeLine(thread, labels) ?? labels.aboutPage}</span>
                ${element ? html`<button type="button" class="small" @click=${() => this.reveal(thread)}>${labels.showPlace}</button>` : nothing}
            </div>
            ${this.message(thread.comment)}
            ${thread.replies.map((reply) => html`<div class="comment-reply">${this.message(reply)}</div>`)}
            ${done && thread.resolvedBy ? html`<p class="hint">${labels.doneBy.replace('{name}', thread.resolvedBy)}</p>` : nothing}
            <form class="comment-form" @submit=${(event) => this.reply(event, thread)}>
                <label>${labels.reply}<textarea name="body" required maxlength="2000"></textarea></label>
                <div class="comment-actions">
                    <button type="submit" ?disabled=${busy}>${labels.sendReply}</button>
                    ${this.config.resolve ? html`<button type="button" ?disabled=${busy}
                        @click=${() => this.run(done ? 'comment.reopen' : 'comment.resolve', { id: thread.id }, { current: thread.id })}>${done ? labels.reopen : labels.resolve}</button>` : nothing}
                    ${this.config.delete && !confirming ? html`<button type="button" class="danger" ?disabled=${busy}
                        @click=${() => this.update({ confirming: thread.id })}>${labels.deleteThread}</button>` : nothing}
                </div>
                ${confirming ? html`<div class="comment-actions" role="group" aria-label=${labels.deleteThread}>
                    <span class="hint">${labels.deleteThreadConfirm}</span>
                    <button type="button" class="danger" ?disabled=${busy} @click=${() => this.run('comment.delete', { id: thread.id }, { confirming: null })}>${labels.deleteThread}</button>
                    <button type="button" ?disabled=${busy} @click=${() => this.update({ confirming: null })}>${labels.cancel}</button>
                </div>` : nothing}
            </form>
        </article>`;
    }

    message(entry) {
        const date = entry.createdAt ? new Intl.DateTimeFormat(document.documentElement.lang || undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.createdAt)) : '';

        return html`<div class="comment-message">
            <div class="comment-meta"><strong>${entry.authorName}</strong>${entry.guest ? html`<span class="comment-badge guest">${this.labels.guest}</span>` : nothing}<span class="hint">${date}</span></div>
            <p>${entry.body}</p>
        </div>`;
    }
}

export const commentStyles = css`
    .panel.comments .comments-body {
        display: grid;
        align-content: start;
        gap: var(--fb-space-4);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .panel.comments .comments-body > .primary { justify-self: start; }

    .panel .comment-form { display: grid; gap: var(--fb-space-2); padding: 0; overflow: visible; }

    .panel .comment-actions { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); align-items: center; }

    .panel blockquote {
        margin: 0;
        padding-inline-start: var(--fb-space-2);
        border-inline-start: var(--fb-size-indicator) solid var(--fb-border-strong);
        color: var(--fb-text-muted);
    }

    .comment-thread {
        display: grid;
        gap: var(--fb-space-2);
        padding: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
    }

    .comment-thread.current { border-color: var(--fb-accent); }

    .comment-meta { display: flex; flex-wrap: wrap; gap: var(--fb-space-1) var(--fb-space-2); align-items: center; }

    .comment-message p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }

    .comment-reply { padding-inline-start: var(--fb-space-3); border-inline-start: var(--fb-size-border) solid var(--fb-border); }

    .comment-badge {
        padding: 0 var(--fb-space-2);
        border-radius: var(--fb-radius-full);
        background: var(--fb-info-bg);
        color: var(--fb-info-text);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-medium);
    }

    .comment-badge.done { background: var(--fb-success-bg); color: var(--fb-success-text); }

    .comment-badge.guest { background: var(--fb-surface-2); color: var(--fb-text-muted); }

    .comment-error { margin: 0; color: var(--fb-danger-text); }

    /* The number of open comments on the button of the editor bar. */
    .comment-count {
        min-inline-size: var(--fb-size-icon-sm);
        padding-inline: var(--fb-space-1);
        border-radius: var(--fb-radius-full);
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        line-height: var(--fb-size-icon-sm);
        text-align: center;
    }

    .comment-pin {
        position: absolute;
        min-inline-size: var(--fb-size-icon);
        min-block-size: var(--fb-size-icon);
        padding: 0 var(--fb-space-1);
        pointer-events: auto;
        border: var(--fb-size-border) solid var(--fb-on-accent);
        border-radius: var(--fb-radius-full);
        border-end-start-radius: 0;
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        box-shadow: var(--fb-shadow-sm);
    }

    .comment-pin.done { background: var(--fb-surface-2); color: var(--fb-text-muted); }

    .comment-pin.current { outline: var(--fb-size-focus) solid var(--fb-focus); }

    .comment-pin.draft { display: grid; place-items: center; pointer-events: none; border-color: var(--fb-accent); background: var(--fb-surface); color: var(--fb-accent); }

    .comment-hint {
        position: absolute;
        inset-block-start: var(--fb-space-4);
        inset-inline-start: var(--fb-space-4);
        display: flex;
        flex-wrap: wrap;
        gap: var(--fb-space-2) var(--fb-space-3);
        align-items: center;
        max-inline-size: min(var(--fb-size-form), calc(100vw - 2 * var(--fb-space-4)));
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        pointer-events: auto;
        border-radius: var(--fb-radius-lg);
        background: var(--fb-inverse-bg);
        color: var(--fb-inverse-text);
        box-shadow: var(--fb-shadow-lg);
    }
`;
