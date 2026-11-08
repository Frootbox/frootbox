/**
 * The entries of list fields on the page (decision 0145). The core marks
 * fields, not entries, because the theme decides how an entry looks. An
 * entry is the largest element that holds its own fields and nothing
 * else that is marked; a chain of single children narrows it down, so a
 * lone <li> is the entry rather than its <ul>. Each one gets
 * data-fb-entry="items/1" for the bar.
 */

const BLOCK = '[data-fb-block]';
const MARKED = '[data-fb-field], [data-fb-block], fb-area[data-fb-area]';
const INDEX = /^\d+$/;

/** The block an element belongs to, null for the layout. */
export function ownerOf(element) {
    return element.parentElement?.closest(BLOCK) ?? null;
}

/** "items/1/title" → ["items/1"], nested "items/1/links/0/url" → ["items/1", "items/1/links/0"]. */
function entryPaths(path) {
    const segments = path.split('/');

    return segments.flatMap((segment, index) => (index > 0 && INDEX.test(segment) ? [segments.slice(0, index + 1).join('/')] : []));
}

function commonAncestor(elements) {
    let ancestor = elements[0];

    while (ancestor && !elements.every((element) => ancestor.contains(element))) {
        ancestor = ancestor.parentElement;
    }

    return ancestor;
}

function entryElement(fields, owner) {
    const own = new Set(fields);
    const foreign = (element) => [...element.querySelectorAll(MARKED)]
        .some((marked) => !own.has(marked) && !fields.some((field) => field.contains(marked)));
    let element = commonAncestor(fields);

    if (!element || element === owner || foreign(element)) {
        return null;
    }

    while (element.parentElement && element.parentElement !== owner && element.parentElement !== document.body && !foreign(element.parentElement)) {
        element = element.parentElement;
    }

    while (element.children.length === 1 && fields.every((field) => element.children[0].contains(field))) {
        element = element.children[0];
    }

    return element;
}

/** Marks the entries once, when editing starts. */
export function markEntries() {
    const groups = new Map();

    for (const field of document.querySelectorAll('[data-fb-field]:not([data-fb-site]):not([data-fb-object])')) {
        const owner = ownerOf(field);

        for (const path of entryPaths(field.dataset.fbField)) {
            const key = `${owner?.dataset.fbBlock ?? ''} ${path}`;
            const group = groups.get(key) ?? { owner, path, fields: [] };
            group.fields.push(field);
            groups.set(key, group);
        }
    }

    for (const { owner, path, fields } of groups.values()) {
        const element = entryElement(fields, owner);

        if (element && !element.hasAttribute('data-fb-entry')) {
            element.dataset.fbEntry = path;
        }
    }
}

/**
 * The entry around an element with what the bar needs: its block, the
 * path of its list, its position and its neighbours in that list.
 */
export function entryAt(target) {
    const element = target instanceof Element ? target.closest('[data-fb-entry]') : null;

    if (!element) {
        return null;
    }

    const owner = ownerOf(element);
    const path = element.dataset.fbEntry;
    const list = path.slice(0, path.lastIndexOf('/'));
    const index = Number(path.slice(path.lastIndexOf('/') + 1));
    const siblings = [...(owner ?? document).querySelectorAll('[data-fb-entry]')]
        .filter((other) => ownerOf(other) === owner && other.dataset.fbEntry.startsWith(list + '/') && INDEX.test(other.dataset.fbEntry.slice(list.length + 1)))
        .sort((a, b) => Number(a.dataset.fbEntry.slice(list.length + 1)) - Number(b.dataset.fbEntry.slice(list.length + 1)));

    return { element, owner, path, list, index, count: siblings.length, siblings };
}

/** Whether the entries of a list stand side by side, e.g. in a grid, for the arrows. */
export function sideBySide(entry) {
    const tops = entry.siblings.map((sibling) => sibling.getBoundingClientRect().top);

    return tops.some((top, index) => index > 0 && Math.abs(top - tops[index - 1]) < 4);
}

/** The fields of an entry in page order, without those of entries inside it. */
export function fieldsOf(entry) {
    return [...entry.element.querySelectorAll('[data-fb-field]'), ...(entry.element.matches('[data-fb-field]') ? [entry.element] : [])]
        .filter((field) => ownerOf(field) === entry.owner && field.dataset.fbField.startsWith(entry.path + '/'))
        .sort((a, b) => (a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}

/** Actions whose path may name entries by id (decision 0344). */
const BY_ID = new Set(['page.update-field', 'page.add-list-entry', 'page.move-list-entry', 'page.remove-list-entry', 'ai.field-write']);

/**
 * The path with the ids of the entries instead of their positions, from
 * data-fb-entries of the block (decision 0344): "items/1/title" becomes
 * "items/k3f9x2ab/title". So a change still meets its entry when another
 * one moved meanwhile. Entries without an id and fields of the layout
 * keep their position.
 */
export function pathWithIds(path, block) {
    const element = block ? document.querySelector(`${BLOCK}[data-fb-block="${CSS.escape(block)}"]`) : null;
    let entries = null;

    try {
        entries = JSON.parse(element?.dataset.fbEntries ?? 'null');
    } catch {
        return path;
    }

    if (!entries || typeof path !== 'string') {
        return path;
    }

    const segments = path.split('/');

    return segments.map((segment, index) => {
        if (index % 2 === 0 || !INDEX.test(segment)) {
            return segment;
        }

        const id = entries[segments.slice(0, index).join('/')]?.[Number(segment)];

        return typeof id === 'string' ? id : segment;
    }).join('/');
}

/** The input of an action with ids in its path, where the action takes them. */
export function inputWithIds(name, input) {
    return BY_ID.has(name) && input && typeof input.path === 'string' ? { ...input, path: pathWithIds(input.path, input.block) } : input;
}
