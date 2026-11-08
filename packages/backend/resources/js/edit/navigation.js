/*
 * SPDX-License-Identifier: MIT
 */

import { css, html, nothing } from 'lit';
import { icon } from './icons.js';

/** The fields of each kind of item besides label, newWindow, options and children (decision 0106). */
const FIELDS = {
    target: ['target'],
    url: ['url'],
    anchor: ['anchor', 'target'],
    phone: ['phone'],
    email: ['email'],
    heading: [],
    pages: ['target', 'depth'],
};

const KINDS = Object.keys(FIELDS);

/** Kinds that link somewhere and may open in a new window. */
const LINKS = ['target', 'url', 'anchor'];

/** The items of a navigation: the draft, else what is published, by language. */
function itemsOf(details) {
    return details?.draft ?? details?.published ?? {};
}

function copy(items) {
    return JSON.parse(JSON.stringify(items ?? []));
}

/** The list that holds the item at a path, and its index there. */
function placeOf(items, path) {
    let list = items;

    for (const index of path.slice(0, -1)) {
        list = list[index].children ??= [];
    }

    return [list, path.at(-1)];
}

function itemAt(items, path) {
    const [list, index] = placeOf(items, path);

    return list[index] ?? null;
}

/** Levels an item takes with its children. */
function height(item) {
    return 1 + Math.max(0, ...(item.children ?? []).map(height));
}

/**
 * The panel "Navigation" of the bar (decision 0349): the items of a
 * navigation of the theme in the language of the page, to move, indent,
 * change and remove from the keyboard. Every change writes the items of
 * the language into the draft with navigation.update and swaps the page,
 * so the theme shows the draft; publishing in the bar takes it along.
 */
export class NavigationPanel {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
    }

    get labels() {
        return this.bar.labels;
    }

    get config() {
        return this.bar.config.navigations ?? null;
    }

    get language() {
        return this.bar.config.language;
    }

    /** Whether the bar offers the panel: in the editing mode, with the right and a navigation of the theme. */
    get available() {
        return Boolean(this.bar.config.editing && this.bar.config.marking && this.config?.list?.length);
    }

    definition(name) {
        return this.config?.list.find((entry) => entry.name === name) ?? null;
    }

    /** The title of a navigation for its tab on the page. */
    title(name) {
        return this.definition(name)?.title ?? name;
    }

    /**
     * Opens the panel for a navigation; focus is a place to focus after
     * loading: { path, action } of an item, "add" or "name".
     */
    async show(name = null, focus = null) {
        this.bar.arranging?.closePanel?.();
        this.bar.design?.hide();
        this.bar.comments?.hide();
        this.bar.outline?.hide();
        this.bar.pagePanel?.hide();
        const chosen = this.definition(name ?? this.state?.name)?.name ?? this.config.list[0].name;
        this.state = { name: chosen, loading: true, details: null, form: null, busy: false, error: null };
        this.bar.requestUpdate();
        this.bar.loadPages();
        let body = null;

        try {
            const response = await fetch(`${this.bar.config.queries}navigation.show?name=${encodeURIComponent(chosen)}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            body = response.ok ? await response.json() : null;
        } catch {
            body = null;
        }

        if (!this.state || this.state.name !== chosen) {
            return;
        }

        this.update({ loading: false, details: body?.data ?? null });
        await this.bar.updateComplete;
        this.focus(focus);
    }

    focus(focus) {
        const root = this.bar.renderRoot;
        let target = null;

        if (focus?.path) {
            const row = root.querySelector(`.nav-panel li[data-path="${focus.path.join('.')}"]`);
            const button = row?.querySelector(`:scope > .nav-row [data-action="${focus.action}"]`);
            target = button && !button.disabled ? button : row?.querySelector(':scope > .nav-row [data-action="edit"]');
        } else if (focus === 'add') {
            target = root.querySelector('.nav-panel [data-nav-add]');
        } else if (focus === 'name') {
            target = root.querySelector('#fb-navigation-name');
        }

        (target ?? root.querySelector('#fb-navigation-heading'))?.focus();
    }

    async close() {
        this.hide();
        await this.bar.updateComplete;
        this.bar.renderRoot.querySelector('[data-fb-more]')?.focus();
    }

    /** Closes without moving the focus, e.g. when another panel opens. */
    hide() {
        if (this.state) {
            this.state = null;
            this.bar.requestUpdate();
        }
    }

    update(changes) {
        this.state = { ...this.state, ...changes };
        this.bar.requestUpdate();
    }

    /** The items of the language of the page, null if it shows those of another one. */
    get own() {
        const items = itemsOf(this.state?.details);

        return Array.isArray(items[this.language]) ? items[this.language] : null;
    }

    /** The language whose items the page shows instead, e.g. "de" on an English page. */
    get source() {
        const items = itemsOf(this.state?.details);

        return (this.config.chain ?? []).find((code) => code !== this.language && Array.isArray(items[code]) && items[code].length > 0) ?? null;
    }

    /** Writes the items of the language into the draft, then swaps the page with the panel open. */
    async save(items, focus) {
        this.update({ busy: true, error: null });
        this.bar.saving++;
        this.bar.message = { tone: 'info', text: this.labels.saving };
        const response = await this.bar.action('navigation.update', { name: this.state.name, items: { [this.language]: items } });
        const body = response ? await response.json().catch(() => null) : null;
        this.bar.saving--;

        if (!response?.ok) {
            const error = (Array.isArray(body?.errors) ? body.errors[0]?.message : null) ?? body?.detail ?? this.labels.failed;
            this.bar.message = { tone: 'danger', text: error, reload: response?.status === 409 };

            if (this.state) {
                this.update({ busy: false, error });
            }

            return false;
        }

        this.bar.message = { tone: 'info', text: this.labels.saved };
        this.bar.saved();
        await this.reopen(focus);

        return true;
    }

    /** The page again without loading it, with the panel open on the new bar. */
    async reopen(focus) {
        const name = this.state.name;
        const next = await this.bar.refresh();
        await next?.navigationPanel?.show(name, focus);
    }

    async copyFrom(source) {
        this.update({ busy: true });
        const response = await this.bar.action('navigation.copy', { name: this.state.name, from: source, to: this.language });

        if (!response?.ok) {
            this.update({ busy: false });
            this.bar.fail(response);

            return;
        }

        this.bar.saved();
        await this.reopen('add');
    }

    /** Moves an item up or down among its siblings. */
    move(path, step) {
        const items = copy(this.own);
        const [list, index] = placeOf(items, path);
        const [item] = list.splice(index, 1);
        list.splice(index + step, 0, item);

        this.save(items, { path: [...path.slice(0, -1), index + step], action: step < 0 ? 'up' : 'down' });
    }

    /** Makes an item the last child of the one before it. */
    indent(path) {
        const items = copy(this.own);
        const [list, index] = placeOf(items, path);
        const [item] = list.splice(index, 1);
        const parent = list[index - 1];
        parent.children = [...(parent.children ?? []), item];

        this.save(items, { path: [...path.slice(0, -1), index - 1, parent.children.length - 1], action: 'indent' });
    }

    /** Puts an item after its parent, one level up. */
    outdent(path) {
        const items = copy(this.own);
        const [list, index] = placeOf(items, path);
        const [item] = list.splice(index, 1);
        const parentPath = path.slice(0, -1);
        const [outer, at] = placeOf(items, parentPath);
        const parent = outer[at];

        if (parent.children?.length === 0) {
            delete parent.children;
        }

        outer.splice(at + 1, 0, item);
        this.save(items, { path: [...parentPath.slice(0, -1), at + 1], action: 'outdent' });
    }

    remove(path) {
        const items = copy(this.own);
        const [list, index] = placeOf(items, path);
        list.splice(index, 1);
        const left = list.length === 0 ? null : [...path.slice(0, -1), Math.min(index, list.length - 1)];

        this.save(items, left ? { path: left, action: 'edit' } : 'add');
    }

    /** Opens the form of an item, of a new one at the end without a path. */
    edit(path = null) {
        const item = path ? itemAt(this.own ?? [], path) : null;
        const values = item ? copy(item) : { type: 'target', target: this.bar.config.page?.id ? `page:${this.bar.config.page.id}` : '' };
        delete values.children;
        this.update({ form: { path, values, error: null } });
        this.bar.updateComplete.then(() => this.bar.renderRoot.querySelector('#fb-navigation-type')?.focus());
    }

    cancel() {
        const path = this.state.form?.path;
        this.update({ form: null });
        this.bar.updateComplete.then(() => this.focus(path ? { path, action: 'edit' } : 'add'));
    }

    setValue(key, value) {
        this.update({ form: { ...this.state.form, values: { ...this.state.form.values, [key]: value } } });
    }

    setOption(key, value) {
        const options = { ...(this.state.form.values.options ?? {}), [key]: value };
        this.setValue('options', options);
    }

    /** The item from the form: only the fields of its kind, nothing empty. */
    itemOf(values) {
        const type = values.type;
        const item = { type };

        if (values.id) {
            item.id = values.id;
        }

        for (const field of FIELDS[type]) {
            const value = field === 'depth' ? Number(values.depth || 1) : String(values[field] ?? '').trim();

            if (value !== '') {
                item[field] = value;
            }
        }

        const label = String(values.label ?? '').trim();

        if (label !== '') {
            item.label = label;
        }

        if (LINKS.includes(type) && values.newWindow) {
            item.newWindow = true;
        }

        const options = Object.fromEntries(Object.entries(values.options ?? {}).filter(([, value]) => value !== '' && value !== null && value !== undefined));

        if (Object.keys(options).length > 0) {
            item.options = options;
        }

        return item;
    }

    apply() {
        const form = this.state.form;
        const items = copy(this.own ?? []);
        const item = this.itemOf(form.values);
        let path = form.path;

        if (path) {
            const [list, index] = placeOf(items, path);
            const children = list[index].children;
            // Subpages build their own items below them.
            list[index] = children && item.type !== 'pages' ? { ...item, children } : item;
        } else {
            items.push(item);
            path = [items.length - 1];
        }

        this.save(items, { path, action: 'edit' }).then((done) => {
            if (!done && this.state?.form) {
                this.update({ form: { ...this.state.form, error: this.state.error } });
            }
        });
    }

    /** The text of an item as the page shows it, and its kind. */
    describe(item) {
        const labels = this.labels;
        const page = item.target ? this.bar.pages?.find((entry) => `page:${entry.id}` === item.target) : null;
        const pageTitle = page?.title ?? (this.bar.pages ? labels.navMissingPage : '…');
        const kind = labels.navKinds[item.type] ?? item.type;

        if (item.type === 'pages') {
            return { text: labels.navSubpagesOf.replace('{page}', pageTitle), kind };
        }

        const text = item.label ?? (item.type === 'phone' ? item.phone : item.type === 'email' ? item.email : item.type === 'url' ? item.url : pageTitle);

        return { text: text ?? '', kind: item.type === 'anchor' ? `${kind} #${item.anchor ?? ''}` : kind };
    }

    /** The menu entry in "More", in the part for the whole website. */
    menuEntry() {
        if (!this.available) {
            return nothing;
        }

        return html`<button type="button" role="menuitem" @click=${() => this.bar.choose(() => this.show())}>${icon('navigation')}${this.labels.navigations}</button>`;
    }

    view() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;
        const definition = this.definition(state.name);
        let body;

        if (state.loading) {
            body = html`<p class="hint">${labels.loading}</p>`;
        } else if (!state.details) {
            body = html`<p class="hint">${labels.failed}</p>`;
        } else if (state.form) {
            body = this.form(definition);
        } else {
            body = this.tree(definition);
        }

        return html`<section class="panel nav-panel" role="region" aria-labelledby="fb-navigation-heading"
            @keydown=${(event) => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); state.form ? this.cancel() : this.close(); } }}>
            <header>
                <h2 id="fb-navigation-heading" tabindex="-1">${definition?.title ?? labels.navigations}</h2>
                <button type="button" aria-label=${labels.close} title=${labels.close} @click=${() => this.close()}>${icon('close')}</button>
            </header>
            <div class="page-body">
                ${this.config.list.length > 1 && !state.form ? html`<div class="page-field">
                    <label for="fb-navigation-name">${labels.navigations}</label>
                    <select id="fb-navigation-name" ?disabled=${state.busy} @change=${(event) => this.show(event.target.value, 'name')}>
                        ${this.config.list.map((entry) => html`<option value=${entry.name} ?selected=${entry.name === state.name}>${entry.title}</option>`)}
                    </select>
                </div>` : nothing}
                ${body}
            </div>
        </section>`;
    }

    tree(definition) {
        const labels = this.labels;
        const state = this.state;
        const own = this.own;
        const source = own === null ? this.source : null;
        const languages = this.config.languages ?? {};
        const language = languages[this.language] ?? this.language;
        const shown = own ?? (source ? itemsOf(state.details)[source] : []);

        return html`
            ${source ? html`<div class="nav-fallback">
                <p class="hint">${labels.navFallback.replace('{language}', language).replace('{source}', languages[source] ?? source)}</p>
                <button type="button" ?disabled=${state.busy} @click=${() => this.copyFrom(source)}>${icon('copy')}${labels.navCopy.replace('{language}', language)}</button>
            </div>` : nothing}
            ${shown.length === 0
                ? html`<p class="hint">${labels.navEmpty}</p>`
                : html`<ol class="nav-items" aria-label=${labels.navItems} lang=${source ?? this.language}>${this.rows(shown, [], definition, source === null)}</ol>`}
            ${source ? nothing : html`<button type="button" class="nav-add" data-nav-add ?disabled=${state.busy} @click=${() => this.edit()}>${icon('plus')}${labels.navAdd}</button>`}
            <p class="hint">${labels.navDraftNote}</p>
            <a class="all" href=${`${this.config.screen}/${encodeURIComponent(state.name)}?language=${encodeURIComponent(this.language)}`}>${icon('external')}${labels.navBackend}</a>`;
    }

    rows(items, parent, definition, editable) {
        const labels = this.labels;
        const depth = definition?.depth ?? 1;
        const busy = this.state.busy;

        return items.map((item, index) => {
            const path = [...parent, index];
            const { text, kind } = this.describe(item);
            const level = parent.length;
            const before = items[index - 1];
            const mayIndent = before && before.type !== 'pages' && level + 1 + height(item) <= depth;
            const button = (action, iconName, label, enabled, run) => html`<button type="button" data-action=${action} aria-label=${label.replace('{item}', text)}
                title=${label.replace('{item}', text)} ?disabled=${busy || !enabled} @click=${run}>${icon(iconName)}</button>`;

            return html`<li data-path=${path.join('.')}>
                <div class="nav-row">
                    ${editable
                        ? html`<span class="nav-label"><button type="button" data-action="edit" aria-label=${labels.navEditItem.replace('{item}', text)} ?disabled=${busy}
                            @click=${() => this.edit(path)}>${text}</button><small>${kind}</small></span>
                            <span class="nav-buttons">
                                ${button('up', 'up', labels.navUp, index > 0, () => this.move(path, -1))}
                                ${button('down', 'down', labels.navDown, index < items.length - 1, () => this.move(path, 1))}
                                ${depth > 1 ? button('outdent', 'left', labels.navOutdent, level > 0, () => this.outdent(path)) : nothing}
                                ${depth > 1 ? button('indent', 'right', labels.navIndent, mayIndent, () => this.indent(path)) : nothing}
                                ${button('remove', 'trash', labels.navRemove, true, () => this.remove(path))}
                            </span>`
                        : html`<span class="nav-label"><span>${text}</span><small>${kind}</small></span>`}
                </div>
                ${item.children?.length ? html`<ol>${this.rows(item.children, path, definition, editable)}</ol>` : nothing}
            </li>`;
        });
    }

    form(definition) {
        const labels = this.labels;
        const state = this.state;
        const form = state.form;
        const values = form.values;
        const type = values.type;
        const pages = this.bar.pages ?? [];
        const input = (key, label, { kind = 'text', hint = null, dir = null, required = false } = {}) => {
            const id = `fb-navigation-${key}`;

            return html`<div class="page-field">
                <label for=${id}>${label}</label>
                <input type=${kind} id=${id} .value=${String(values[key] ?? (kind === 'number' ? 1 : ''))} ?required=${required}
                    min=${kind === 'number' ? 1 : nothing} max=${kind === 'number' ? 5 : nothing} dir=${dir ?? nothing}
                    aria-describedby=${hint ? `${id}-hint` : nothing} @input=${(event) => this.setValue(key, event.target.value)}>
                ${hint ? html`<p class="hint" id=${`${id}-hint`}>${hint}</p>` : nothing}
            </div>`;
        };
        const page = values.target ? pages.find((entry) => `page:${entry.id}` === values.target) : null;
        const placeholder = type === 'target' ? page?.title ?? '' : type === 'phone' ? values.phone ?? '' : type === 'email' ? values.email ?? '' : '';
        const languages = this.config.languages ?? {};

        return html`<form class="nav-form" novalidate @submit=${(event) => { event.preventDefault(); this.apply(); }}>
            <h3>${(form.path ? labels.navItemIn : labels.navNewItemIn).replace('{language}', languages[this.language] ?? this.language)}</h3>
            <div class="page-field">
                <label for="fb-navigation-type">${labels.navKind}</label>
                <select id="fb-navigation-type" @change=${(event) => this.setValue('type', event.target.value)}>
                    ${KINDS.map((kind) => html`<option value=${kind} ?selected=${kind === type}>${labels.navKindChoices[kind]}</option>`)}
                </select>
            </div>
            ${FIELDS[type].includes('target') ? html`<div class="page-field">
                <label for="fb-navigation-target">${labels.navPage}</label>
                <select id="fb-navigation-target" @change=${(event) => this.setValue('target', event.target.value)}>
                    ${values.target && !page ? html`<option value=${values.target} selected>${this.bar.pages ? labels.navMissingPage : '…'}</option>` : nothing}
                    ${type === 'anchor' ? html`<option value="" ?selected=${!values.target}>${labels.navThisPage}</option>` : nothing}
                    ${pages.map((entry) => html`<option value=${`page:${entry.id}`} ?selected=${values.target === `page:${entry.id}`}>${entry.title} (${entry.path})</option>`)}
                </select>
            </div>` : nothing}
            ${type === 'url' ? input('url', labels.navAddress, { kind: 'url', dir: 'ltr', required: true }) : nothing}
            ${type === 'anchor' ? input('anchor', labels.navAnchor, { hint: labels.navAnchorHint, required: true }) : nothing}
            ${type === 'phone' ? input('phone', labels.navPhone, { kind: 'tel', dir: 'ltr', required: true }) : nothing}
            ${type === 'email' ? input('email', labels.navEmail, { kind: 'email', dir: 'ltr', required: true }) : nothing}
            ${type === 'pages' ? input('depth', labels.navLevels, { kind: 'number', hint: labels.navLevelsHint }) : nothing}
            ${type === 'pages' ? nothing : html`<div class="page-field">
                <label for="fb-navigation-label">${labels.navText}</label>
                <input type="text" id="fb-navigation-label" .value=${values.label ?? ''} placeholder=${placeholder || nothing} lang=${this.language}
                    aria-describedby="fb-navigation-label-hint" @input=${(event) => this.setValue('label', event.target.value)}>
                <p class="hint" id="fb-navigation-label-hint">${labels.navTextHint}</p>
            </div>`}
            ${LINKS.includes(type) ? html`<label class="check"><input type="checkbox" .checked=${Boolean(values.newWindow)}
                @change=${(event) => this.setValue('newWindow', event.target.checked)}>${labels.newWindow}</label>` : nothing}
            ${(definition?.options ?? []).map((option) => this.option(option, values.options?.[option.name]))}
            ${form.error ? html`<p class="error" role="alert">${icon('warning')}<span>${form.error}</span></p>` : nothing}
            <div class="page-actions">
                <button type="button" ?disabled=${state.busy} @click=${() => this.cancel()}>${labels.cancel}</button>
                <button type="submit" class="primary" ?disabled=${state.busy}>${labels.apply}</button>
            </div>
        </form>`;
    }

    /** A choice per item from the manifest, e.g. "As a button" (decision 0106). */
    option(option, value) {
        const id = `fb-navigation-option-${option.name}`;

        if (option.type === 'boolean') {
            return html`<label class="check"><input type="checkbox" id=${id} .checked=${value === true}
                @change=${(event) => this.setOption(option.name, event.target.checked ? true : null)}>${option.label}</label>`;
        }

        const control = option.type === 'choice'
            ? html`<select id=${id} @change=${(event) => this.setOption(option.name, event.target.value)}>
                <option value="" ?selected=${value === undefined || value === null}>${this.labels.navDefault}</option>
                ${option.choices.map((choice) => html`<option value=${choice.value} ?selected=${String(value) === choice.value}>${choice.label}</option>`)}
            </select>`
            : html`<input type=${option.type === 'number' ? 'number' : 'text'} id=${id} .value=${value === undefined || value === null ? '' : String(value)}
                @input=${(event) => this.setOption(option.name, option.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)}>`;

        return html`<div class="page-field"><label for=${id}>${option.label}</label>${control}</div>`;
    }
}

export const navigationStyles = css`
    .panel .nav-items, .panel .nav-items ol { display: grid; gap: var(--fb-space-1); margin: 0; padding: 0; list-style: none; }

    .panel .nav-items ol { margin-block-start: var(--fb-space-1); padding-inline-start: var(--fb-space-5); border-inline-start: var(--fb-size-border) solid var(--fb-border); }

    .panel .nav-row { display: flex; align-items: center; gap: var(--fb-space-1); }

    .panel .nav-label { display: grid; flex: 1; min-inline-size: 0; justify-items: start; }

    .panel .nav-label > :is(button, span) {
        display: block;
        max-inline-size: 100%;
        padding: 0;
        overflow: hidden;
        border: 0;
        background: none;
        font-weight: var(--fb-weight-semibold);
        text-align: start;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .panel .nav-label > button:hover { text-decoration: underline; }

    .panel .nav-label small { color: var(--fb-text-muted); font-size: var(--fb-text-xs); }

    .panel .nav-buttons { display: flex; flex: none; }

    .panel .nav-buttons button { padding: var(--fb-space-1); border-color: transparent; }

    .panel .nav-buttons button:disabled { opacity: 0.35; }

    .panel .nav-add { justify-self: start; }

    .panel .nav-fallback { display: grid; gap: var(--fb-space-2); justify-items: start; }

    .panel .nav-form { display: grid; gap: var(--fb-space-4); padding: 0; overflow: visible; }

    .panel .nav-form h3 { margin: 0; }

    .panel .nav-form .error { display: flex; gap: var(--fb-space-2); margin: 0; color: var(--fb-danger-text); font-size: var(--fb-text-sm); }
`;
