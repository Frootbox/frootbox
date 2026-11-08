import { css, html, nothing } from 'lit';
import { icon } from './icons.js';

const SAVE_DELAY = 400;
const ENOUGH = 4.5;
const GROUPS = [['color', 'designColors'], ['font', 'designFonts'], ['length', 'designSizes'], ['choice', 'designMore']];

/** "#abc" and "#aabbcc" as [r, g, b], null for anything else. */
function rgb(value) {
    const hex = String(value).trim().toLowerCase();

    if (/^#[0-9a-f]{3}$/.test(hex)) {
        return [1, 2, 3].map((index) => parseInt(hex[index] + hex[index], 16));
    }

    return /^#[0-9a-f]{6}$/.test(hex) ? [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) : null;
}

function luminance([red, green, blue]) {
    const [r, g, b] = [red, green, blue].map((channel) => {
        const value = channel / 255;

        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast after WCAG 2 like Design\Contrast in the core, null if a colour is unknown. */
export function contrast(first, second) {
    const a = rgb(first);
    const b = rgb(second);

    if (!a || !b) {
        return null;
    }

    const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);

    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/**
 * The panel "Design" of the bar (decision 0127): the tokens of the theme
 * by type, each change shows on the page right away and goes into the
 * draft of the design a moment later. Publishing and discarding happen
 * here too; earlier versions are on the backend screen.
 */
export class DesignPanel {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
        this.pending = {};
        this.timer = null;
        // The save on its way, so publishing and discarding wait for it.
        this.saving = Promise.resolve();
    }

    get labels() {
        return this.bar.labels;
    }

    get open() {
        return this.state !== null;
    }

    async show() {
        this.bar.arranging?.closePanel?.();
        this.bar.comments?.hide();
        this.bar.outline?.hide();
        this.bar.pagePanel?.hide();
        this.state = { loading: true, design: null, busy: false, confirming: false };
        this.bar.requestUpdate();
        let body = null;

        try {
            const response = await fetch(this.bar.config.queries + 'design.show', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            body = response.ok ? await response.json() : null;
        } catch {
            body = null;
        }

        if (this.state) {
            this.update({ loading: false, design: body?.data ?? null });
            await this.bar.updateComplete;
            this.bar.renderRoot.querySelector('#fb-design-title')?.focus();
        }
    }

    async close() {
        this.hide();
        await this.bar.updateComplete;
        // Back to the menu "More", where "Design" was chosen (decision 0139).
        this.bar.renderRoot.querySelector('[data-fb-more]')?.focus();
    }

    /** Closes without moving the focus, e.g. when the settings of a block open. */
    hide() {
        if (this.state) {
            this.flush();
            this.state = null;
            this.bar.requestUpdate();
        }
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
    }

    token(name) {
        return this.state?.design?.tokens.find((token) => token.name === name) ?? null;
    }

    /** The CSS of a value, e.g. the family of a font key. */
    cssOf(token, value) {
        return token.options.find((option) => option.value === value)?.css ?? value;
    }

    /** Shows the value on the page and saves it a moment later; null goes back to the theme. */
    change(token, value) {
        const shown = value ?? token.default;
        document.documentElement.style.setProperty(`--${token.name}`, this.cssOf(token, shown));
        this.replace(token.name, { value: shown, css: this.cssOf(token, shown) });
        this.pending = { ...this.pending, [token.name]: value };
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), SAVE_DELAY);
    }

    replace(name, changes) {
        const design = this.state.design;
        this.update({ design: { ...design, draft: true, tokens: design.tokens.map((token) => token.name === name ? { ...token, ...changes } : token) } });
    }

    /** Saves what waits, one save after the other; resolves when the last one is done. */
    async flush() {
        clearTimeout(this.timer);
        const tokens = this.pending;
        this.pending = {};

        if (Object.keys(tokens).length > 0) {
            // A failed save does not hold up the next one.
            this.saving = this.saving.then(() => this.save(tokens), () => this.save(tokens));
        }

        await this.saving;
    }

    async save(tokens) {
        const result = await this.bar.run('design.update', { tokens });

        // A newer change waits to be saved, its values win.
        if (result.ok && this.state && Object.keys(this.pending).length === 0) {
            this.apply(result.data);
        }
    }

    /** Takes over what the server answered and shows its values on the page. */
    apply(design) {
        for (const token of design.tokens) {
            document.documentElement.style.setProperty(`--${token.name}`, token.css);
        }

        this.update({ design, busy: false, confirming: false });
    }

    async publish() {
        await this.flush();
        this.update({ busy: true });
        const result = await this.bar.run('design.publish', {});

        if (result.ok) {
            this.apply(result.data);
            this.bar.message = { tone: 'success', text: this.labels.designIsPublished };
        } else {
            this.update({ busy: false });
        }
    }

    async discard() {
        clearTimeout(this.timer);
        this.pending = {};
        this.update({ busy: true });
        await this.saving;
        const result = await this.bar.run('design.discard', {});

        if (result.ok) {
            this.apply(result.data);
            this.bar.message = { tone: 'info', text: this.labels.designIsDiscarded };
        } else {
            this.update({ busy: false, confirming: false });
        }
    }

    /** The button in the bar. */
    view() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;
        const design = state.design;
        let body;

        if (state.loading) {
            body = html`<p class="hint">${labels.loading}</p>`;
        } else if (!design) {
            body = html`<p class="hint">${labels.failed}</p>`;
        } else if (design.tokens.length === 0) {
            body = html`<p class="hint">${labels.designNone}</p>`;
        } else {
            body = html`${GROUPS.map(([type, label]) => this.group(design.tokens.filter((token) => token.type === type), labels[label]))}`;
        }

        return html`<section class="panel design" role="region" aria-labelledby="fb-design-title"
            @keydown=${(event) => { if (event.key === 'Escape') { event.preventDefault(); this.close(); } }}>
            <header>
                <h2 id="fb-design-title" tabindex="-1">${labels.designTitle}</h2>
                <button type="button" aria-label=${labels.close} title=${labels.close} @click=${() => this.close()}>${icon('close')}</button>
            </header>
            <form @submit=${(event) => event.preventDefault()}>
                ${design ? html`<p class="hint" role="status">${design.draft ? labels.designDraft : labels.designLive}</p>` : nothing}
                <fieldset ?disabled=${state.busy}>${body}</fieldset>
            </form>
            ${design ? this.footer(design) : nothing}
        </section>`;
    }

    footer(design) {
        const labels = this.labels;

        if (this.state.confirming) {
            return html`<footer>
                <p class="hint">${labels.designDiscardConfirm}</p>
                <div class="actions">
                    <button type="button" @click=${() => this.update({ confirming: false })}>${labels.cancel}</button>
                    <button type="button" class="danger solid" ?disabled=${this.state.busy} @click=${() => this.discard()}>${labels.discardYes}</button>
                </div>
            </footer>`;
        }

        return html`<footer class="actions">
            ${design.draft && this.bar.config.design.discard ? html`<button type="button" class="danger" ?disabled=${this.state.busy}
                @click=${() => this.update({ confirming: true })}>${labels.designDiscard}</button>` : nothing}
            ${this.bar.config.design.publish ? html`<button type="button" class="primary" ?disabled=${this.state.busy || !design.draft}
                @click=${() => this.publish()}>${labels.designPublish}</button>` : nothing}
        </footer>`;
    }

    group(tokens, legend) {
        if (tokens.length === 0) {
            return nothing;
        }

        return html`<fieldset><legend>${legend}</legend>${tokens.map((token) => this.field(token))}</fieldset>`;
    }

    field(token) {
        const id = `fb-design-${token.name}`;
        const reset = token.value !== token.default
            ? html`<button type="button" class="reset" aria-label=${this.labels.designResetOf.replace('{token}', token.label)} title=${this.labels.designReset}
                @click=${() => this.change(token, null)}>${icon('restore')}</button>`
            : nothing;

        switch (token.type) {
            case 'color':
                return html`<div class="token">
                    <label for=${id}>${token.label}</label>
                    <div class="row">
                        <input type="color" id=${id} .value=${rgb(token.value) ? token.value : '#000000'} @input=${(event) => this.change(token, event.target.value)}>
                        <input type="text" class="hex" .value=${token.value} maxlength="7" spellcheck="false" aria-label=${this.labels.designHex.replace('{token}', token.label)}
                            @change=${(event) => this.typed(token, event.target)}>
                        ${reset}
                    </div>
                    ${this.contrastHint(token)}
                </div>`;
            case 'font':
                return html`<div class="token">
                    <label for=${id}>${token.label}</label>
                    <div class="row">
                        <select id=${id} style="font-family: ${token.css}" @change=${(event) => this.change(token, event.target.value)}>
                            ${token.options.map((option) => html`<option value=${option.value} ?selected=${option.value === token.value} style="font-family: ${option.css}">${this.labels.fontNames?.[option.value] ?? option.label}</option>`)}
                        </select>
                        ${reset}
                    </div>
                </div>`;
            case 'length': {
                const number = parseFloat(token.value);

                return html`<div class="token">
                    <label for=${id}>${token.label}</label>
                    <div class="row">
                        <input type="range" id=${id} min=${token.min ?? 0} max=${token.max ?? Math.max(100, number * 2)} step=${token.step ?? 1} .value=${String(number)}
                            aria-valuetext=${`${number} ${token.unit}`} @input=${(event) => this.change(token, `${event.target.value}${token.unit}`)}>
                        <output for=${id}>${number} ${token.unit}</output>
                        ${reset}
                    </div>
                </div>`;
            }
            default:
                return html`<fieldset class="token">
                    <legend>${token.label}</legend>
                    ${token.options.map((option) => html`<label class="choice"><input type="radio" name=${id} value=${option.value} .checked=${option.value === token.value}
                        @change=${() => this.change(token, option.value)}><span>${option.label}</span></label>`)}
                    ${reset}
                </fieldset>`;
        }
    }

    /** A hex value typed by hand; anything else goes back to the last value. */
    typed(token, input) {
        let value = input.value.trim();
        value = value.startsWith('#') ? value : `#${value}`;

        if (rgb(value)) {
            this.change(token, value.toLowerCase());
        } else {
            input.value = token.value;
        }
    }

    contrastHint(token) {
        const other = token.contrast?.token;

        if (!other) {
            return nothing;
        }

        const described = this.token(other);
        const against = described ? described.css : getComputedStyle(document.documentElement).getPropertyValue(`--${other}`);
        const ratio = contrast(token.css, against);

        if (ratio === null || ratio >= ENOUGH) {
            return nothing;
        }

        return html`<p class="warning">${icon('warning')}<span>${this.labels.designContrast
            .replace('{ratio}', ratio.toLocaleString(this.bar.config.language))
            .replace('{other}', described?.label ?? other)}</span></p>`;
    }
}

export const designStyles = css`
    /* The list scrolls, the buttons below stay in view. */
    .panel.design form { flex: 1; min-block-size: 0; }

    .panel.design footer {
        display: grid;
        gap: var(--fb-space-3);
        padding: var(--fb-space-4) var(--fb-space-5);
        border-block-start: var(--fb-size-border) solid var(--fb-border);
    }

    .panel.design footer.actions { display: flex; }

    .panel .token { display: grid; gap: var(--fb-space-1); }

    .panel .token > label { font-weight: var(--fb-weight-semibold); }

    .panel .row { display: flex; align-items: center; gap: var(--fb-space-2); }

    .panel .row select { flex: 1; }

    .panel .row input[type="range"] { flex: 1; accent-color: var(--fb-accent); }

    .panel .row output { min-inline-size: calc(var(--fb-space-12) + var(--fb-space-2)); color: var(--fb-text-muted); font-variant-numeric: tabular-nums; }

    .panel input[type="color"] {
        inline-size: var(--fb-size-control);
        block-size: var(--fb-size-control);
        padding: var(--fb-space-0);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        cursor: pointer;
    }

    .panel input.hex {
        inline-size: calc(var(--fb-space-16) + var(--fb-space-8));
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-2);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-family: var(--fb-font-mono);
    }

    .panel .reset { padding-inline: var(--fb-space-2); border-color: transparent; }

    .panel .warning {
        display: flex;
        gap: var(--fb-space-2);
        margin: 0;
        color: var(--fb-warning-text);
        font-size: var(--fb-text-sm);
        line-height: var(--fb-leading-snug);
    }

    .panel .warning svg { flex: none; margin-block-start: var(--fb-space-0); }
`;
