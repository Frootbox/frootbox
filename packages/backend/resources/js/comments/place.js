// Where a comment is (decision 0156): the field or block an element belongs
// to, read from the marks of the editing mode or the light marks of a
// preview, and back from a thread to its element on the page. On the
// design page an element of it instead (decision 0210). Where nothing is
// marked, the landmark of the page, and in any place the point that was
// clicked (decision 0211).

/** A comment on all of the design page. */
export const WHOLE_DESIGN_PAGE = 'page';

const MAX_EXCERPT = 300;

const MAX_NAME = 200;

/** Points are thousandths of the width and height of the place. */
const SCALE = 1000;

const ROLES = ['banner', 'contentinfo', 'navigation', 'complementary', 'main'];

const LANDMARKS = 'header, footer, nav, aside, main, [role]';

// A header or footer inside these belongs to them and is no landmark.
const SECTIONING = 'article, aside, main, nav, section, [role="article"], [role="complementary"], [role="main"], [role="navigation"], [role="region"]';

const NOWHERE = { blockId: null, field: null, site: false, landmark: null, label: null, excerpt: null, element: null, pointX: null, pointY: null };

/**
 * The place of an element the user clicked: the field it is in, else the
 * block, else the landmark, else the page. With the click event also the
 * point in it; with the labels of comments a name for a landmark.
 */
export function placeOf(element, { event = null, labels = {} } = {}) {
    const design = element.closest('[data-fb-design]');

    if (design) {
        return { ...NOWHERE, design: design.dataset.fbDesign, label: design.dataset.fbTitle ?? null, excerpt: excerptAt(element, design), element: design, ...pointIn(design, event) };
    }

    const field = element.closest('[data-fb-field]');
    const block = (field ?? element).closest('[data-fb-block]');
    const target = field ?? block;

    if (target) {
        return {
            ...NOWHERE,
            blockId: block?.dataset.fbBlock ?? null,
            field: field?.dataset.fbField ?? null,
            site: field?.hasAttribute('data-fb-site') ?? false,
            label: field?.dataset.fbLabel ?? block?.dataset.fbTitle ?? null,
            excerpt: field ? excerptOf(field) : excerptAt(element, block),
            element: target,
            ...pointIn(target, event),
        };
    }

    const landmark = landmarks(element.ownerDocument).find((entry) => entry.element === landmarkOf(element));

    if (landmark) {
        return { ...NOWHERE, landmark: keyOf(landmark), label: landmarkLabel(landmark, labels), excerpt: excerptAt(element, landmark.element), element: landmark.element, ...pointIn(landmark.element, event) };
    }

    return { ...NOWHERE };
}

/**
 * The element of a thread on this page, null if the place is gone: then
 * the comment counts for the page.
 */
export function elementOf(thread, root = document) {
    if (thread.design && thread.design !== WHOLE_DESIGN_PAGE) {
        return root.querySelector(`[data-fb-design="${CSS.escape(thread.design)}"]`);
    }

    return markedOf(thread, root) ?? (thread.landmark ? findLandmark(thread.landmark, root) : null);
}

function markedOf(thread, root) {
    const field = thread.field ? `[data-fb-field="${CSS.escape(thread.field)}"]` : null;

    if (thread.site && field) {
        return root.querySelector(`[data-fb-site]${field}`);
    }

    if (thread.blockId) {
        const block = root.querySelector(`[data-fb-block="${CSS.escape(thread.blockId)}"]`);

        // A field moved away or emptied: the block still is the place.
        return (field ? block?.querySelector(field) : null) ?? block;
    }

    // A field of the page outside of blocks, e.g. the main heading.
    return field ? [...root.querySelectorAll(field)].find((element) => !element.closest('[data-fb-block]') && !element.hasAttribute('data-fb-site')) ?? null : null;
}

/**
 * Where the pin of a thread goes, measured from the top left of the
 * viewport: its point in the element, or without one the corner at the
 * end of the first line. A pin points with its lower start corner at a
 * point and sits centred on a corner.
 */
export function pinAt(thread, element) {
    const rect = element.getBoundingClientRect();
    const rtl = 'rtl' === getComputedStyle(element).direction;

    if (null === (thread.pointX ?? null) || null === (thread.pointY ?? null)) {
        return { x: rtl ? rect.left : rect.right, y: rect.top, rect, point: false };
    }

    const fromStart = (thread.pointX / SCALE) * rect.width;

    return { x: rtl ? rect.right - fromStart : rect.left + fromStart, y: rect.top + (thread.pointY / SCALE) * rect.height, rect, point: true };
}

/**
 * The text of an element in one line, at most 300 characters.
 */
export function excerptOf(element) {
    const text = (element.innerText ?? element.textContent ?? '').replace(/\s+/g, ' ').trim();

    return '' === text ? null : text.slice(0, MAX_EXCERPT);
}

/**
 * Whether an element belongs to the page rather than to Frootbox, e.g.
 * not the editor bar or the note of the preview.
 */
export function isContent(element) {
    return element instanceof Element && !element.closest('fb-editor-bar, fb-preview-note');
}

/** The text where it was clicked, e.g. a button, else of the whole place. */
function excerptAt(element, place) {
    const image = element.closest('img');

    return (image?.alt ? image.alt.slice(0, MAX_EXCERPT) : null) ?? excerptOf(element) ?? excerptOf(place);
}

/** The point of a click in an element, from its start edge; none from the keyboard. */
function pointIn(element, event) {
    const rect = element.getBoundingClientRect();

    if (!event || (0 === event.detail && 0 === event.clientX && 0 === event.clientY) || 0 === rect.width || 0 === rect.height) {
        return { pointX: null, pointY: null };
    }

    const fromLeft = (event.clientX - rect.left) / rect.width;
    const x = 'rtl' === getComputedStyle(element).direction ? 1 - fromLeft : fromLeft;
    const scaled = (value) => Math.min(SCALE, Math.max(0, Math.round(value * SCALE)));

    return { pointX: scaled(x), pointY: scaled((event.clientY - rect.top) / rect.height) };
}

// Landmarks: the kind, its number among those of the kind and its name.

function kindOf(element) {
    const role = element.getAttribute('role');

    if (role) {
        return ROLES.includes(role) ? role : null;
    }

    switch (element.localName) {
        case 'nav':
            return 'navigation';
        case 'aside':
            return 'complementary';
        case 'main':
            return 'main';
        case 'header':
        case 'footer':
            return element.parentElement?.closest(SECTIONING) ? null : ('header' === element.localName ? 'banner' : 'contentinfo');
        default:
            return null;
    }
}

function nameOf(element) {
    const labelled = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean).map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '').join(' ');
    const name = (element.getAttribute('aria-label') || labelled).replace(/\s+/g, ' ').trim();

    return '' === name ? null : name.slice(0, MAX_NAME);
}

/** The innermost landmark around an element. */
function landmarkOf(element) {
    for (let current = element; current; current = current.parentElement) {
        if (kindOf(current)) {
            return current;
        }
    }

    return null;
}

/** The landmarks of the page in their order, without those of Frootbox. */
function landmarks(root) {
    const counts = {};

    return [...root.querySelectorAll(LANDMARKS)].filter((element) => isContent(element) && kindOf(element)).map((element) => {
        const kind = kindOf(element);
        counts[kind] = (counts[kind] ?? 0) + 1;

        return { element, kind, number: counts[kind], name: nameOf(element) };
    });
}

/** E.g. "banner#1" or "navigation#2:Footer". */
function keyOf(landmark) {
    return `${landmark.kind}#${landmark.number}${landmark.name ? `:${landmark.name}` : ''}`;
}

/**
 * The landmark of a key: by kind and name first, so a reordered page
 * keeps it, then by kind and number, so a translated name keeps it.
 */
function findLandmark(key, root) {
    const match = /^([a-z]+)#(\d+)(?::(.+))?$/s.exec(key);

    if (!match) {
        return null;
    }

    const [, kind, number, name] = match;
    const all = landmarks(root).filter((entry) => entry.kind === kind);

    return (name ? all.find((entry) => entry.name === name) : null)?.element ?? all.find((entry) => entry.number === Number(number))?.element ?? null;
}

function landmarkLabel(landmark, labels) {
    const kind = labels[`landmark${landmark.kind[0].toUpperCase()}${landmark.kind.slice(1)}`] ?? landmark.kind;

    return landmark.name && labels.landmarkNamed ? labels.landmarkNamed.replace('{landmark}', kind).replace('{name}', landmark.name) : kind;
}
