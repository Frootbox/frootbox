import { LitElement } from 'lit';
import { refresh, runAction } from './action.js';
import { showToast } from './toast.js';

/** Text for comparing: lower case, without accents, ß as ss. */
const fold = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replaceAll('ß', 'ss');

const ALERT = '<svg class="fb-icon fb-icon--small" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.5"/></svg>';

/**
 * <fb-tree>: a tree of links that can be rearranged (decision 0116). The
 * server renders it, the component adds moving with the mouse and the
 * keyboard:
 *
 *     <fb-tree id="page-tree" action="page.move" refresh="page-tree page-detail"
 *              moved="{title} is below {parent} now, place {position} of {count}.">
 *         <ul class="fb-tree">
 *             <li class="fb-tree__item" data-id="01J…" data-title="Home" data-fixed>
 *                 <div class="fb-tree__row">…<a class="fb-tree__link" href="…">…</a>…</div>
 *                 <ul class="fb-tree__group">…</ul>
 *             </li>
 *         </ul>
 *     </fb-tree>
 *
 * - action: runs with {id, parentId, position}; position is the place
 *   among the new siblings without the moved item, null for the last
 * - refresh: ids of elements to load again afterwards
 * - moved: the message afterwards, read out and shown as a toast
 * - data-fixed: the item stays where it is, e.g. the start page; others
 *   can only go into it
 * - movable: without action, items can be moved and each move fires
 *   "fb-tree-move" with detail {id, parentId, position}; the listener
 *   sets detail.result to a promise of {ok, problem} (see runAction)
 * - roots: items can stand at the top level, parentId is null there
 * - depth: the most levels, e.g. 2 for items with one level below
 * - data-leaf: the item takes no children
 * - <span class="fb-tree__link"> instead of a link: the row is only
 *   shown, e.g. a page above the own branch (decision 0118)
 * - data-collapsed and a <button class="fb-tree__toggle"> in the row: the
 *   branch is closed, the button opens and closes it (decision 0135)
 * - remember: a name under which this browser keeps which branches were
 *   opened or closed; the way to the current link always stays open
 * - data-terms: what <fb-tree-filter> finds an item by, else its title
 *
 * Keys on a link: arrow up and down go to the next link, Home and End to
 * the first and last. Arrow right opens a branch or goes into it, arrow
 * left closes it or goes to the parent. With Alt, up and down move the item among its
 * siblings, right makes it the last child of the item above, left moves
 * it one level up, after its parent. A click on a link marks it with
 * aria-current, htmx loads what it points to.
 */
export class Tree extends LitElement {
    static LINK = ':is(a, button).fb-tree__link';

    static properties = {
        action: {},
        refresh: {},
        moved: {},
        failed: {},
        movable: { type: Boolean },
        roots: { type: Boolean },
        depth: { type: Number },
        remember: {},
    };

    constructor() {
        super();
        this.action = '';
        this.refresh = '';
        this.moved = '{title}';
        this.movable = false;
        this.roots = false;
        this.depth = 0;
        this.remember = '';
        this.failed = document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
        this.dragged = null;
        this.busy = false;
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('keydown', this.onKeyDown);
        this.addEventListener('click', this.onClick);
        this.addEventListener('dragstart', this.onDragStart);
        this.addEventListener('dragover', this.onDragOver);
        this.addEventListener('dragleave', this.onDragLeave);
        this.addEventListener('drop', this.onDrop);
        this.addEventListener('dragend', this.onDragEnd);

        this.restore();

        // Loaded again while a search is on, e.g. after saving.
        const filter = document.querySelector(`fb-tree-filter[for="${CSS.escape(this.id || ' ')}"]`);

        if (filter?.query()) {
            filter.apply();
        } else {
            requestAnimationFrame(() => this.scrollBack());
        }

        if (this.canMove()) {
            for (const item of this.items()) {
                const row = item.querySelector(':scope > .fb-tree__row');

                if (row && !item.hasAttribute('data-fixed')) {
                    row.draggable = true;
                }

                row?.querySelector('.fb-tree__link')?.setAttribute('draggable', 'false');
            }
        }
    }

    disconnectedCallback() {
        if (this.id) {
            Tree.scrolls.set(this.id, this.scrollTop);
        }

        for (const [type, listener] of [['keydown', this.onKeyDown], ['click', this.onClick], ['dragstart', this.onDragStart], ['dragover', this.onDragOver], ['dragleave', this.onDragLeave], ['drop', this.onDrop], ['dragend', this.onDragEnd]]) {
            this.removeEventListener(type, listener);
        }

        super.disconnectedCallback();
    }

    canMove() {
        return (Boolean(this.action) || this.hasAttribute('movable')) && !this.hasAttribute('data-filtering');
    }

    items() {
        return [...this.querySelectorAll('.fb-tree__item')];
    }

    /** Links and buttons that are shown; a span is a row that cannot be opened, e.g. outside the own pages. */
    links() {
        return [...this.querySelectorAll(Tree.LINK)].filter((link) => !link.closest('.fb-tree__item[data-collapsed] > .fb-tree__group, .fb-tree__item[hidden]'));
    }

    /**
     * Shows only the items whose terms hold every word of the query, with
     * the way to them (decision 0136). Moving is off meanwhile. Returns
     * the number of items found, null for an empty query, which shows the
     * tree as before.
     */
    filter(query) {
        const words = fold(query).split(/\s+/).filter((word) => word !== '');
        const items = this.items();

        if (words.length === 0) {
            if (this.hasAttribute('data-filtering')) {
                for (const item of items) {
                    item.hidden = false;
                    item.removeAttribute('data-match');
                    Tree.mark(item, []);
                }

                this.removeAttribute('data-filtering');
                this.restore(this.before ?? {});
                this.scrollToCurrent();
            }

            return null;
        }

        if (!this.hasAttribute('data-filtering')) {
            this.before = Object.fromEntries(items.map((item) => [item.dataset.id, !item.hasAttribute('data-collapsed')]));
            this.setAttribute('data-filtering', '');
        }

        let found = 0;

        // Children first, so a parent knows whether one of them is shown.
        for (const item of items.reverse()) {
            const match = words.every((word) => fold(item.dataset.terms ?? item.dataset.title ?? '').includes(word));
            const below = Tree.children(item.querySelector(':scope > .fb-tree__group')).some((child) => !child.hidden);
            item.hidden = !match && !below;
            item.toggleAttribute('data-match', match);
            item.toggleAttribute('data-collapsed', item.querySelector(':scope > .fb-tree__group') !== null && !below);
            item.querySelector(':scope > .fb-tree__row > button.fb-tree__toggle')?.setAttribute('aria-expanded', String(below));
            Tree.mark(item, match ? words : []);
            found += match ? 1 : 0;
        }

        this.scrollTop = 0;

        return found;
    }

    /** Marks the words in the title of an item. */
    static mark(item, words) {
        const title = item.querySelector(':scope > .fb-tree__row .fb-tree__title');

        if (!title) {
            return;
        }

        const text = item.dataset.title ?? title.textContent;
        // The folded text with the place in the text of each of its characters.
        let folded = '';
        const places = [];

        for (const [index, character] of [...text].entries()) {
            for (const part of fold(character)) {
                folded += part;
                places.push(index);
            }
        }

        const characters = [...text];
        const marked = new Array(characters.length).fill(false);

        for (const word of words) {
            const start = folded.indexOf(word);

            for (let place = start; start >= 0 && place < start + word.length; place++) {
                marked[places[place]] = true;
            }
        }

        title.replaceChildren();
        let run = '';
        let inMark = false;
        const flush = () => {
            if (run === '') {
                return;
            }

            if (inMark) {
                const mark = document.createElement('mark');
                mark.className = 'fb-tree__mark';
                mark.textContent = run;
                title.append(mark);
            } else {
                title.append(run);
            }

            run = '';
        };

        for (const [index, character] of characters.entries()) {
            if (marked[index] !== inMark) {
                flush();
                inMark = marked[index];
            }

            run += character;
        }

        flush();
    }

    /** Opens or closes the branch of an item, true to open. */
    toggle(item, open) {
        const button = item.querySelector(':scope > .fb-tree__row > button.fb-tree__toggle');

        if (!button) {
            return;
        }

        item.toggleAttribute('data-collapsed', !open);
        button.setAttribute('aria-expanded', String(open));
        this.store({ [item.dataset.id]: open });
    }

    /** Opens the branches above an item, e.g. the current page or one just moved. */
    reveal(item) {
        for (let parent = Tree.parentItem(item); parent; parent = Tree.parentItem(parent)) {
            if (parent.hasAttribute('data-collapsed')) {
                this.toggle(parent, true);
            }
        }
    }

    /** What this browser keeps for the tree: open or closed by id. */
    stored() {
        try {
            const value = JSON.parse(localStorage.getItem(`fb-tree:${this.remember}`) ?? '{}');

            return value && typeof value === 'object' ? value : {};
        } catch {
            return {};
        }
    }

    store(changes) {
        if (!this.remember) {
            return;
        }

        try {
            localStorage.setItem(`fb-tree:${this.remember}`, JSON.stringify({ ...this.stored(), ...changes }));
        } catch {
            // Without storage the tree only forgets.
        }
    }

    /** Opens and closes branches as last time (or as given), keeping the way to the current link open. */
    restore(state = null) {
        if (!this.remember && !state) {
            return;
        }

        const stored = state ?? this.stored();

        for (const item of this.items()) {
            const button = item.querySelector(':scope > .fb-tree__row > button.fb-tree__toggle');

            if (button && typeof stored[item.dataset.id] === 'boolean') {
                item.toggleAttribute('data-collapsed', !stored[item.dataset.id]);
                button.setAttribute('aria-expanded', String(stored[item.dataset.id]));
            }
        }

        const current = this.querySelector('.fb-tree__link[aria-current]')?.closest('.fb-tree__item');

        for (let parent = current && Tree.parentItem(current); parent; parent = Tree.parentItem(parent)) {
            parent.removeAttribute('data-collapsed');
            parent.querySelector(':scope > .fb-tree__row > button.fb-tree__toggle')?.setAttribute('aria-expanded', 'true');
        }
    }

    onClick(event) {
        const toggle = event.target.closest?.('button.fb-tree__toggle');

        if (toggle) {
            const item = toggle.closest('.fb-tree__item');
            this.toggle(item, item.hasAttribute('data-collapsed'));

            return;
        }

        const link = event.target.closest?.(Tree.LINK);

        if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            return;
        }

        for (const other of this.links()) {
            other.removeAttribute('aria-current');
        }

        link.setAttribute('aria-current', 'page');
    }

    onKeyDown(event) {
        const link = event.target.closest?.('.fb-tree__link');

        if (!link) {
            return;
        }

        const item = link.closest('.fb-tree__item');
        const links = this.links();
        const index = links.indexOf(link);

        if (!event.altKey) {
            const branch = item.querySelector(':scope > .fb-tree__row > button.fb-tree__toggle') !== null;
            const closed = item.hasAttribute('data-collapsed');

            if (event.key === 'ArrowRight' && branch) {
                event.preventDefault();

                if (closed) {
                    this.toggle(item, true);
                } else {
                    links[index + 1]?.focus();
                }

                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();

                if (branch && !closed) {
                    this.toggle(item, false);
                } else {
                    Tree.parentItem(item)?.querySelector(`:scope > .fb-tree__row ${Tree.LINK}`)?.focus();
                }

                return;
            }

            // Up from the first link goes back to the search, if there is one.
            if (event.key === 'ArrowUp' && index === 0) {
                const search = document.querySelector(`fb-tree-filter[for="${CSS.escape(this.id || ' ')}"] input`);

                if (search) {
                    event.preventDefault();
                    search.focus();

                    return;
                }
            }

            const target = { ArrowDown: links[index + 1], ArrowUp: links[index - 1], Home: links[0], End: links.at(-1) }[event.key];

            if (target) {
                event.preventDefault();
                target.focus();
            }

            return;
        }

        if (!this.canMove() || item.hasAttribute('data-fixed') || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            return;
        }

        event.preventDefault();
        const siblings = Tree.children(item.parentElement);
        const place = siblings.indexOf(item);
        const parent = Tree.parentItem(item);

        let target = null;

        if (event.key === 'ArrowUp' && place > 0) {
            target = { parent, position: place - 1 };
        } else if (event.key === 'ArrowDown' && place < siblings.length - 1) {
            target = { parent, position: place + 1 };
        } else if (event.key === 'ArrowRight' && place > 0) {
            target = { parent: siblings[place - 1], position: null };
        } else if (event.key === 'ArrowLeft' && parent && (this.roots || Tree.parentItem(parent))) {
            target = { parent: Tree.parentItem(parent), position: Tree.children(parent.parentElement).indexOf(parent) + 1 };
        }

        if (target && this.fits(item, target.parent)) {
            this.move(item, target.parent, target.position);
        }
    }

    onDragStart(event) {
        const item = event.target.closest?.('.fb-tree__item');

        if (!item || item.hasAttribute('data-fixed') || this.busy || !this.canMove()) {
            event.preventDefault();

            return;
        }

        this.dragged = item;
        item.dataset.dragging = '';
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.dataset.title ?? '');
    }

    onDragOver(event) {
        const drop = this.dropAt(event);
        this.clearDrop();

        if (!drop) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        drop.row.dataset.drop = drop.where;
    }

    onDragLeave(event) {
        if (!this.contains(event.relatedTarget)) {
            this.clearDrop();
        }
    }

    onDrop(event) {
        const drop = this.dropAt(event);
        const item = this.dragged;
        this.clearDrop();

        if (!drop || !item) {
            return;
        }

        event.preventDefault();

        if (drop.where === 'inside') {
            this.move(item, drop.item, null);

            return;
        }

        const siblings = Tree.children(drop.item.parentElement).filter((sibling) => sibling !== item);
        const place = siblings.indexOf(drop.item) + (drop.where === 'after' ? 1 : 0);
        this.move(item, Tree.parentItem(drop.item), place);
    }

    onDragEnd() {
        this.clearDrop();
        delete this.dragged?.dataset.dragging;
        this.dragged = null;
    }

    /** Where the dragged item would land: before, after or inside a row. */
    dropAt(event) {
        const row = event.target.closest?.('.fb-tree__row');
        const item = row?.closest('.fb-tree__item');

        if (!this.dragged || !item || this.dragged.contains(item)) {
            return null;
        }

        const box = row.getBoundingClientRect();
        const share = (event.clientY - box.top) / box.height;
        let where = share < 0.25 ? 'before' : share > 0.75 ? 'after' : 'inside';

        if (item.hasAttribute('data-fixed') || (!this.roots && !Tree.parentItem(item))) {
            where = 'inside';
        }

        // Where the item does not fit inside, it goes next to the row.
        if (where === 'inside' && !this.fits(this.dragged, item)) {
            where = share < 0.5 ? 'before' : 'after';
        }

        if (where !== 'inside' && ((!this.roots && !Tree.parentItem(item)) || !this.fits(this.dragged, Tree.parentItem(item)))) {
            return null;
        }

        return { row, item, where };
    }

    clearDrop() {
        for (const row of this.querySelectorAll('[data-drop]')) {
            delete row.dataset.drop;
        }
    }

    /** Whether the item with its children fits below this parent (null: the top level). */
    fits(item, parent) {
        if (parent === null) {
            return this.roots;
        }

        if (parent.hasAttribute('data-leaf') || item === parent || item.contains(parent)) {
            return false;
        }

        if (!this.depth) {
            return true;
        }

        return Tree.level(parent) + Tree.height(item) <= this.depth;
    }

    async move(item, parent, position) {
        if (this.busy || (!parent && !this.roots)) {
            return;
        }

        this.busy = true;
        this.setAttribute('aria-busy', 'true');
        const id = item.dataset.id;
        const input = { id, parentId: parent?.dataset.id ?? null, position };
        let result;

        if (this.action) {
            result = await runAction(this.action, input, this.failed);
        } else {
            const request = new CustomEvent('fb-tree-move', { detail: { ...input, result: null }, bubbles: true });
            this.dispatchEvent(request);
            result = await (request.detail.result ?? { ok: false, problem: { detail: this.failed, errors: [] } });
        }

        if (!result.ok) {
            this.busy = false;
            this.removeAttribute('aria-busy');
            this.showError(result.problem);

            return;
        }

        const ids = this.refresh.split(/\s+/).filter((name) => name !== '');
        const tree = ids.length && await refresh(ids) ? document.getElementById(this.id) : this;
        const moved = tree?.querySelector(`.fb-tree__item[data-id="${CSS.escape(id)}"]`);

        if (!moved) {
            return;
        }

        (tree === this ? this : tree).reveal?.(moved);
        moved.querySelector(':scope > .fb-tree__row .fb-tree__link')?.focus();
        const newParent = Tree.parentItem(moved);
        const siblings = Tree.children(moved.parentElement);

        showToast(this.moved
            .replaceAll('{title}', moved.dataset.title ?? '')
            .replaceAll('{parent}', newParent?.dataset.title ?? '')
            .replaceAll('{position}', String(siblings.indexOf(moved) + 1))
            .replaceAll('{count}', String(siblings.length)));

        if (tree === this) {
            this.busy = false;
            this.removeAttribute('aria-busy');
        }
    }

    showError(problem) {
        this.querySelector(':scope > .fb-alert')?.remove();
        const alert = document.createElement('div');
        alert.className = 'fb-alert';
        alert.dataset.tone = 'danger';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = ALERT;
        const text = document.createElement('p');
        text.textContent = [problem.detail, ...problem.errors.map((error) => error.message)].join(' ');
        alert.append(text);
        this.prepend(alert);
    }

    /** Where a tree was scrolled to before it was loaded again, by id. */
    static scrolls = new Map();

    /**
     * A tree that scrolls by itself (e.g. the sitemap beside the details)
     * keeps its place when it is loaded again, else shows the current link.
     */
    scrollBack() {
        if (this.scrollHeight <= this.clientHeight) {
            return;
        }

        if (Tree.scrolls.has(this.id)) {
            this.scrollTop = Tree.scrolls.get(this.id);

            return;
        }

        this.scrollToCurrent();
    }

    /** Scrolls the current link into the middle, if the tree scrolls by itself. */
    scrollToCurrent() {
        const row = this.querySelector('.fb-tree__link[aria-current]')?.closest('.fb-tree__row');

        if (row && this.scrollHeight > this.clientHeight) {
            this.scrollTop += row.getBoundingClientRect().top - this.getBoundingClientRect().top - (this.clientHeight - row.offsetHeight) / 2;
        }
    }

    static children(group) {
        return [...(group?.children ?? [])].filter((child) => child.classList.contains('fb-tree__item'));
    }

    static parentItem(item) {
        return item.parentElement?.closest('.fb-tree__item') ?? null;
    }

    /** 1 for an item at the top level, 2 below it and so on. */
    static level(item) {
        let level = 0;

        for (let current = item; current; current = Tree.parentItem(current)) {
            level++;
        }

        return level;
    }

    /** Levels of the item with its children: 1 without children. */
    static height(item) {
        const children = Tree.children(item.querySelector(':scope > .fb-tree__group'));

        return 1 + Math.max(0, ...children.map((child) => Tree.height(child)));
    }
}

customElements.define('fb-tree', Tree);

/**
 * <fb-tree-filter for="page-tree">: a search field for a tree (decision
 * 0136), around a label, an input and a role="status" for the result:
 *
 *     <fb-tree-filter for="page-tree" found="{count} pages found" one="One page found" empty="No page found">
 *
 * Typing filters the tree. Arrow down goes to the first hit, Enter opens
 * it, Escape empties the field. "/" anywhere else puts the focus here.
 */
export class TreeFilter extends HTMLElement {
    connectedCallback() {
        this.input = this.querySelector('input');
        this.status = this.querySelector('[role="status"]');
        this.onInput = () => this.apply();
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onShortcut = this.onShortcut.bind(this);
        this.input?.addEventListener('input', this.onInput);
        this.input?.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keydown', this.onShortcut);
    }

    disconnectedCallback() {
        this.input?.removeEventListener('input', this.onInput);
        this.input?.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keydown', this.onShortcut);
    }

    tree() {
        return document.getElementById(this.getAttribute('for') ?? '');
    }

    query() {
        return this.input?.value.trim() ?? '';
    }

    apply() {
        const found = this.tree()?.filter?.(this.query()) ?? null;

        if (this.status) {
            this.status.textContent = found === null ? '' : found === 0
                ? (this.getAttribute('empty') ?? '')
                : found === 1 ? (this.getAttribute('one') ?? '1') : (this.getAttribute('found') ?? '{count}').replaceAll('{count}', String(found));
        }
    }

    first() {
        return this.tree()?.querySelector(`.fb-tree__item[data-match]:not([hidden]) > .fb-tree__row ${Tree.LINK}`) ?? null;
    }

    onKeyDown(event) {
        if (event.key === 'Escape' && this.input.value !== '') {
            event.preventDefault();
            this.input.value = '';
            this.apply();
        } else if (event.key === 'ArrowDown' && this.first()) {
            event.preventDefault();
            this.first().focus();
        } else if (event.key === 'Enter' && this.first()) {
            event.preventDefault();
            this.first().focus();
            this.first().click();
        }
    }

    onShortcut(event) {
        const target = event.target;

        if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || target.closest?.('input, textarea, select, [contenteditable]')) {
            return;
        }

        event.preventDefault();
        this.input?.focus();
        this.input?.select();
    }
}

customElements.define('fb-tree-filter', TreeFilter);
