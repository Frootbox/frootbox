/*
 * SPDX-License-Identifier: MIT
 */

import { css, html, nothing } from 'lit';
import { icon } from './icons.js';

/** The hash that opens the panel after loading, e.g. at a new address. */
export const PAGE_HASH = '#fb-page';

const FIELDS = ['title', 'slug', 'seoTitle', 'description'];

/** The data of the page: the draft, else what is published. */
function current(details) {
    return details?.draft ?? details?.published ?? null;
}

/**
 * The panel "Page" of the bar (decision 0347): title, address and the
 * texts for search engines of this language, the versions in the other
 * languages and whether searches leave the page out. It reads page.show
 * when it opens and changes the draft only through page.update, like the
 * details in the backend; everything else stays there.
 */
export class PagePanel {
    constructor(bar) {
        this.bar = bar;
        this.state = null;
    }

    get labels() {
        return this.bar.labels;
    }

    get settings() {
        return this.bar.config.page?.settings ?? null;
    }

    get language() {
        return this.bar.config.language;
    }

    /** Whether the bar offers the panel: in the editing mode, for a page of its own. */
    get available() {
        return Boolean(this.bar.config.editing && this.settings);
    }

    async show(errors = {}, focus = 'title') {
        this.bar.arranging?.closePanel?.();
        this.bar.design?.hide();
        this.bar.comments?.hide();
        this.bar.outline?.hide();
        this.bar.navigationPanel?.hide();
        this.state = { loading: true, details: null, values: null, errors, busy: false };
        this.bar.requestUpdate();
        let body = null;

        try {
            const response = await fetch(`${this.bar.config.queries}page.show?id=${encodeURIComponent(this.bar.config.page.id)}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            body = response.ok ? await response.json() : null;
        } catch {
            body = null;
        }

        if (!this.state) {
            return;
        }

        const details = body?.data ?? null;
        const translation = current(details)?.translations?.[this.language] ?? null;
        this.update({ loading: false, details, values: translation ? Object.fromEntries(FIELDS.map((key) => [key, translation[key] ?? ''])) : null });
        await this.bar.updateComplete;
        const first = Object.keys(this.state?.errors ?? {})[0];
        const target = first ? this.bar.renderRoot.querySelector(`#fb-page-${first}`) : this.bar.renderRoot.querySelector(`#fb-page-${focus}`);
        target?.focus();
    }

    async close() {
        this.hide();
        await this.bar.updateComplete;
        // Back to the button, on a phone to "More" where the panel was chosen.
        const button = this.bar.renderRoot.querySelector('[data-fb-page]');
        (button?.getClientRects().length ? button : this.bar.renderRoot.querySelector('[data-fb-more]'))?.focus();
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

    /** Runs page.update and returns the page, or puts the errors at their fields. */
    async save(input) {
        this.update({ busy: true, errors: {} });
        this.bar.saving++;
        this.bar.message = { tone: 'info', text: this.labels.saving };
        const response = await this.bar.action('page.update', { id: this.bar.config.page.id, ...input });
        const body = response ? await response.json().catch(() => null) : null;
        this.bar.saving--;

        if (response?.ok) {
            this.bar.message = { tone: 'info', text: this.labels.saved };
            this.bar.saved();

            return body?.data ?? null;
        }

        const errors = {};
        const rest = [];

        for (const error of Array.isArray(body?.errors) ? body.errors : []) {
            const match = String(error.pointer ?? '').match(/^\/translations\/[^/]+\/([a-zA-Z]+)$/);

            if (match && FIELDS.includes(match[1])) {
                errors[match[1]] ??= error.message;
            } else {
                rest.push(error.message);
            }
        }

        const text = rest[0] ?? body?.detail ?? this.labels.failed;
        this.bar.message = { tone: 'danger', text, reload: response?.status === 409 };

        if (this.state) {
            this.update({ busy: false, errors });
            await this.bar.updateComplete;
            const first = Object.keys(errors)[0];
            this.bar.renderRoot.querySelector(first ? `#fb-page-${first}` : '#fb-page-title')?.focus();
        }

        return null;
    }

    /** Saves the general part; a new address loads the page there, else the page is swapped. */
    async saveGeneral() {
        const values = this.state.values;
        const before = current(this.state.details)?.translations?.[this.language] ?? {};
        const changes = Object.fromEntries(FIELDS
            .filter((key) => !(key === 'slug' && this.settings.start))
            .filter((key) => (values[key] ?? '') !== (before[key] ?? ''))
            .map((key) => [key, values[key]]));

        if (Object.keys(changes).length === 0) {
            this.bar.message = { tone: 'info', text: this.labels.saved };
            this.bar.saved();

            return;
        }

        const details = await this.save({ translations: { [this.language]: changes } });

        if (!details) {
            return;
        }

        const slug = current(details)?.translations?.[this.language]?.slug ?? '';
        const base = this.settings.languages.find((language) => language.code === this.language)?.base;

        if ('slug' in changes && slug !== (before.slug ?? '') && base) {
            location.assign(base + slug + PAGE_HASH);

            return;
        }

        await this.reopen();
    }

    /** The page again without loading it, with the panel open on the new bar and the focus where it was. */
    async reopen(focus = 'title') {
        const next = await this.bar.refresh();
        await next?.pagePanel?.show({}, focus);
    }

    /** Adds the version in a language with the title of the default language and goes there. */
    async addVersion(language) {
        const data = current(this.state.details);
        const title = data?.translations?.[this.settings.default]?.title ?? data?.translations?.[this.language]?.title ?? '';
        const details = await this.save({ translations: { [language.code]: { title } } });

        if (!details) {
            return;
        }

        const slug = current(details)?.translations?.[language.code]?.slug ?? '';

        if (language.base) {
            location.assign((this.settings.start ? language.base : language.base + slug) + PAGE_HASH);
        } else {
            await this.reopen();
        }
    }

    async saveVisibility(key, value) {
        if (await this.save({ [key]: value })) {
            await this.reopen(key);
        }
    }

    /** The button in the bar, before the comments (decision 0347). */
    button() {
        if (!this.available) {
            return nothing;
        }

        const labels = this.labels;

        return html`<button type="button" data-fb-page aria-expanded=${this.state ? 'true' : 'false'} title=${labels.pageTitle}
            @click=${() => (this.state ? this.close() : this.show())}>${icon('file')}<span class="button-text">${labels.page}</span></button>`;
    }

    view() {
        const state = this.state;

        if (!state) {
            return nothing;
        }

        const labels = this.labels;
        let body;

        if (state.loading) {
            body = html`<p class="hint">${labels.loading}</p>`;
        } else if (!state.details) {
            body = html`<p class="hint">${labels.failed}</p>`;
        } else {
            body = html`${this.general()}${this.languages()}${this.visibility()}
                <a class="all" href=${this.bar.config.page.backend}>${icon('external')}${labels.pageAllSettings}</a>`;
        }

        return html`<section class="panel page-panel" role="region" aria-labelledby="fb-page-title-heading"
            @keydown=${(event) => { if (event.key === 'Escape') { event.preventDefault(); this.close(); } }}>
            <header>
                <h2 id="fb-page-title-heading" tabindex="-1">${labels.pageTitle}</h2>
                <button type="button" aria-label=${labels.close} title=${labels.close} @click=${() => this.close()}>${icon('close')}</button>
            </header>
            <div class="page-body">${body}</div>
        </section>`;
    }

    /** One text field with its hint and error, ids by key. */
    field(key, label, { hint = null, prefix = null, multiline = false, placeholder = '', maxlength = null, lang = null, dir = null } = {}) {
        const state = this.state;
        const id = `fb-page-${key}`;
        const error = state.errors[key] ?? null;
        const described = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || nothing;
        const input = (event) => this.update({ values: { ...state.values, [key]: event.target.value } });
        const disabled = !this.settings.editable || state.busy;
        const control = multiline
            ? html`<textarea id=${id} rows="3" .value=${state.values[key] ?? ''} ?disabled=${disabled} maxlength=${maxlength ?? nothing}
                lang=${lang ?? nothing} dir=${dir ?? nothing} aria-invalid=${error ? 'true' : nothing} aria-describedby=${described} @input=${input}></textarea>`
            : html`<input type="text" id=${id} .value=${state.values[key] ?? ''} ?disabled=${disabled} maxlength=${maxlength ?? nothing}
                placeholder=${placeholder || nothing} lang=${lang ?? nothing} dir=${dir ?? nothing}
                aria-invalid=${error ? 'true' : nothing} aria-describedby=${described} @input=${input}>`;

        return html`<div class="page-field">
            <label for=${id}>${label}</label>
            ${prefix ? html`<div class="prefixed"><span class="prefix" dir="ltr">${prefix}</span>${control}</div>` : control}
            ${error ? html`<p class="error" id=${`${id}-error`}>${icon('warning')}<span>${error}</span></p>` : nothing}
            ${hint ? html`<p class="hint" id=${`${id}-hint`}>${hint}</p>` : nothing}
        </div>`;
    }

    general() {
        const labels = this.labels;
        const settings = this.settings;
        const language = settings.languages.find((entry) => entry.code === this.language);

        if (!this.state.values) {
            return nothing;
        }

        const lang = language?.code ?? null;
        const dir = language?.direction ?? null;
        const title = this.state.values.title ?? '';
        const placeholder = settings.start ? settings.site : (settings.site ? `${title} – ${settings.site}` : title);

        return html`<form @submit=${(event) => { event.preventDefault(); this.saveGeneral(); }} novalidate>
            <fieldset>
                <legend>${labels.pageGeneral}</legend>
                ${settings.editable ? nothing : html`<p class="hint">${labels.pageReadOnly}</p>`}
                ${this.field('title', labels.pageName, { lang, dir })}
                ${settings.start
                    ? html`<div class="page-field"><span class="label">${labels.pageAddress}</span>
                        <p class="prefix static" dir="ltr">${language?.prefix ?? ''}</p><p class="hint">${labels.pageStartAddress}</p></div>`
                    : this.field('slug', labels.pageAddress, { hint: labels.pageAddressHint, prefix: language?.prefix, dir: 'ltr' })}
                ${this.field('seoTitle', labels.pageSeoTitle, { hint: labels.pageSeoTitleHint, placeholder, maxlength: 120, lang, dir })}
                ${this.field('description', labels.pageDescription, { hint: labels.pageDescriptionHint, multiline: true, maxlength: 300, lang, dir })}
            </fieldset>
            ${settings.editable ? html`<div class="page-actions">
                <button type="submit" class="primary" ?disabled=${this.state.busy}>${labels.pageSave}</button>
                <p class="hint">${labels.pageDraftNote}</p>
            </div>` : nothing}
        </form>`;
    }

    languages() {
        const labels = this.labels;
        const settings = this.settings;

        if (settings.languages.length < 2) {
            return nothing;
        }

        const row = (language) => {
            let action = nothing;
            let status = labels.pageAvailable;

            if (language.code === this.language) {
                status = labels.pageThisLanguage;
            } else if (language.exists && language.url) {
                action = html`<a href=${language.url + PAGE_HASH}>${labels.pageOpenVersion.replace('{language}', language.title)}</a>`;
            } else if (!language.exists) {
                status = labels.pageNoVersion;
                action = settings.editable ? html`<button type="button" ?disabled=${this.state.busy}
                    @click=${() => this.addVersion(language)}>${icon('plus')}${labels.pageAddVersion.replace('{language}', language.title)}</button>` : nothing;
            }

            return html`<li data-language=${language.code}>
                <span class="language" lang=${language.code}>${language.title}</span>
                <span class="hint">${status}</span>
                ${action}
            </li>`;
        };

        return html`<section class="page-section" aria-labelledby="fb-page-languages">
            <h3 id="fb-page-languages">${labels.pageLanguages}</h3>
            <ul class="page-languages">${settings.languages.map(row)}</ul>
        </section>`;
    }

    visibility() {
        const labels = this.labels;
        const settings = this.settings;
        const data = current(this.state.details);
        const options = [['none', labels.pageInclude], ['page', labels.pageLeaveOut], ['branch', labels.pageLeaveOutBranch]];
        const select = (key, label, inherited, hint) => {
            const id = `fb-page-${key}`;

            return html`<div class="page-field">
                <label for=${id}>${label}</label>
                <select id=${id} ?disabled=${!settings.editable || this.state.busy} aria-describedby=${`${id}-hint`}
                    @change=${(event) => this.saveVisibility(key, event.target.value)}>
                    ${options.map(([value, text]) => html`<option value=${value} ?selected=${(data?.[key] ?? 'none') === value}>${text}</option>`)}
                </select>
                <p class="hint" id=${`${id}-hint`}>${inherited ? labels.pageInherited.replace('{page}', inherited) : hint}</p>
            </div>`;
        };

        return html`<section class="page-section" aria-labelledby="fb-page-visibility">
            <h3 id="fb-page-visibility">${labels.pageVisibility}</h3>
            ${select('excludeFromSearchEngines', labels.pageSearchEngines, settings.inherited.searchEngines, labels.pageSearchEnginesHint)}
            ${select('excludeFromSiteSearch', labels.pageSiteSearch, settings.inherited.siteSearch, labels.pageSiteSearchHint)}
        </section>`;
    }
}

export const pageStyles = css`
    .panel .page-body {
        display: grid;
        align-content: start;
        gap: var(--fb-space-6);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .panel .page-body form { padding: 0; overflow: visible; }

    .panel .page-field { display: grid; gap: var(--fb-space-1); }

    .panel .page-field > .label { font-weight: var(--fb-weight-semibold); }

    .panel .page-field .hint { line-height: var(--fb-leading-snug); }

    .panel .prefixed {
        display: flex;
        align-items: stretch;
        min-inline-size: 0;
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
    }

    .panel .prefixed:focus-within {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .panel .prefixed input { flex: 1; min-inline-size: 0; padding-inline-start: var(--fb-space-0); border: 0; }

    .panel .prefixed input:focus-visible { outline: none; }

    .panel .prefix {
        display: flex;
        align-items: center;
        max-inline-size: 60%;
        padding-inline-start: var(--fb-space-3);
        overflow: hidden;
        color: var(--fb-text-muted);
        font-size: var(--fb-text-sm);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .panel .prefix.static { max-inline-size: none; margin: 0; padding: 0; }

    .panel [aria-invalid="true"], .panel .prefixed:has([aria-invalid="true"]) { border-color: var(--fb-danger); }

    .panel .page-field .error {
        display: flex;
        gap: var(--fb-space-2);
        margin: 0;
        color: var(--fb-danger-text);
        font-size: var(--fb-text-sm);
        line-height: var(--fb-leading-snug);
    }

    .panel .page-field .error svg { flex: none; margin-block-start: var(--fb-space-0); }

    .panel .page-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fb-space-3); }

    .panel .page-actions .hint { flex: 1; min-inline-size: calc(var(--fb-space-16) * 2); }

    .panel .page-section { display: grid; gap: var(--fb-space-3); }

    .panel .page-languages { display: grid; gap: var(--fb-space-3); margin: 0; padding: 0; list-style: none; }

    .panel .page-languages li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fb-space-1) var(--fb-space-3); }

    .panel .page-languages .language { font-weight: var(--fb-weight-semibold); }

    .panel .page-languages :is(a, button) { flex-basis: 100%; justify-content: flex-start; }

    .panel .page-languages button { justify-self: start; flex-basis: auto; border-color: var(--fb-border); }

    .panel .page-body a { color: var(--fb-accent-text); }

    .panel .page-body .all { display: inline-flex; align-items: center; gap: var(--fb-space-2); justify-self: start; }
`;
