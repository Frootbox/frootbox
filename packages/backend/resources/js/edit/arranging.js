import { css, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { endFromEnd } from './edges.js';
import { entryAt, fieldsOf, markEntries, ownerOf, sideBySide } from './entries.js';
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
const PANEL_FIELDS = ['headline', 'text', 'link', 'image', 'video', 'icon', 'file'];

/** Up to this many blocks the picker shows them without groups (decision 0148). */
const FEW_BLOCKS = 8;

/** Entries above the groups of the picker; group names never start with a hash (decision 0202). */
const SITE_GROUP = '#site';
const ALL_GROUP = '#all';

/** The symbol of a group, for blocks without a preview. */
const GROUP_ICONS = { header: 'header', heading: 'heading', text: 'text', media: 'image', teaser: 'teaser', callout: 'callout', list: 'list', form: 'form', structure: 'columns' };

/**
 * The preview of a block or variant (decision 0148): an SVG drawn in the
 * colours of the website through <use>, so it inherits the tokens of the
 * page, a picture, or else the symbol of its group. Previews are
 * decoration; the title stays text.
 */
function preview(url, group) {
    if (!url) {
        return html`<span class="preview none">${icon(GROUP_ICONS[group] ?? 'block')}</span>`;
    }

    if (new URL(url, location.href).pathname.endsWith('.svg')) {
        return html`<span class="preview"><svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false"><use href="${url}#preview"></use></svg></span>`;
    }

    return html`<span class="preview"><img src=${url} alt="" loading="lazy" decoding="async"></span>`;
}

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
        translate: 0 -100%;
    }

    .block-tools.inside { translate: none; }

    /* Inside the corner of the entry, so it does not cover the buttons of the block. */
    .entry-tools { margin-inline-end: var(--fb-space-1); translate: 0 var(--fb-space-1); }

    .block-tools button {
        justify-content: center;
        min-inline-size: var(--fb-size-control-sm);
        padding-inline: var(--fb-space-1);
    }

    .block-tools button[disabled] { cursor: default; opacity: 0.4; }
    .block-tools .note { white-space: nowrap; }

    dialog.picker { inline-size: min(100% - var(--fb-space-8), var(--fb-size-form)); }
    dialog.picker.grouped { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    .picker-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--fb-space-4);
        align-items: start;
    }

    /* Same height for every group, so the dialog does not jump. */
    .grouped .picker-body {
        grid-template-columns: auto minmax(0, 1fr);
        block-size: min(60vh, calc(var(--fb-space-16) * 8));
    }

    .grouped .picker-body > ul { max-block-size: 100%; }

    @media (max-width: 40rem) {
        .grouped .picker-body { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
        .grouped .picker-groups { display: flex; overflow-x: auto; }
        .grouped .picker-groups button { white-space: nowrap; }

        .grouped .picker-groups .lead + li:not(.lead) {
            margin-block-start: 0;
            padding-block-start: 0;
            border-block-start: 0;
            margin-inline-start: var(--fb-space-1);
            padding-inline-start: var(--fb-space-1);
            border-inline-start: var(--fb-size-border) solid var(--fb-border);
        }
    }

    .picker-groups, .picker-cards {
        margin: 0;
        padding: var(--fb-space-1);
        overflow-y: auto;
        list-style: none;
        max-block-size: min(60vh, calc(var(--fb-space-16) * 8));
    }

    .picker-groups { display: grid; align-content: start; gap: var(--fb-space-0); }

    .picker-groups button {
        justify-content: space-between;
        gap: var(--fb-space-4);
        inline-size: 100%;
        border-color: transparent;
        font-weight: var(--fb-weight-regular);
        text-align: start;
    }

    .picker-groups button[aria-pressed="true"] {
        background: var(--fb-accent-soft);
        color: var(--fb-accent-text);
        font-weight: var(--fb-weight-semibold);
    }

    .picker-groups .count { color: var(--fb-text-muted); font-size: var(--fb-text-xs); }

    /* A line between "For this website" and "Show all" and the groups (decision 0202). */
    .picker-groups .lead + li:not(.lead) {
        margin-block-start: var(--fb-space-1);
        padding-block-start: var(--fb-space-1);
        border-block-start: var(--fb-size-border) solid var(--fb-border);
    }

    .picker-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--fb-space-16) * 3), 1fr));
        gap: var(--fb-space-3);
        align-content: start;
    }

    .picker-cards button {
        display: grid;
        align-content: start;
        gap: var(--fb-space-1);
        inline-size: 100%;
        block-size: 100%;
        padding: var(--fb-space-2);
        border-color: var(--fb-border);
        text-align: start;
    }

    .picker-cards small {
        color: var(--fb-text-muted);
        font-weight: var(--fb-weight-regular);
        line-height: var(--fb-leading-snug);
    }

    /* 16:10, cut at the bottom; it shows the website's own colours, so it gets a frame. */
    .preview {
        display: grid;
        place-items: center;
        overflow: hidden;
        aspect-ratio: 16 / 10;
        margin-block-end: var(--fb-space-1);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface-2);
        color: var(--fb-text-muted);
    }

    .preview svg:not(.icon), .preview img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        object-position: top;
    }

    .preview.none .icon { inline-size: var(--fb-space-8); block-size: var(--fb-space-8); }

    .panel label.choice .preview { inline-size: calc(var(--fb-space-16) * 1.5); margin: 0; }

    .panel {
        position: absolute;
        inset-block-start: var(--fb-space-4);
        inset-block-end: calc(var(--bar-block-size, 0px) + 2 * var(--fb-space-4));
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

    .panel .icon-choice svg {
        flex: none;
        inline-size: var(--fb-space-6);
        block-size: var(--fb-space-6);
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
        /** The list entry whose buttons show, inside that block (decision 0145). */
        this.entry = null;
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

        markEntries();
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
        const block = state?.block ? document.querySelector(`${BLOCK}[data-fb-block="${CSS.escape(state.block)}"]`) : null;
        // After a change of a list: the field of the entry in question.
        const field = state?.field
            ? [...(block ?? document).querySelectorAll(`[data-fb-field="${CSS.escape(state.field)}"]:not([data-fb-site])`)].find((item) => ownerOf(item) === block)
            : null;
        const element = field ?? block;

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
        const found = entryAt(target);
        const entry = found && found.owner === block ? found : null;

        if (block !== this.block) {
            this.block = block;
            this.confirming = false;
            this.bar.requestUpdate();
        }

        if (entry?.element !== this.entry?.element) {
            this.entry = entry;
            this.bar.requestUpdate();

            if (entry) {
                this.describe().then(() => this.bar.requestUpdate());
            }
        }
    }

    key(event) {
        const target = event.target instanceof Element ? event.target : null;

        if (!target || target === this.bar) {
            return;
        }

        // Alt+F10 reaches the buttons of the field, then of the entry and the block; in rich text its toolbar.
        if (event.key === 'F10' && event.altKey && !target.closest('[data-fb-type="richtext"], [data-fb-type="table"]')) {
            const field = target.closest('[data-fb-field]');

            if (field && this.bar.hasFieldTools(field)) {
                event.preventDefault();
                this.bar.focusFieldTools(field);
            } else if (this.reachTools(target)) {
                event.preventDefault();
            }

            return;
        }

        const area = target.matches('fb-area[data-fb-area]') ? target : null;

        if (area && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.openPicker(this.targetIn(area));
        }
    }

    /**
     * Focuses the buttons of the entry around an element, else of its
     * block. In an entry they come first; from there Alt+F10 again
     * reaches those of the block.
     */
    reachTools(target) {
        const block = target.closest(BLOCK);
        const entry = entryAt(target);

        if (entry && entry.owner === block) {
            this.select(target);
            this.entryReturn = target;
            this.focusTools('.entry-tools');

            return true;
        }

        if (block) {
            this.select(block);
            this.focusTools();

            return true;
        }

        return false;
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

    focusTools(tools = '.block-tools') {
        this.bar.updateComplete.then(() => this.bar.renderRoot.querySelector(`${tools} button:not([disabled])`)?.focus());
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
        const end = endFromEnd(this.bar, rect);
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
            style="inset-block-start: ${top}px; inset-inline-end: ${end}px"
            @keydown=${(event) => this.toolsKey(event, block)}>${content}</div>`;
    }

    /** Asks before deleting, in place of the buttons. */
    /** The summary of the list of an entry from block.list or layout.list, once loaded. */
    listOf(entry) {
        const owner = entry.owner
            ? this.blocks?.find((block) => block.name === entry.owner.dataset.fbName)
            : this.layouts?.find((layout) => layout.name === this.bar.config.page?.layout);
        let fields = owner?.fields ?? [];
        let list = null;

        for (const segment of entry.list.split('/')) {
            if (/^\d+$/.test(segment)) {
                continue;
            }

            list = fields.find((field) => field.name === segment) ?? null;
            fields = list?.fields ?? [];
        }

        return list;
    }

    /**
     * The buttons at the entry under the pointer or with the focus, at
     * its top end (decision 0145): move it, add one after it, remove it.
     */
    entryTools() {
        const entry = this.entry;

        if (!entry?.element.isConnected || this.picker || this.panel?.busy) {
            return nothing;
        }

        const rect = entry.element.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > innerHeight || rect.width === 0) {
            return nothing;
        }

        const labels = this.labels;
        const list = this.listOf(entry);
        const name = list?.label || labels.entry.replace('{number}', '').trim();
        const number = String(entry.index + 1);
        const full = list?.max != null && entry.count >= list.max;
        const needed = (list?.min ?? 0) >= entry.count;
        const across = sideBySide(entry);
        const button = (glyph, label, action, disabled = false, why = '', tone = '') => html`<button type="button" class=${tone}
            aria-label=${label} title=${disabled && why ? why : label} ?disabled=${disabled || this.busy} @click=${action}>${icon(glyph)}</button>`;

        return html`<div class="block-tools entry-tools" role="toolbar"
            aria-label=${labels.entryTools.replace('{number}', number).replace('{list}', name)}
            style="inset-block-start: ${Math.max(rect.top, 0)}px; inset-inline-end: ${endFromEnd(this.bar, rect)}px"
            @keydown=${(event) => this.entryToolsKey(event)}>
            ${button(across ? 'left' : 'up', labels.moveEarlier, () => this.moveEntry(entry, entry.index - 1), entry.index === 0)}
            ${button(across ? 'right' : 'down', labels.moveLater, () => this.moveEntry(entry, entry.index + 1), entry.index >= entry.count - 1)}
            ${button('plus', labels.insertEntry, () => this.addEntry(entry), full, labels.entriesMax.replace('{count}', String(list?.max)))}
            ${button('trash', labels.removeEntry, () => this.removeEntry(entry), needed, labels.entriesMin.replace('{count}', String(list?.min)), 'danger')}
        </div>`;
    }

    entryToolsKey(event) {
        const buttons = [...this.bar.renderRoot.querySelectorAll('.entry-tools button:not([disabled])')];
        const at = buttons.indexOf(this.bar.renderRoot.activeElement);

        if (event.key === 'Escape') {
            event.preventDefault();
            const back = this.entryReturn?.isConnected ? this.entryReturn : this.entry ? fieldsOf(this.entry)[0] : null;
            back?.focus();
        } else if (event.key === 'F10' && event.altKey) {
            event.preventDefault();
            this.focusTools();
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const step = event.key === 'ArrowRight' ? 1 : -1;
            buttons[(at + step + buttons.length) % buttons.length]?.focus();
        }
    }

    /** Where a field of an entry lies after the entry moved to another position. */
    fieldAt(entry, index, field = null) {
        const fields = fieldsOf(entry);
        const list = this.listOf(entry);
        const required = list ? fields.find((item) => !list.fields.find((summary) => item.dataset.fbField === `${entry.path}/${summary.name}`)?.optional) : null;
        const chosen = field ?? required ?? fields[0];

        return chosen ? `${entry.list}/${index}/${chosen.dataset.fbField.slice(entry.path.length + 1)}` : null;
    }

    entryInput(entry) {
        return entry.owner ? { block: entry.owner.dataset.fbBlock } : {};
    }

    focusedField(entry) {
        const active = document.activeElement?.closest?.('[data-fb-field]');

        return active && entry.element.contains(active) ? active : null;
    }

    moveEntry(entry, to) {
        const field = this.fieldAt(entry, to, this.focusedField(entry));

        return this.change('page.move-list-entry', { ...this.entryInput(entry), path: entry.path, to }, () => entry.owner?.dataset.fbBlock ?? null, false, field);
    }

    addEntry(entry) {
        const field = this.fieldAt(entry, entry.index + 1);

        return this.change('page.add-list-entry', { ...this.entryInput(entry), path: entry.list, index: entry.index + 1 }, () => entry.owner?.dataset.fbBlock ?? null, false, field);
    }

    removeEntry(entry) {
        const next = entry.index < entry.count - 1 ? entry.index : entry.index - 1;
        const field = next >= 0 ? this.fieldAt(entry, next) : null;

        return this.change('page.remove-list-entry', { ...this.entryInput(entry), path: entry.path }, () => entry.owner?.dataset.fbBlock ?? null, false, field);
    }

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
    async change(name, input, focus, panel = false, field = null) {
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
        writeRestore(this.restoreKey, { block: focus(result.data ?? {}), panel, field });
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
            const [blocks, layouts, groups] = await Promise.all([this.query('block.list'), this.query('layout.list'), this.query('block.groups')]);
            this.blocks = blocks ?? [];
            this.layouts = layouts ?? [];
            this.groups = groups ?? [];
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
        // Blocks the theme hides stay on pages, but are not offered (decision 0162).
        const choices = this.blocks.filter((block) => block.offered !== false && (info?.allow ? info.allow.includes(block.name) : !block.widget));
        const groups = choices.length > FEW_BLOCKS ? this.groupsOf(choices) : [];

        this.picker = { ...this.picker, loading: false, info, full: info?.max != null && count >= info.max, choices, groups, group: groups.find((group) => group.name === SITE_GROUP || !group.lead)?.name ?? null };
        this.bar.requestUpdate();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('dialog.picker :is(input, .picker-cards button)')?.focus();
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

    /**
     * The blocks by group in the order of block.groups, those without a
     * known group under "Other" at the end. One group alone is no group.
     * Above them "For this website" with the blocks the theme of the site
     * made or adapted, if some but not all are, and "Show all"
     * (decision 0202). The picker opens on "For this website", else on
     * the first group.
     */
    groupsOf(blocks) {
        const labels = this.labels;
        const known = new Set((this.groups ?? []).map((group) => group.name));
        const groups = (this.groups ?? []).map((group) => ({
            name: group.name,
            title: labels.groups?.[group.name] ?? group.title,
            blocks: blocks.filter((block) => block.group === group.name),
        }));
        groups.push({ name: '', title: labels.otherGroup, blocks: blocks.filter((block) => !known.has(block.group)) });
        const filled = groups.filter((group) => group.blocks.length > 0);

        if (filled.length < 2) {
            return [];
        }

        const tailored = blocks.filter((block) => block.tailored);
        const all = filled.flatMap((group) => group.blocks);
        const lead = [
            ...(tailored.length > 0 && tailored.length < blocks.length ? [{ name: SITE_GROUP, title: labels.siteGroup, blocks: all.filter((block) => block.tailored), lead: true }] : []),
            { name: ALL_GROUP, title: labels.allGroup, blocks: all, lead: true },
        ];

        return [...lead, ...filled];
    }

    pickGroup(name) {
        this.picker = { ...this.picker, group: name, query: '' };
        this.bar.requestUpdate();
    }

    /** The dialog to pick a block for an area. */
    pickerDialog() {
        const picker = this.picker;

        if (!picker) {
            return nothing;
        }

        const labels = this.labels;
        const needle = picker.query.trim().toLowerCase();
        const groups = picker.groups ?? [];
        const groupTitle = (block) => groups.find((group) => !group.lead && group.blocks.includes(block))?.title ?? '';
        const matches = (block) => [block.title, block.description, ...(block.keywords ?? []), groupTitle(block)]
            .some((text) => text.toLowerCase().includes(needle));
        let choices = picker.choices ?? [];

        if (needle !== '') {
            choices = choices.filter(matches);
        } else if (groups.length > 0) {
            choices = groups.find((group) => group.name === picker.group)?.blocks ?? [];
        }

        const areaLabel = picker.info?.label || picker.area;
        const shownGroup = needle === '' ? groups.find((group) => group.name === picker.group) : null;
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
                <div class="picker-body">
                    ${groups.length > 0 ? html`<ul class="picker-groups" aria-label=${labels.blockGroups}>
                        ${groups.map((group) => html`<li class=${group.lead ? 'lead' : nothing}><button type="button" aria-pressed=${String(group === shownGroup)} @click=${() => this.pickGroup(group.name)}>
                            <span>${group.title}</span><span class="count">${group.blocks.length}</span></button></li>`)}
                    </ul>` : nothing}
                    <ul class="picker-cards" aria-label=${shownGroup?.title ?? labels.addBlock}>
                        ${choices.map((block) => html`<li><button type="button" ?disabled=${this.busy} @click=${() => this.add(block)}>
                            ${preview(block.preview, block.group)}
                            <span>${block.title}</span>${block.description ? html`<small>${block.description}</small>` : nothing}</button></li>`)}
                        ${choices.length === 0 ? html`<li class="hint">${labels.noBlocks}</li>` : nothing}
                    </ul>
                </div>`;
        }

        return html`<dialog class="picker ${(picker.groups ?? []).length > 0 ? 'grouped' : ''}" aria-labelledby="fb-picker-title" @cancel=${(event) => { event.preventDefault(); this.closePicker(); }}>
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
        this.bar.design?.hide();
        this.bar.comments?.hide();
        this.bar.outline?.hide();
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
        const withPreviews = summary.variants.some((item) => item.preview);

        if (summary.variants.length <= 1 && options.length === 0 && fields.length === 0 && lists.length === 0) {
            return html`<p class="hint">${labels.noSettings}</p>`;
        }

        return html`
            ${summary.variants.length > 1 ? html`<fieldset>
                <legend>${labels.variant}</legend>
                ${summary.variants.map((item) => html`<label class="choice">
                    <input type="radio" name="variant" .value=${item.name} .checked=${item.name === variant?.name}
                        @change=${() => this.setVariant(data, summary, item)}>
                    ${withPreviews ? preview(item.preview, summary.group) : nothing}
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

        if (field.type === 'image') {
            return html`<div><span class="hint">${field.label}</span>
                <button type="button" class="link-field" @click=${() => this.editImage(data, path, value)}>
                    <span>${value?.media ? this.labels.imageChosen : this.labels.noImage}</span>${icon('image')}</button></div>`;
        }

        if (field.type === 'video') {
            return html`<div><span class="hint">${field.label}</span>
                <button type="button" class="link-field" @click=${() => this.editImage(data, path, value, 'video')}>
                    <span>${value?.media ? this.labels.videoChosen : this.labels.noVideo}</span>${icon('video')}</button></div>`;
        }

        if (field.type === 'file') {
            return html`<div><span class="hint">${field.label}</span>
                <button type="button" class="link-field" @click=${() => this.editImage(data, path, value, 'file')}>
                    <span>${value?.media ? (value.text || this.labels.documentChosen) : this.labels.noDocument}</span>${icon('file')}</button></div>`;
        }

        if (field.type === 'icon') {
            // The dialog of the symbols (decision 0182); the chosen one shows here.
            const chosen = this.bar.icons.describe(value);

            return html`<div><span class="hint">${field.label}</span>
                <button type="button" class="link-field icon-choice" @click=${() => this.editIcon(data, path, value)}>
                    <span>${value ? (chosen?.label ?? value) : this.labels.noIcon}</span>${chosen ? unsafeSVG(chosen.svg) : icon('symbol')}</button></div>`;
        }

        const save = (event) => {
            const text = event.target.value.trim() === '' ? null : event.target.value;
            this.setField(data, path, value, text);
        };

        return html`<label>${field.label}
            ${field.type === 'text'
                ? html`<textarea rows="3" .value=${value ?? ''} placeholder=${field.placeholder || nothing} @change=${save}></textarea>`
                : html`<input type="text" .value=${value ?? ''} placeholder=${field.placeholder || nothing} @change=${save}
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

    editImage(data, path, value, kind = 'image') {
        const button = this.bar.renderRoot.activeElement;

        this.bar.media.open({
            kind,
            value,
            apply: (chosen) => this.panelChange('page.update-field', { block: data.id, path, value: chosen, previous: value }),
            remove: () => this.panelChange('page.update-field', { block: data.id, path, value: null, previous: value }),
            done: () => button?.focus(),
        });
    }

    editIcon(data, path, value) {
        const button = this.bar.renderRoot.activeElement;

        this.bar.icons.open({
            value,
            apply: (chosen) => this.panelChange('page.update-field', { block: data.id, path, value: chosen, previous: value }),
            remove: () => this.panelChange('page.update-field', { block: data.id, path, value: null, previous: value }),
            done: () => button?.focus(),
        });
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
