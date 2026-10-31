import { LitElement } from 'lit';
import { refresh, runAction } from './action.js';
import { showToast } from './toast.js';

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
 *
 * Keys on a link: arrow up and down go to the next link, Home and End to
 * the first and last. With Alt, up and down move the item among its
 * siblings, right makes it the last child of the item above, left moves
 * it one level up, after its parent. A click on a link marks it with
 * aria-current, htmx loads what it points to.
 */
export class Tree extends LitElement {
    static properties = {
        action: {},
        refresh: {},
        moved: {},
        failed: {},
        movable: { type: Boolean },
        roots: { type: Boolean },
        depth: { type: Number },
    };

    constructor() {
        super();
        this.action = '';
        this.refresh = '';
        this.moved = '{title}';
        this.movable = false;
        this.roots = false;
        this.depth = 0;
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
        for (const [type, listener] of [['keydown', this.onKeyDown], ['click', this.onClick], ['dragstart', this.onDragStart], ['dragover', this.onDragOver], ['dragleave', this.onDragLeave], ['drop', this.onDrop], ['dragend', this.onDragEnd]]) {
            this.removeEventListener(type, listener);
        }

        super.disconnectedCallback();
    }

    canMove() {
        return Boolean(this.action) || this.hasAttribute('movable');
    }

    items() {
        return [...this.querySelectorAll('.fb-tree__item')];
    }

    links() {
        return [...this.querySelectorAll('.fb-tree__link')];
    }

    onClick(event) {
        const link = event.target.closest?.('.fb-tree__link');

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

        if (!item || item.hasAttribute('data-fixed') || this.busy) {
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
