import { css, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

/**
 * Choosing a symbol of the theme for an icon field (decision 0179): a
 * dialog of the bar with a grid of the symbols and a search by label.
 * The symbols come from icon.list once and stay for the page. Fields and
 * the settings panel open it with open().
 */
export class IconPicker {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
        this.icons = null;
        this.pending = null;
    }

    get labels() {
        return this.bar.labels;
    }

    /**
     * value: the stored name or null; apply(name) and remove() save,
     * done() gives the focus back.
     */
    open({ value, apply, remove, done }) {
        this.state = { value, chosen: value ?? null, query: '', apply, remove, done };
        this.bar.requestUpdate();
        this.list();
        this.bar.updateComplete.then(() => {
            this.bar.renderRoot.querySelector('dialog.icons')?.showModal();
            const pressed = this.bar.renderRoot.querySelector('dialog.icons .icon-grid [aria-pressed="true"]');
            (pressed ?? this.bar.renderRoot.querySelector('dialog.icons input[type="search"]'))?.focus();
        });
    }

    /** The symbols of the theme: [{name, label, svg}], loaded once, none if loading fails. */
    list() {
        this.pending ??= fetch(this.bar.config.queries + 'icon.list', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((response) => (response.ok ? response.json() : null))
            .catch(() => null)
            .then((body) => {
                this.icons = Array.isArray(body?.data) ? body.data : [];
                this.bar.requestUpdate();

                return this.icons;
            });

        return this.pending;
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
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
        const query = state.query.trim().toLocaleLowerCase();
        const icons = (this.icons ?? []).filter((item) => query === '' || item.label.toLocaleLowerCase().includes(query) || item.name.includes(query));
        let list;

        if (this.icons === null) {
            list = html`<p class="hint">${labels.loading}</p>`;
        } else if (icons.length === 0) {
            list = html`<p class="hint">${this.icons.length === 0 ? labels.noIcons : labels.noIconFound}</p>`;
        } else {
            list = html`<ul class="icon-grid" aria-label=${labels.icons}>
                ${icons.map((item) => html`<li><button type="button" aria-pressed=${String(item.name === state.chosen)}
                    @click=${() => this.update({ chosen: item.name })} @dblclick=${() => { this.update({ chosen: item.name }); this.apply(); }}>
                    ${unsafeSVG(item.svg)}<span>${item.label}</span></button></li>`)}
            </ul>`;
        }

        return html`<dialog class="icons" aria-labelledby="fb-icons-title" @cancel=${(event) => { event.preventDefault(); this.close(); }}>
            <form @submit=${(event) => { event.preventDefault(); this.apply(); }}>
                <h2 id="fb-icons-title">${labels.chooseIcon}</h2>
                <label>${labels.search}
                    <input type="search" .value=${state.query} autocomplete="off" @input=${(event) => this.update({ query: event.target.value })}></label>
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
`;
