import { css, html, nothing } from 'lit';
import { icon } from './icons.js';

/** Every heading of the page, outside the bar. */
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

/**
 * The panel „Gliederung“ (decision 0129): the headings of the page in
 * order with the level each gets from where it stands, from the query
 * page.outline. A click goes to the heading; notes say what the core
 * adjusted, what a template fixed and when the page has no h1 of its own.
 */
export class OutlinePanel {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
    }

    get labels() {
        return this.bar.labels;
    }

    async show() {
        this.bar.design?.hide();
        this.bar.comments?.hide();
        this.bar.arranging?.panel && this.bar.arranging.closePanel();
        this.state = { loading: true, headings: [], error: false };
        this.bar.requestUpdate();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('#fb-outline-title')?.focus();
        await this.load();
    }

    /** Reads the outline of the draft in the language of the page. */
    async load() {
        const page = this.bar.config?.page;

        if (!page) {
            return;
        }

        const query = new URLSearchParams({ id: page.id, language: this.bar.config.language });

        try {
            const response = await fetch(`${this.bar.config.queries}page.outline?${query}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            const headings = response.ok ? (await response.json()).data ?? [] : null;
            this.state = this.state && { loading: false, headings: headings ?? [], error: headings === null };
        } catch {
            this.state = this.state && { loading: false, headings: [], error: true };
        }

        this.bar.requestUpdate();
    }

    hide() {
        this.state = null;
        this.bar.requestUpdate();
    }

    async close() {
        this.hide();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('[data-fb-more]')?.focus();
    }

    /** The element of a heading on the page, as close as the outline tells. */
    elementOf(heading) {
        const all = [...document.querySelectorAll(HEADINGS)];
        const same = (element) => element.textContent.replace(/\s+/g, ' ').trim() === heading.text;

        if (heading.field) {
            const scope = heading.blockId ? document.querySelector(`[data-fb-block="${CSS.escape(heading.blockId)}"]`) : document;
            const fields = [...(scope?.querySelectorAll(`[data-fb-field="${CSS.escape(heading.field)}"]`) ?? [])]
                // A field of the layout is outside every block.
                .filter((field) => heading.blockId || !field.parentElement?.closest('[data-fb-block]'));

            for (const field of fields) {
                if (field.matches(HEADINGS)) {
                    return field;
                }

                // In rich text the heading with the same text.
                const inner = [...field.querySelectorAll(HEADINGS)].find(same);

                if (inner) {
                    return inner;
                }
            }
        }

        return all.find((element) => element.localName === `h${heading.level}` && same(element)) ?? null;
    }

    jump(heading) {
        const element = this.elementOf(heading);

        if (!element) {
            return;
        }

        element.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        // A field takes the focus and shows its outline; rich text its field.
        const field = element.closest('[data-fb-field][tabindex]');
        field?.focus({ preventScroll: true });
    }

    notes(heading) {
        const labels = this.labels;
        const text = {
            adjusted: labels.outlineAdjusted,
            fixed: labels.outlineFixed,
            skips: labels.outlineSkips,
            secondMain: labels.outlineSecondMain,
            added: labels.outlineAdded,
        };

        return (heading.notes ?? []).map((note) => text[note]).filter(Boolean);
    }

    view() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;
        const added = state.headings.some((heading) => (heading.notes ?? []).includes('added'));

        return html`<section class="panel outline-panel" role="region" aria-labelledby="fb-outline-title"
            @keydown=${(event) => { if (event.key === 'Escape') { event.preventDefault(); this.close(); } }}>
            <header>
                <h2 id="fb-outline-title" tabindex="-1">${labels.outline}</h2>
                <button type="button" aria-label=${labels.close} title=${labels.close} @click=${() => this.close()}>${icon('close')}</button>
            </header>
            <div class="outline-body" aria-busy=${state.loading ? 'true' : 'false'}>
                <p class="hint">${labels.outlineHint}</p>
                ${state.error ? html`<p class="outline-error" role="alert">${labels.outlineFailed}</p>` : nothing}
                ${added ? html`<p class="outline-note" role="status">${labels.outlineAdded}</p>` : nothing}
                ${state.loading ? html`<p class="hint">${labels.loading}</p>` : nothing}
                ${!state.loading && !state.error && state.headings.length === 0 ? html`<p class="hint">${labels.outlineEmpty}</p>` : nothing}
                ${state.headings.length > 0 ? html`<ol class="outline-list">
                    ${state.headings.map((heading) => {
                        const notes = this.notes(heading).filter((note) => note !== labels.outlineAdded);

                        return html`<li style="--depth: ${heading.level - 1}">
                            <button type="button" class=${notes.length > 0 ? 'noted' : ''} @click=${() => this.jump(heading)}>
                                <span class="outline-level" aria-label=${labels.outlineLevel.replace('{level}', heading.level)}>H${heading.level}</span>
                                <span class="outline-text">${heading.text}</span>
                            </button>
                            ${notes.map((note) => html`<p class="hint">${note}</p>`)}
                        </li>`;
                    })}
                </ol>` : nothing}
            </div>
        </section>`;
    }

    /** With „Alle Stellen zeigen“ each heading shows its level, e.g. "H2". */
    badges() {
        return [...document.querySelectorAll(HEADINGS)].map((element) => {
            const rect = element.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) {
                return nothing;
            }

            return html`<span class="level-badge" aria-hidden="true"
                style="inset-block-start: ${rect.top}px; inset-inline-start: ${rect.right}px">H${element.localName.slice(1)}</span>`;
        });
    }
}

export const outlineStyles = css`
    .panel.outline-panel .outline-body {
        display: grid;
        align-content: start;
        gap: var(--fb-space-3);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .outline-list { display: grid; gap: var(--fb-space-1); margin: 0; padding: 0; list-style: none; }

    .outline-list li { padding-inline-start: calc(var(--depth) * var(--fb-space-4)); }

    .outline-list button {
        display: flex;
        gap: var(--fb-space-2);
        align-items: baseline;
        inline-size: 100%;
        min-block-size: var(--fb-size-control-sm);
        padding: var(--fb-space-1) var(--fb-space-2);
        border: 0;
        border-radius: var(--fb-radius-sm);
        background: none;
        color: inherit;
        font: inherit;
        text-align: start;
        cursor: pointer;
    }

    .outline-list button:hover { background: var(--fb-surface-2); }

    .outline-list button:focus-visible { outline: var(--fb-size-focus) solid var(--fb-focus); outline-offset: calc(-1 * var(--fb-size-focus)); }

    .outline-list .hint { padding-inline-start: calc(var(--fb-space-2) + var(--fb-space-8)); }

    .outline-level {
        flex: none;
        min-inline-size: var(--fb-space-8);
        color: var(--fb-text-muted);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-semibold);
        font-variant-numeric: tabular-nums;
    }

    .outline-list button.noted .outline-level { color: var(--fb-warning-text); }

    .outline-text { overflow-wrap: anywhere; }

    .outline-note, .outline-error {
        margin: 0;
        padding: var(--fb-space-2) var(--fb-space-3);
        border-radius: var(--fb-radius-md);
        background: var(--fb-warning-bg);
        color: var(--fb-warning-text);
    }

    .outline-error { background: var(--fb-danger-bg); color: var(--fb-danger-text); }

    .level-badge {
        position: absolute;
        translate: -100% 0;
        padding: var(--fb-space-0) var(--fb-space-1);
        border-radius: 0 0 0 var(--fb-radius-sm);
        background: var(--fb-text);
        color: var(--fb-surface);
        font-size: var(--fb-text-2xs);
        font-weight: var(--fb-weight-semibold);
        pointer-events: none;
    }
`;
