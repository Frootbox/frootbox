import { LitElement } from 'lit';
import { refresh, runAction } from './action.js';
import { showToast } from './toast.js';

/** The fields of each type besides label, newWindow, options and children (decision 0106). */
const FIELDS = {
    target: ['target'],
    url: ['url'],
    anchor: ['anchor', 'target'],
    phone: ['phone'],
    email: ['email'],
    heading: [],
    pages: ['target', 'depth'],
};

/**
 * <fb-navigation>: the items of a navigation in one language (decision
 * 0116). It holds them as JSON and saves them all at once with
 * navigation.update, then loads the elements in `refresh` again:
 *
 *     <fb-navigation name="main" language="de" refresh="navigation-detail" removed="Removed."
 *                    items='[{"id": "a1b2c3d4", "type": "target", …}]'>
 *         <fb-tree movable roots depth="2">…</fb-tree>
 *         <dialog id="navigation-item"><fb-form action="navigation.update">
 *             <form>… <input type="hidden" name="_path"> …</form></fb-form></dialog>
 *     </fb-navigation>
 *
 * - Moves in the <fb-tree> inside (items with data-id) are saved at once.
 * - The form in the dialog edits one item: _path is its place, e.g. "2.0"
 *   for the first child of the third item, empty for a new item at the
 *   end. Fields with data-types="url anchor" show only for these types.
 * - A button with data-navigation-remove in it removes the item.
 */
export class Navigation extends LitElement {
    static properties = {
        name: {},
        language: {},
        refresh: {},
        removed: {},
        failed: {},
    };

    constructor() {
        super();
        this.name = '';
        this.language = '';
        this.refresh = '';
        this.removed = '';
        this.failed = document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
        this.onMove = this.onMove.bind(this);
        this.onInput = this.onInput.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('fb-tree-move', this.onMove);
        this.addEventListener('fb-form-input', this.onInput);
        this.addEventListener('click', this.onClick);
        this.addEventListener('change', this.onChange);
        this.updateType();
    }

    disconnectedCallback() {
        this.removeEventListener('fb-tree-move', this.onMove);
        this.removeEventListener('fb-form-input', this.onInput);
        this.removeEventListener('click', this.onClick);
        this.removeEventListener('change', this.onChange);
        super.disconnectedCallback();
    }

    /** A copy of the items, so a failed save changes nothing. */
    items() {
        try {
            const items = JSON.parse(this.getAttribute('items') ?? '[]');

            return Array.isArray(items) ? items : [];
        } catch {
            return [];
        }
    }

    get form() {
        return this.querySelector('dialog form');
    }

    /** The place of the item being edited, [] for a new one. */
    path() {
        const value = this.form?.elements.namedItem('_path')?.value ?? '';

        return value === '' ? [] : value.split('.').map(Number);
    }

    onMove(event) {
        const items = this.items();
        const found = Navigation.find(items, (item) => item.id === event.detail.id);

        if (!found) {
            return;
        }

        found.list.splice(found.index, 1);
        const parent = event.detail.parentId === null ? null : Navigation.find(items, (item) => item.id === event.detail.parentId);
        const list = parent ? (parent.item.children ??= []) : items;
        list.splice(event.detail.position ?? list.length, 0, found.item);
        event.detail.result = this.save(items);
    }

    onInput(event) {
        const form = event.target.querySelector?.('form');

        if (form !== this.form) {
            return;
        }

        const items = this.items();
        const path = this.path();
        const old = path.length ? Navigation.at(items, path) : null;
        const item = Navigation.item(event.detail.input, old);

        if (old) {
            const list = path.length > 1 ? Navigation.at(items, path.slice(0, -1)).children : items;
            list[path.at(-1)] = item;
        } else {
            items.push(item);
        }

        const place = old ? path : [items.length - 1];
        event.target.base = '/items/' + this.language + place.map((index, level) => (level ? '/children/' : '/') + index).join('');
        event.detail.input = this.input(items);
    }

    async onClick(event) {
        const target = event.target instanceof Element ? event.target : null;

        // fill.js fills the dialog after this listener, the fields follow the type then.
        if (target?.closest('[data-fb-fill]')) {
            setTimeout(() => this.updateType());
        }

        const remove = target?.closest('[data-navigation-remove]');

        if (!remove || remove.disabled) {
            return;
        }

        const items = this.items();
        const path = this.path();

        if (!path.length) {
            return;
        }

        const list = path.length > 1 ? Navigation.at(items, path.slice(0, -1)).children : items;
        list.splice(path.at(-1), 1);
        remove.disabled = true;
        const result = await this.save(items);
        remove.disabled = false;

        if (!result.ok) {
            this.querySelector('dialog fb-form')?.showProblem?.(result.problem);

            return;
        }

        this.querySelector('dialog')?.close();
        await refresh(this.refreshIds());

        if (this.removed) {
            showToast(this.removed);
        }
    }

    onChange(event) {
        if (event.target instanceof HTMLSelectElement && event.target.name === 'type') {
            this.updateType();
        }
    }

    /** Shows the fields of the chosen type and the remove button for items that exist. */
    updateType() {
        const form = this.form;

        if (!form) {
            return;
        }

        const type = form.elements.namedItem('type')?.value ?? '';

        for (const field of form.querySelectorAll('[data-types]')) {
            const shown = field.dataset.types.split(/\s+/).includes(type);
            field.hidden = !shown;

            for (const control of field.querySelectorAll('input, select, textarea')) {
                control.disabled = !shown;
            }
        }

        for (const button of this.querySelectorAll('[data-navigation-remove]')) {
            button.hidden = this.path().length === 0;
        }
    }

    save(items) {
        return runAction('navigation.update', this.input(items), this.failed);
    }

    input(items) {
        return { name: this.name, items: { [this.language]: items } };
    }

    refreshIds() {
        return this.refresh.split(/\s+/).filter((id) => id !== '');
    }

    /** The item from the fields of the form, keeping id, options and children of the old one. */
    static item(input, old) {
        const type = input.type;
        const item = { type };

        if (old?.id) {
            item.id = old.id;
        }

        for (const field of FIELDS[type] ?? []) {
            if (input[field] !== undefined && input[field] !== '' && input[field] !== null) {
                item[field] = input[field];
            }
        }

        if (typeof input.label === 'string' && input.label.trim() !== '') {
            item.label = input.label;
        }

        if (input.newWindow === true) {
            item.newWindow = true;
        }

        if (old?.options) {
            item.options = old.options;
        }

        if (old?.children?.length && type !== 'pages') {
            item.children = old.children;
        }

        return item;
    }

    static at(items, path) {
        return path.reduce((item, index, level) => (level ? item?.children?.[index] : items[index]), null);
    }

    /** The first item that matches, with the list it is in and its index there. */
    static find(list, match) {
        for (const [index, item] of list.entries()) {
            if (match(item)) {
                return { item, list, index };
            }

            const found = Navigation.find(item.children ?? [], match);

            if (found) {
                return found;
            }
        }

        return null;
    }
}

customElements.define('fb-navigation', Navigation);
