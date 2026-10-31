import { css, html, nothing } from 'lit';
import { icon } from './icons.js';

/**
 * Arranging blocks on the website (decision 0123): buttons at the block
 * under the pointer or focus, a dialog to pick a new block and a side
 * panel with variant, options, fields and list entries. Every change is
 * one action; after it the page loads again and the focus goes back to
 * the block, so the page always looks the way visitors get it.
 */

const RESTORE = 'fb-edit-restore:';
const BLOCK = '[data-fb-block]';
const PANEL_FIELDS = ['headline', 'text', 'link'];

/** The block around an element, null for the layout. */
function parentOf(element) {
    return element.parentElement?.closest(BLOCK) ?? null;
}

/** The blocks of the same area of the same parent, in their order. */
function siblingsOf(parent, area) {
    const blocks = (parent ?? document).querySelectorAll(`${BLOCK}[data-fb-area="${CSS.escape(area)}"]`);

    return [...blocks].filter((block) => parentOf(block) === parent);
}

/** A block of the content by its id, at any depth. */
function findBlock(node, id) {
    for (const blocks of Object.values(node?.areas ?? {})) {
        for (const block of Array.isArray(blocks) ? blocks : []) {
            if (block?.id === id) {
                return block;
            }

            const inner = findBlock(block, id);

            if (inner) {
                return inner;
            }
        }
    }

    return null;
}

function readRestore(key) {
    try {
        const value = sessionStorage.getItem(key);
        sessionStorage.removeItem(key);

        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function writeRestore(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // The focus then stays where the browser puts it.
    }
}

/** How a list entry is named in the panel: its first text, else its number. */
function entryLabel(entry, fields, number, labels) {
    for (const field of fields) {
        const value = entry?.[field.name];

        if ((field.type === 'headline' || field.type === 'text') && typeof value === 'string' && value.trim() !== '') {
            return value;
        }
    }

    return labels.entry.replace('{number}', String(number));
}

export const arrangingStyles = css`
    .block-tools {
        position: absolute;
        display: flex;
        align-items: center;
        gap: var(--fb-space-0);
        padding: var(--fb-space-0);
        pointer-events: auto;
        background: var(--fb-surface);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
        box-shadow: var(--fb-shadow-sm);
        translate: -100% -100%;
    }

    .block-tools.inside { translate: -100% 0; }

    .block-tools button {
        justify-content: center;
        min-inline-size: var(--fb-size-control-sm);
        padding-inline: var(--fb-space-1);
    }

    .block-tools button[disabled] { cursor: default; opacity: 0.4; }
    .block-tools .note { white-space: nowrap; }

    .picker-list {
        display: grid;
        gap: var(--fb-space-1);
        max-block-size: min(60vh, calc(8 * var(--fb-size-row)));
        margin: 0;
        padding: 0;
        overflow-y: auto;
        list-style: none;
    }

    .picker-list button {
        display: grid;
        gap: var(--fb-space-0);
        inline-size: 100%;
        padding-block: var(--fb-space-2);
        border-color: var(--fb-border);
        text-align: start;
    }

    .picker-list small {
        color: var(--fb-text-muted);
        font-weight: var(--fb-weight-regular);
        line-height: var(--fb-leading-snug);
    }

    .panel {
        position: absolute;
        inset-block: var(--fb-space-4);
        inset-inline-end: var(--fb-space-4);
        display: flex;
        flex-direction: column;
        inline-size: min(calc(100vw - 2 * var(--fb-space-4)), var(--fb-size-narrow));
        pointer-events: auto;
        background: var(--fb-surface);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-lg);
        box-shadow: var(--fb-shadow-lg);
    }

    .panel header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--fb-space-2);
        padding: var(--fb-space-3) var(--fb-space-3) var(--fb-space-3) var(--fb-space-5);
        border-block-end: var(--fb-size-border) solid var(--fb-border);
    }

    .panel h2 {
        margin: 0;
        font-size: var(--fb-text-lg);
        font-weight: var(--fb-weight-bold);
    }

    .panel h2:focus { outline: none; }

    .panel form {
        display: grid;
        align-content: start;
        gap: var(--fb-space-5);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .panel fieldset {
        display: grid;
        gap: var(--fb-space-3);
        min-inline-size: 0;
        margin: 0;
        padding: 0;
        border: 0;
    }

    .panel legend, .panel h3 {
        margin: 0 0 var(--fb-space-2);
        padding: 0;
        color: var(--fb-text-muted);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-semibold);
        letter-spacing: var(--fb-tracking-caps);
        text-transform: uppercase;
    }

    .panel label { display: grid; gap: var(--fb-space-1); font-weight: var(--fb-weight-semibold); }
    .panel label.check, .panel label.choice { display: flex; align-items: flex-start; gap: var(--fb-space-2); }
    .panel label.choice span { display: grid; gap: var(--fb-space-0); }
    .panel label.choice small { color: var(--fb-text-muted); font-weight: var(--fb-weight-regular); }

    .panel input[type="text"], .panel input[type="number"], .panel select, .panel textarea {
        min-block-size: var(--fb-size-control);
        padding: var(--fb-space-2) var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-weight: var(--fb-weight-regular);
    }

    .panel textarea { resize: vertical; line-height: var(--fb-leading-normal); }

    .panel input[type="checkbox"], .panel input[type="radio"] {
        inline-size: var(--fb-size-check);
        block-size: var(--fb-size-check);
        margin: 0;
        accent-color: var(--fb-accent);
    }

    .panel :is(input, select, textarea):focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .panel .link-field {
        justify-content: space-between;
        min-block-size: var(--fb-size-control);
        border-color: var(--fb-border-strong);
        font-weight: var(--fb-weight-regular);
    }

    .entries {
        display: grid;
        gap: var(--fb-space-2);
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .entries > li {
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
    }

    .entries .entry-head {
        display: flex;
        align-items: center;
        gap: var(--fb-space-0);
        padding: var(--fb-space-1);
    }

    .entries .entry-toggle {
        display: flex;
        flex: 1;
        align-items: center;
        gap: var(--fb-space-2);
        min-inline-size: 0;
        padding-inline: var(--fb-space-2);
        font-weight: var(--fb-weight-regular);
        text-align: start;
    }

    .entries .entry-toggle span, span.entry-toggle {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .entries .entry-fields { display: grid; gap: var(--fb-space-3); padding: var(--fb-space-2) var(--fb-space-3) var(--fb-space-3); }
    .entries .entry-head button:not(.entry-toggle) { min-inline-size: var(--fb-size-control-sm); justify-content: center; padding-inline: var(--fb-space-1); }
    .entries .entry-head button[disabled] { cursor: default; opacity: 0.4; }
    .panel .add { justify-self: start; border-color: var(--fb-border); }
`;

export class Arranging {
    constructor(bar) {
        this.bar = bar;
        /** The block whose buttons show. */
        this.block = null;
        this.confirming = false;
        /** The open dialog to pick a block: where it goes. */
        this.picker = null;
        /** The open side panel: block, its content and its description. */
        this.panel = null;
        this.blocks = null;
        this.layouts = null;
        this.busy = false;

        this.onKey = (event) => this.key(event);
        this.onClick = (event) => this.click(event);
    }

    get labels() {
        return this.bar.labels;
    }

    get restoreKey() {
        return RESTORE + (this.bar.config.page?.id ?? '');
    }

    start() {
        for (const element of document.querySelectorAll(`${BLOCK}, fb-area[data-fb-area]`)) {
            if (element.tabIndex < 0) {
                element.tabIndex = 0;
            }
        }

        document.addEventListener('keydown', this.onKey, true);
        document.addEventListener('click', this.onClick, true);
        this.restore();
    }

    stop() {
        document.removeEventListener('keydown', this.onKey, true);
        document.removeEventListener('click', this.onClick, true);
    }

    /** After loading again: the focus back on the block, the panel open again. */
    restore() {
        const state = readRestore(this.restoreKey);
        const element = state?.block ? document.querySelector(`${BLOCK}[data-fb-block="${CSS.escape(state.block)}"]`) : null;

        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > innerHeight) {
            element.scrollIntoView({ block: 'center' });
        }

        element.focus({ preventScroll: true });
        this.select(element);

        if (state.panel) {
            this.openPanel(element);
        }
    }

    /** Follows pointer and focus on the page; the bar itself changes nothing. */
    select(target) {
        if (!(target instanceof Element) || target === this.bar || this.picker) {
            return;
        }

        const block = target.closest(BLOCK);

        if (block !== this.block) {
            this.block = block;
            this.confirming = false;
            this.bar.requestUpdate();
        }
    }

    key(event) {
        const target = event.target instanceof Element ? event.target : null;

        if (!target || target === this.bar) {
            return;
        }

        // Alt+F10 reaches the buttons of the block, in rich text its toolbar.
        if (event.key === 'F10' && event.altKey && !target.closest('[data-fb-type="richtext"]')) {
            const block = target.closest(BLOCK);

            if (block) {
                event.preventDefault();
                this.select(block);
                this.focusTools();
            }

            return;
        }

        const area = target.matches('fb-area[data-fb-area]') ? target : null;

        if (area && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.openPicker(this.targetIn(area));
        }
    }

    click(event) {
        const area = event.target instanceof Element ? event.target.closest('fb-area[data-fb-area]') : null;

        if (area) {
            event.preventDefault();
            this.openPicker(this.targetIn(area));
        }
    }

    /** Where a block goes into an empty area. */
    targetIn(area) {
        const parent = parentOf(area);

        return { parent: parent?.dataset.fbBlock ?? null, parentName: parent?.dataset.fbName ?? null, area: area.dataset.fbArea, after: null };
    }

    /** Where a block goes below another one. */
    targetBelow(block) {
        const parent = parentOf(block);

        return { parent: parent?.dataset.fbBlock ?? null, parentName: parent?.dataset.fbName ?? null, area: block.dataset.fbArea, after: block.dataset.fbBlock };
    }

    focusTools() {
        this.bar.updateComplete.then(() => this.bar.renderRoot.querySelector('.block-tools button:not([disabled])')?.focus());
    }

    /** The buttons at the selected block, above its top end. */
    tools() {
        const block = this.block;

        if (!block?.isConnected || this.panel?.id === block.dataset.fbBlock && this.panel.busy) {
            return nothing;
        }

        const rect = block.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > innerHeight || rect.width === 0) {
            return nothing;
        }

        const labels = this.labels;
        const inside = rect.top < 48;
        const top = inside ? Math.max(rect.top, 0) : rect.top;
        const left = Math.min(rect.right, innerWidth);
        const parent = parentOf(block);
        const siblings = siblingsOf(parent, block.dataset.fbArea);
        const index = siblings.indexOf(block);
        const title = block.dataset.fbTitle ?? '';
        const button = (name, label, action, disabled = false, tone = '') => html`<button type="button" class=${tone}
            aria-label=${label} title=${label} ?disabled=${disabled || this.busy} @click=${action}>${icon(name)}</button>`;

        const content = this.confirming
            ? html`<span class="note">${labels.removeConfirm.replace('{block}', title)}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${() => this.remove(block)}>${labels.removeYes}</button>
                <button type="button" @click=${() => this.confirm(false)}>${labels.cancel}</button>`
            : html`
                ${parent ? button('parent', labels.parentBlock, () => this.selectParent(parent)) : nothing}
                ${button('up', labels.moveUp, () => this.move(block, siblings, index - 1), index <= 0)}
                ${button('down', labels.moveDown, () => this.move(block, siblings, index + 1), index >= siblings.length - 1)}
                ${button('copy', labels.copyBlock, () => this.copy(block))}
                ${button('settings', labels.blockSettings, () => this.openPanel(block))}
                ${button('plus', labels.insertBelow, () => this.openPicker(this.targetBelow(block)))}
                ${button('trash', labels.removeBlock, () => this.confirm(true), false, 'danger')}`;

        return html`<div class="block-tools ${inside ? 'inside' : ''}" role="toolbar"
            aria-label=${labels.blockTools.replace('{block}', title)}
            style="inset-block-start: ${top}px; inset-inline-start: ${left}px"
            @keydown=${(event) => this.toolsKey(event, block)}>${content}</div>`;
    }

    /** Asks before deleting, in place of the buttons. */
    confirm(asking) {
        this.confirming = asking;
        this.bar.requestUpdate();
        this.focusTools();
    }

    toolsKey(event, block) {
        const buttons = [...this.bar.renderRoot.querySelectorAll('.block-tools button:not([disabled])')];
        const at = buttons.indexOf(this.bar.renderRoot.activeElement);

        if (event.key === 'Escape') {
            event.preventDefault();
            this.confirming = false;
            this.bar.requestUpdate();
            block.focus();
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const step = event.key === 'ArrowRight' ? 1 : -1;
            buttons[(at + step + buttons.length) % buttons.length]?.focus();
        }
    }

    selectParent(parent) {
        parent.focus({ preventScroll: true });
        this.select(parent);
        this.focusTools();
    }

    async move(block, siblings, to) {
        const parent = parentOf(block);
        const others = siblings.filter((sibling) => sibling !== block);
        const after = to > 0 ? others[to - 1].dataset.fbBlock : null;

        await this.change('page.move-block', {
            block: block.dataset.fbBlock,
            parent: parent?.dataset.fbBlock ?? null,
            area: block.dataset.fbArea,
            after,
        }, () => block.dataset.fbBlock);
    }

    async copy(block) {
        await this.change('page.copy-block', { block: block.dataset.fbBlock }, (data) => data.block);
    }

    async remove(block) {
        const parent = parentOf(block);
        const siblings = siblingsOf(parent, block.dataset.fbArea);
        const index = siblings.indexOf(block);
        const next = siblings[index + 1] ?? siblings[index - 1] ?? parent;

        await this.change('page.remove-block', { block: block.dataset.fbBlock }, () => next?.dataset.fbBlock ?? null);
    }

    /**
     * Runs an action that changes the structure and loads the page again,
     * with the focus on the block it names and the panel open if it was.
     */
    async change(name, input, focus, panel = false) {
        this.busy = true;
        this.bar.requestUpdate();
        await this.bar.editing?.flushAll();
        const result = await this.bar.run(name, { id: this.bar.config.page.id, language: this.bar.config.language, ...input });

        if (!result.ok) {
            this.busy = false;
            this.confirming = false;

            if (this.panel) {
                this.panel = { ...this.panel, busy: false };
            }

            this.bar.requestUpdate();

            return false;
        }

        this.bar.changed(result.data?.entry ?? null);
        writeRestore(this.restoreKey, { block: focus(result.data ?? {}), panel });
        location.reload();

        return true;
    }

    async query(name, params = null) {
        const search = params ? '?' + new URLSearchParams(params) : '';

        try {
            const response = await fetch(this.bar.config.queries + name + search, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });

            return response.ok ? (await response.json()).data : null;
        } catch {
            return null;
        }
    }

    /** The blocks and layouts with what they allow, once per page view. */
    async describe() {
        if (!this.blocks) {
            const [blocks, layouts] = await Promise.all([this.query('block.list'), this.query('layout.list')]);
            this.blocks = blocks ?? [];
            this.layouts = layouts ?? [];
        }
    }

    /** The draft or published state of the page, fresh for each use. */
    async pageData() {
        const details = await this.query('page.show', { id: this.bar.config.page.id });

        return details?.draft ?? details?.published ?? null;
    }

    async openPicker(target) {
        this.picker = { ...target, query: '', loading: true, info: null };
        this.bar.requestUpdate();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('dialog.picker')?.showModal();

        const [, page] = await Promise.all([this.describe(), target.parentName ? null : this.pageData()]);

        if (!this.picker) {
            return;
        }

        const owner = target.parentName
            ? this.blocks.find((block) => block.name === target.parentName)
            : this.layouts.find((layout) => layout.name === page?.layout);
        const info = owner?.areas?.find((item) => item.name === target.area) ?? null;
        const count = siblingsOf(target.parent ? document.querySelector(`${BLOCK}[data-fb-block="${CSS.escape(target.parent)}"]`) : null, target.area).length;
        const choices = this.blocks.filter((block) => (info?.allow ? info.allow.includes(block.name) : !block.widget));

        this.picker = { ...this.picker, loading: false, info, full: info?.max != null && count >= info.max, choices };
        this.bar.requestUpdate();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('dialog.picker :is(input, .picker-list button)')?.focus();
    }

    closePicker() {
        const target = this.picker;
        this.bar.renderRoot.querySelector('dialog.picker')?.close();
        this.picker = null;
        this.bar.requestUpdate();

        const back = target?.after ?? target?.parent;
        const element = back ? document.querySelector(`${BLOCK}[data-fb-block="${CSS.escape(back)}"]`) : null;
        element?.focus({ preventScroll: true });
    }

    /** The dialog to pick a block for an area. */
    pickerDialog() {
        const picker = this.picker;

        if (!picker) {
            return nothing;
        }

        const labels = this.labels;
        const needle = picker.query.trim().toLowerCase();
        const choices = (picker.choices ?? []).filter((block) => needle === ''
            || block.title.toLowerCase().includes(needle) || block.description.toLowerCase().includes(needle));
        const areaLabel = picker.info?.label || picker.area;
        let body;

        if (picker.loading) {
            body = html`<p class="hint">${labels.loading}</p>`;
        } else if (picker.full) {
            body = html`<p class="hint">${labels.areaFull.replace('{area}', areaLabel)}</p>`;
        } else if ((picker.choices ?? []).length === 0) {
            body = html`<p class="hint">${labels.noBlocks}</p>`;
        } else {
            body = html`
                ${picker.choices.length > 6 ? html`<label>${labels.search}
                    <input type="text" .value=${picker.query} autocomplete="off"
                        @input=${(event) => { this.picker = { ...this.picker, query: event.target.value }; this.bar.requestUpdate(); }}></label>` : nothing}
                <ul class="picker-list">
                    ${choices.map((block) => html`<li><button type="button" ?disabled=${this.busy} @click=${() => this.add(block)}>
                        <span>${block.title}</span>${block.description ? html`<small>${block.description}</small>` : nothing}</button></li>`)}
                    ${choices.length === 0 ? html`<li class="hint">${labels.noBlocks}</li>` : nothing}
                </ul>`;
        }

        return html`<dialog class="picker" aria-labelledby="fb-picker-title" @cancel=${(event) => { event.preventDefault(); this.closePicker(); }}>
            <form @submit=${(event) => event.preventDefault()}>
                <h2 id="fb-picker-title">${labels.addBlock}</h2>
                ${areaLabel ? html`<p class="hint">${labels.intoArea.replace('{area}', areaLabel)}</p>` : nothing}
                ${body}
                <div class="actions"><button type="button" @click=${() => this.closePicker()}>${labels.cancel}</button></div>
            </form>
        </dialog>`;
    }

    async add(block) {
        const picker = this.picker;

        await this.change('page.add-block', {
            name: block.name,
            parent: picker.parent,
            area: picker.area,
            after: picker.after,
        }, (data) => data.block);
    }

    async openPanel(element) {
        const id = element.dataset.fbBlock;
        this.panel = { id, title: element.dataset.fbTitle ?? '', loading: true, busy: false };
        this.bar.requestUpdate();

        const [, page] = await Promise.all([this.describe(), this.pageData()]);
        const content = page?.translations?.[this.bar.config.language]?.content ?? null;
        const data = findBlock(content, id);
        const summary = this.blocks.find((block) => block.name === (data?.block ?? element.dataset.fbName)) ?? null;

        if (this.panel?.id !== id) {
            return;
        }

        this.panel = { ...this.panel, loading: false, data, summary };
        this.bar.requestUpdate();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('.panel h2')?.focus();
    }

    closePanel() {
        const id = this.panel?.id;
        this.panel = null;
        this.bar.requestUpdate();
        const element = id ? document.querySelector(`${BLOCK}[data-fb-block="${CSS.escape(id)}"]`) : null;
        element?.focus({ preventScroll: true });
    }

    /** The side panel with the settings of a block. */
    panelView() {
        const panel = this.panel;

        if (!panel) {
            return nothing;
        }

        const labels = this.labels;
        let body;

        if (panel.loading) {
            body = html`<p class="hint">${labels.loading}</p>`;
        } else if (!panel.data || !panel.summary) {
            body = html`<p class="hint">${labels.blockGone}</p>`;
        } else {
            body = this.settings(panel.data, panel.summary);
        }

        return html`<section class="panel" role="region" aria-labelledby="fb-panel-title"
            @keydown=${(event) => { if (event.key === 'Escape') { event.preventDefault(); this.closePanel(); } }}>
            <header>
                <h2 id="fb-panel-title" tabindex="-1">${labels.settingsOf.replace('{block}', panel.title)}</h2>
                <button type="button" aria-label=${labels.close} title=${labels.close} @click=${() => this.closePanel()}>${icon('close')}</button>
            </header>
            <form @submit=${(event) => event.preventDefault()}>
                <fieldset ?disabled=${panel.busy}>${body}</fieldset>
            </form>
        </section>`;
    }

    settings(data, summary) {
        const labels = this.labels;
        const variantName = data.variant ?? 'Default';
        const variant = summary.variants.find((item) => item.name === variantName) ?? summary.variants[0];
        const options = variant?.options ?? [];
        const fields = summary.fields.filter((field) => PANEL_FIELDS.includes(field.type));
        const lists = summary.fields.filter((field) => field.type === 'list');

        if (summary.variants.length <= 1 && options.length === 0 && fields.length === 0 && lists.length === 0) {
            return html`<p class="hint">${labels.noSettings}</p>`;
        }

        return html`
            ${summary.variants.length > 1 ? html`<fieldset>
                <legend>${labels.variant}</legend>
                ${summary.variants.map((item) => html`<label class="choice">
                    <input type="radio" name="variant" .value=${item.name} .checked=${item.name === variant?.name}
                        @change=${() => this.setVariant(data, summary, item)}>
                    <span>${item.title}${item.description ? html`<small>${item.description}</small>` : nothing}</span>
                </label>`)}
            </fieldset>` : nothing}
            ${options.length > 0 ? html`<fieldset>
                <legend>${labels.options}</legend>
                ${options.map((option) => this.optionInput(data, option))}
            </fieldset>` : nothing}
            ${fields.length > 0 ? html`<fieldset>
                <legend>${labels.content}</legend>
                ${fields.map((field) => this.fieldInput(data, field, field.name, data.fields?.[field.name] ?? null))}
            </fieldset>` : nothing}
            ${lists.map((list) => this.listView(data, list))}`;
    }

    optionInput(data, option) {
        const value = data.options?.[option.name] ?? option.default;
        const set = (next) => this.setOption(data, option.name, next);
        const description = option.description ? html`<small class="hint">${option.description}</small>` : nothing;

        switch (option.type) {
            case 'boolean':
                return html`<label class="check"><input type="checkbox" .checked=${value === true}
                    @change=${(event) => set(event.target.checked)}>${option.label}</label>`;
            case 'choice':
                return html`<label>${option.label}
                    <select @change=${(event) => set(event.target.value)}>
                        ${option.choices.map((choice) => html`<option .value=${String(choice.value)} ?selected=${String(choice.value) === String(value)}>${choice.label}</option>`)}
                    </select>${description}</label>`;
            case 'number':
                return html`<label>${option.label}
                    <input type="number" .value=${String(value ?? '')} min=${option.min ?? nothing} max=${option.max ?? nothing}
                        @change=${(event) => set(event.target.value === '' ? option.default : Number(event.target.value))}>${description}</label>`;
            default:
                return html`<label>${option.label}
                    <input type="text" .value=${String(value ?? '')}
                        @change=${(event) => set(event.target.value)}>${description}</label>`;
        }
    }

    fieldInput(data, field, path, value) {
        if (field.type === 'link') {
            const text = value ? value.text || value.target || value.url : this.labels.noLink;

            return html`<div><span class="hint">${field.label}</span>
                <button type="button" class="link-field" @click=${() => this.editLink(data, path, value)}>
                    <span>${text}</span>${icon('link')}</button></div>`;
        }

        const save = (event) => {
            const text = event.target.value.trim() === '' ? null : event.target.value;
            this.setField(data, path, value, text);
        };

        return html`<label>${field.label}
            ${field.type === 'text'
                ? html`<textarea rows="3" .value=${value ?? ''} @change=${save}></textarea>`
                : html`<input type="text" .value=${value ?? ''} @change=${save}
                    @keydown=${(event) => { if (event.key === 'Enter') { event.preventDefault(); event.target.blur(); } }}>`}
        </label>`;
    }

    listView(data, list) {
        const labels = this.labels;
        const entries = Array.isArray(data.fields?.[list.name]) ? data.fields[list.name] : [];
        const inner = list.fields.filter((field) => PANEL_FIELDS.includes(field.type));
        const open = this.panel.open ?? [];
        const last = entries.length - 1;
        const toggle = (path) => {
            this.panel = { ...this.panel, open: open.includes(path) ? open.filter((item) => item !== path) : [...open, path] };
            this.bar.requestUpdate();
        };

        return html`<fieldset>
            <legend>${list.label}</legend>
            <ol class="entries">
                ${entries.map((entry, index) => {
                    const label = entryLabel(entry, list.fields, index + 1, labels);
                    const path = `${list.name}/${index}`;
                    const expanded = open.includes(path);

                    return html`<li>
                        <div class="entry-head">
                            ${inner.length > 0
                                ? html`<button type="button" class="entry-toggle" aria-expanded=${expanded ? 'true' : 'false'}
                                    @click=${() => toggle(path)}>${icon(expanded ? 'collapse' : 'expand')}<span>${label}</span></button>`
                                : html`<span class="entry-toggle">${label}</span>`}
                            <button type="button" aria-label="${labels.moveUp}: ${label}" title=${labels.moveUp} ?disabled=${index === 0}
                                @click=${() => this.listChange('page.move-list-entry', data, { path, to: index - 1 })}>${icon('up')}</button>
                            <button type="button" aria-label="${labels.moveDown}: ${label}" title=${labels.moveDown} ?disabled=${index === last}
                                @click=${() => this.listChange('page.move-list-entry', data, { path, to: index + 1 })}>${icon('down')}</button>
                            <button type="button" class="danger" aria-label="${labels.removeEntry}: ${label}" title=${labels.removeEntry}
                                @click=${() => this.listChange('page.remove-list-entry', data, { path })}>${icon('trash')}</button>
                        </div>
                        ${expanded ? html`<div class="entry-fields">
                            ${inner.map((field) => this.fieldInput(data, field, `${path}/${field.name}`, entry?.[field.name] ?? null))}
                        </div>` : nothing}
                    </li>`;
                })}
            </ol>
            <button type="button" class="add" @click=${() => this.listChange('page.add-list-entry', data, { path: list.name })}>${icon('plus')}${labels.addEntry}</button>
        </fieldset>`;
    }

    /** Changes in the panel load the page again and keep the panel open. */
    panelChange(name, input) {
        this.panel = { ...this.panel, busy: true };
        this.bar.requestUpdate();

        return this.change(name, input, () => this.panel.id, true);
    }

    setVariant(data, summary, variant) {
        // Options the new variant does not have would not fit it.
        const names = variant.options.map((option) => option.name);
        const options = Object.fromEntries(Object.entries(data.options ?? {}).filter(([name]) => names.includes(name)));

        return this.panelChange('page.update-block', { block: data.id, variant: variant.name, options });
    }

    setOption(data, name, value) {
        return this.panelChange('page.update-block', { block: data.id, options: { ...(data.options ?? {}), [name]: value } });
    }

    setField(data, path, previous, value) {
        if ((previous ?? null) === (value ?? null)) {
            return null;
        }

        return this.panelChange('page.update-field', { block: data.id, path, value, previous });
    }

    listChange(name, data, input) {
        return this.panelChange(name, { block: data.id, ...input });
    }

    editLink(data, path, value) {
        const button = this.bar.renderRoot.activeElement;

        this.bar.openLink({
            withText: true,
            text: value?.text ?? '',
            href: value?.target ?? value?.url ?? '',
            newWindow: value?.newWindow === true,
            apply: ({ text, href, newWindow }) => {
                const link = href.startsWith('page:') ? { target: href } : { url: href };

                if (text) {
                    link.text = text;
                }

                if (newWindow) {
                    link.newWindow = true;
                }

                this.panelChange('page.update-field', { block: data.id, path, value: link, previous: value });
            },
            remove: () => this.panelChange('page.update-field', { block: data.id, path, value: null, previous: value }),
            done: () => button?.focus(),
        });
    }
}
