import { css, html, nothing } from 'lit';
import { icon } from './icons.js';

/**
 * "Share a preview …" in the menu "More" (decision 0152): a dialog of the
 * bar with a note and how long the link works. After preview.create it
 * shows the link with "Copy link"; the screen "Access" of the backend
 * lists every link.
 *
 * config.preview: {durations: [{value, label, selected}], manage} or null
 * without the right to create links.
 */
export class SharePreview {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
    }

    get labels() {
        return this.bar.labels;
    }

    get config() {
        return this.bar.config.preview;
    }

    /** done() gives the focus back, e.g. to the menu button. */
    show(done = null) {
        const chosen = this.config.durations.find((duration) => duration.selected) ?? this.config.durations[0];
        this.state = { note: '', expiresAt: chosen?.value ?? null, busy: false, error: null, link: null, copied: false, done };
        this.bar.requestUpdate();
        this.bar.updateComplete.then(() => {
            this.bar.renderRoot.querySelector('dialog.share')?.showModal();
            this.bar.renderRoot.querySelector('dialog.share input')?.focus();
        });
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
    }

    async create() {
        if (this.state.busy) {
            return;
        }

        this.update({ busy: true, error: null });
        const note = this.state.note.trim();
        const response = await this.bar.action('preview.create', { note: note === '' ? null : note, expiresAt: this.state.expiresAt, pageId: this.bar.config.page?.id ?? null });
        const body = response ? await response.json().catch(() => null) : null;

        if (!response?.ok) {
            this.update({ busy: false, error: body?.errors?.[0]?.message ?? body?.detail ?? this.labels.failed });

            return;
        }

        const data = body?.data ?? {};
        const link = data.url ?? (data.path ? new URL(data.path, window.location.origin).href : null);
        this.update({ busy: false, link });
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('dialog.share [data-fb-copy-link]')?.focus();
    }

    async copy() {
        try {
            await navigator.clipboard.writeText(this.state.link);
            this.update({ copied: true });
        } catch {
            // Without the clipboard, e.g. over plain http, the field can be copied by hand.
            const field = this.bar.renderRoot.querySelector('dialog.share output input');
            field?.focus();
            field?.select();
        }
    }

    close() {
        const done = this.state?.done;
        this.bar.renderRoot.querySelector('dialog.share')?.close();
        this.state = null;
        this.bar.requestUpdate();
        done?.();
    }

    dialog() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;

        return html`<dialog class="share" aria-labelledby="fb-share-title" @cancel=${(event) => { event.preventDefault(); this.close(); }}>
            ${state.link ? this.result(state) : html`<form @submit=${(event) => { event.preventDefault(); this.create(); }}>
                <h2 id="fb-share-title">${labels.shareTitle}</h2>
                ${state.error ? html`<p class="error" role="alert">${state.error}</p>` : nothing}
                <label>${labels.shareNote}
                    <input type="text" maxlength="200" .value=${state.note} placeholder=${labels.shareNotePlaceholder} aria-describedby="fb-share-note-hint"
                        @input=${(event) => this.update({ note: event.target.value })}></label>
                <p class="hint" id="fb-share-note-hint">${labels.shareNoteHint}</p>
                <label>${labels.shareDays}
                    <select @change=${(event) => this.update({ expiresAt: event.target.value })}>
                        ${this.config.durations.map((duration) => html`<option value=${duration.value} ?selected=${duration.value === state.expiresAt}>${duration.label}</option>`)}
                    </select></label>
                <p class="hint">${labels.shareHint}</p>
                <div class="actions">
                    <button type="button" @click=${() => this.close()}>${labels.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${state.busy} aria-busy=${state.busy ? 'true' : 'false'}>${labels.shareCreate}</button>
                </div>
            </form>`}
        </dialog>`;
    }

    result(state) {
        const labels = this.labels;

        return html`<div class="share-result">
            <h2 id="fb-share-title">${labels.shareReady}</h2>
            <output><input type="text" readonly .value=${state.link} aria-label=${labels.shareLink} @focus=${(event) => event.target.select()}></output>
            <p class="hint" role="status">${state.copied ? labels.shareCopied : ''}</p>
            <div class="actions">
                ${this.config.manage ? html`<a class="open" href=${this.config.manage}>${labels.shareManage}</a>` : nothing}
                <button type="button" @click=${() => this.close()}>${labels.shareDone}</button>
                <button type="button" class="primary" data-fb-copy-link @click=${() => this.copy()}>${icon('copy')}${labels.shareCopy}</button>
            </div>
        </div>`;
    }
}

export const shareStyles = css`
    dialog.share select {
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-weight: var(--fb-weight-regular);
    }

    dialog.share select:focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .share-result { display: grid; gap: var(--fb-space-3); }

    .share-result output { display: grid; }

    .share-result output input {
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
        color: inherit;
        font: inherit;
        font-family: var(--fb-font-mono);
        font-size: var(--fb-text-sm);
    }

    .share-result .open {
        align-self: center;
        color: var(--fb-accent-text);
    }

    dialog.share .error { margin: 0; color: var(--fb-danger-text); }
`;
