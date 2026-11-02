// Where a comment is (decision 0156): the field or block an element belongs
// to, read from the marks of the editing mode or the light marks of a
// preview, and back from a thread to its element on the page. On the
// design page an element of it instead (decision 0210).

/** A comment on all of the design page. */
export const WHOLE_DESIGN_PAGE = 'page';

const MAX_EXCERPT = 300;

/**
 * The place of an element the user clicked: the field it is in, else the
 * block, else the page.
 */
export function placeOf(element) {
    const design = element.closest('[data-fb-design]');

    if (design) {
        return { blockId: null, field: null, site: false, design: design.dataset.fbDesign, label: design.dataset.fbTitle ?? null, excerpt: excerptOf(design), element: design };
    }

    const field = element.closest('[data-fb-field]');
    const block = (field ?? element).closest('[data-fb-block]');
    const target = field ?? block;

    return {
        blockId: block?.dataset.fbBlock ?? null,
        field: field?.dataset.fbField ?? null,
        site: field?.hasAttribute('data-fb-site') ?? false,
        label: field?.dataset.fbLabel ?? block?.dataset.fbTitle ?? null,
        excerpt: target ? excerptOf(target) : null,
        element: target ?? null,
    };
}

/**
 * The element of a thread on this page, null if the place is gone: then
 * the comment counts for the page.
 */
export function elementOf(thread, root = document) {
    if (thread.design) {
        return thread.design === WHOLE_DESIGN_PAGE ? null : root.querySelector(`[data-fb-design="${CSS.escape(thread.design)}"]`);
    }

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
