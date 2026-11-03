/*
 * SPDX-License-Identifier: MIT
 */

import { LitElement } from 'lit';

let count = 0;

/**
 * <fb-tab-panels>: the parts of a long screen behind a bar of tabs
 * (decision 0235). The bar comes from the parts themselves:
 *
 *     <fb-tab-panels label="Parts of the form">
 *         <section id="texts"><h2>Texts</h2> …</section>
 *         <section id="fields" data-count="5"><h2>Fields</h2> …</section>
 *     </fb-tab-panels>
 *
 * - Every part is a <section> with an id and a heading as its first
 *   child, h2 on a screen. The heading becomes the tab and is then only
 *   read out; data-count shows a number on the tab. An icon in the
 *   heading ({{ icon('list') }}) stands before the name (decision 0237).
 * - A link <a href> instead of a part is a tab to another screen, so two
 *   screens share one bar (decision 0237). It is never selected; the
 *   arrow keys only move the focus to it, Enter follows it.
 * - Arrow keys switch, Home and End jump, Tab goes into the part.
 * - The tab is in the address (#fields) without an entry in the
 *   history, so a reload, a link and <fb-form refresh> come back to it.
 *   Links with data-fb-keeps-tab, e.g. the languages, take it along.
 * - Hidden parts stay in the document: their fields keep their input
 *   and a form around all parts sends them.
 * - A tab shows a dot while a field in its part is changed and not saved
 *   (data-fb-changed of <fb-form>) and the number of fields with an
 *   error (aria-invalid). Screen readers hear it as the description of
 *   the tab: "Not saved", "Errors: 1".
 * - "fb-reveal" on an element inside opens its part, e.g. from a link in
 *   the summary of errors. Each part carries its title in
 *   data-fb-panel for that summary.
 *
 * Fires "fb-tab-change" with detail.id.
 */
export class TabPanels extends LitElement {
    static properties = {
        label: {},
    };

    constructor() {
        super();
        this.label = '';
        this.unsaved = document.body?.dataset.fbUnsaved || 'Not saved';
        this.errors = document.body?.dataset.fbTabErrors || 'Errors: {count}';
        this.tabs = [];
        this.panels = [];
        this.bar = null;
        // Changes in the parts count, not those of the bar itself.
        this.observer = new MutationObserver((records) => {
            if (records.some((record) => !this.bar?.contains(record.target))) {
                this.scheduleMarks();
            }
        });
        this.pending = false;
        this.onReveal = this.onReveal.bind(this);
        this.onKey = this.onKey.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.build();
        this.addEventListener('fb-reveal', this.onReveal);
        this.observer.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-fb-changed', 'aria-invalid'] });
    }

    disconnectedCallback() {
        this.observer.disconnect();
        this.removeEventListener('fb-reveal', this.onReveal);
        super.disconnectedCallback();
    }

    build() {
        if (this.bar) {
            return;
        }

        const items = [...this.children].filter((child) => (child.tagName === 'SECTION' && child.id) || (child.tagName === 'A' && child.hasAttribute('href')));
        const prefix = `fb-tab-panels-${++count}`;

        this.bar = document.createElement('div');
        this.bar.className = 'fb-tabs fb-tab-panels__bar';
        this.bar.setAttribute('role', 'tablist');

        if (this.label) {
            this.bar.setAttribute('aria-label', this.label);
        }

        // Links have no part: their place in this.panels stays empty.
        this.panels = items.map((item) => (item.tagName === 'SECTION' ? item : null));
        this.tabs = items.map((item, index) => (item.tagName === 'SECTION' ? this.panelTab(item, `${prefix}-${index}`, index) : this.linkTab(item)));

        this.bar.append(...this.tabs);
        this.bar.addEventListener('keydown', this.onKey);
        this.prepend(this.bar);

        const wanted = this.panels.findIndex((panel) => panel && '#' + panel.id === window.location.hash);
        const first = this.panels.findIndex((panel) => panel !== null);
        this.tabs.forEach((tab) => {
            tab.tabIndex = -1;
        });

        if (first < 0) {
            if (this.tabs[0]) {
                this.tabs[0].tabIndex = 0;
            }

            return;
        }

        this.select(wanted >= 0 ? wanted : first, { address: false });
        this.marks();
    }

    /** The tab of a part, from its heading. */
    panelTab(panel, id, index) {
        const heading = panel.querySelector(':scope > :is(h2, h3, h4)');
        const title = heading?.textContent.trim() || panel.id;
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'fb-tabs__tab';
        tab.id = id;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panel.id);

        const icon = heading?.querySelector('.fb-icon');

        if (icon) {
            tab.append(icon.cloneNode(true));
        }

        const name = document.createElement('span');
        name.textContent = title;
        tab.append(name);
        this.count(tab, panel);

        const dot = document.createElement('span');
        dot.className = 'fb-tabs__dot';
        dot.hidden = true;
        const errors = document.createElement('span');
        errors.className = 'fb-tabs__errors';
        errors.hidden = true;
        errors.setAttribute('aria-hidden', 'true');
        // The state is the description of the tab, its name stays the visible "Fields 5".
        const state = document.createElement('span');
        state.className = 'fb-tabs__state';
        state.id = `${tab.id}-state`;
        state.hidden = true;
        tab.append(dot, errors, state);

        tab.addEventListener('click', () => this.select(index));
        heading?.classList.add('fb-visually-hidden');
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.dataset.fbPanel = title;

        return tab;
    }

    /** A link to another screen as a tab: it moves into the bar as it is. */
    linkTab(link) {
        link.classList.add('fb-tabs__tab');
        link.setAttribute('role', 'tab');
        link.setAttribute('aria-selected', 'false');

        // A link is not a button: Space follows it like Enter.
        link.addEventListener('keydown', (event) => {
            if (event.key === ' ') {
                event.preventDefault();
                link.click();
            }
        });

        if (!link.querySelector('.fb-tabs__count')) {
            this.count(link, link);
        }

        return link;
    }

    /** The number of data-count on a tab, e.g. the fields of a form. */
    count(tab, source) {
        if (source.dataset.count === undefined || source.dataset.count === '') {
            return;
        }

        const number = document.createElement('span');
        number.className = 'fb-tabs__count';
        number.textContent = source.dataset.count;
        tab.append(number);
    }

    /** Opens a part by its index; focus moves to its tab when asked. */
    select(index, { focus = false, address = true } = {}) {
        const current = this.panels[index];

        if (!current) {
            return;
        }

        this.tabs.forEach((tab, i) => {
            const selected = i === index;
            tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            tab.tabIndex = selected ? 0 : -1;

            if (this.panels[i]) {
                this.panels[i].hidden = !selected;
            }
        });

        const tab = this.tabs[index];
        // Only the bar scrolls sideways, never the page.
        this.bar.scrollLeft = Math.max(0, Math.min(this.bar.scrollLeft, tab.offsetLeft), tab.offsetLeft + tab.offsetWidth - this.bar.clientWidth);

        if (focus) {
            tab.focus();
        }

        if (address && window.location.hash !== '#' + current.id) {
            window.history.replaceState(window.history.state, '', '#' + current.id);
        }

        for (const link of document.querySelectorAll('a[data-fb-keeps-tab]')) {
            link.href = link.href.split('#')[0] + '#' + current.id;
        }

        this.dispatchEvent(new CustomEvent('fb-tab-change', { detail: { id: current.id }, bubbles: true }));
    }

    onKey(event) {
        const current = this.tabs.indexOf(event.target);

        if (current < 0 || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        const backwards = getComputedStyle(this).direction === 'rtl' ? 1 : -1;
        const next = {
            ArrowLeft: current + backwards,
            ArrowRight: current - backwards,
            Home: 0,
            End: this.tabs.length - 1,
        }[event.key];

        if (next === undefined) {
            return;
        }

        event.preventDefault();
        const index = (next + this.tabs.length) % this.tabs.length;

        // On a link only the focus moves, Enter follows it.
        if (this.panels[index]) {
            this.select(index, { focus: true });
        } else {
            this.tabs[index].focus();
        }
    }

    onReveal(event) {
        const index = this.panels.findIndex((panel) => panel?.contains(event.target));

        if (index >= 0 && this.panels[index].hidden) {
            this.select(index);
        }
    }

    scheduleMarks() {
        if (this.pending) {
            return;
        }

        this.pending = true;
        queueMicrotask(() => {
            this.pending = false;
            this.marks();
        });
    }

    /** The dot for unsaved changes and the number of errors on each tab. */
    marks() {
        this.panels.forEach((panel, index) => {
            if (!panel) {
                return;
            }

            const tab = this.tabs[index];
            const errors = panel.querySelectorAll('[aria-invalid="true"]').length;
            const changed = errors === 0 && panel.querySelector('[data-fb-changed]') !== null;
            const badge = tab.querySelector('.fb-tabs__errors');
            const state = tab.querySelector('.fb-tabs__state');
            const text = errors > 0 ? this.errors.replace('{count}', String(errors)) : changed ? this.unsaved : '';
            badge.hidden = errors === 0;
            tab.querySelector('.fb-tabs__dot').hidden = !changed;
            tab.toggleAttribute('data-invalid', errors > 0);

            if (badge.textContent !== String(errors)) {
                badge.textContent = String(errors);
            }

            if (state.textContent !== text) {
                state.textContent = text;
            }

            if (text === '') {
                tab.removeAttribute('aria-describedby');
            } else if (tab.getAttribute('aria-describedby') !== state.id) {
                tab.setAttribute('aria-describedby', state.id);
            }
        });
    }
}

customElements.define('fb-tab-panels', TabPanels);
