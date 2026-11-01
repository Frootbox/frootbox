/**
 * The places on the page that the errors of publishing name (decision
 * 0143), so the bar can mark them. A pointer of page.publish looks like
 * "/ids/0/translations/de/content/areas/main/1/fields/items/0/title", one
 * of site.publish like "/languages/de/brand".
 */

const BLOCK = '[data-fb-block]';

/** The block an element belongs to, null for the layout. */
function owner(element) {
    return element.parentElement?.closest(BLOCK) ?? null;
}

function segments(path) {
    return path.split('/').filter((segment) => segment !== '').map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

/** A field in the layout or a block, only its own, not those of blocks inside. */
function field(container, path, site) {
    const selector = `[data-fb-field="${CSS.escape(path)}"]`;

    return [...(container ?? document).querySelectorAll(selector)]
        .find((element) => element.hasAttribute('data-fb-site') === site && (site || owner(element) === container)) ?? null;
}

/** Walks "areas/<name>/<index>" down to the block, then to its field. */
function inContent(path) {
    let rest = segments(path);
    let container = null;

    while (rest[0] === 'areas' && rest.length >= 3) {
        const [, area, index] = rest;
        const blocks = [...document.querySelectorAll(`${BLOCK}[data-fb-area="${CSS.escape(area)}"]`)]
            .filter((block) => owner(block) === container);
        container = blocks[Number(index)] ?? null;

        if (!container) {
            return { element: null, block: null, path: rest.join('/') };
        }

        rest = rest.slice(3);
    }

    if (rest[0] !== 'fields' || rest.length < 2) {
        return { element: container, block: container, path: '' };
    }

    const name = rest.slice(1).join('/');

    // A field the template does not show, e.g. an empty optional one, is named on its block.
    return { element: field(container, name, false), block: container, path: name };
}

/**
 * Each error with the element to mark, or none when the page does not
 * show it; then its block and the path of the field name it.
 *
 * @param {Array<{pointer: string, message: string}>} errors
 * @param {{id: string, publish: string[]}|null} page
 * @param {string} language
 */
export function placesOf(errors, page, language) {
    return errors.map(({ pointer = '', message = '' }) => {
        const content = pointer.match(/^\/ids\/(\d+)\/translations\/([^/]+)\/content(\/.*)?$/);

        if (content && page && page.publish[Number(content[1])] === page.id && content[2] === language) {
            return { ...inContent(content[3] ?? ''), message };
        }

        const site = pointer.match(/^\/languages\/([^/]+)\/(.+)$/);

        if (site && site[1] === language) {
            const path = segments(site[2]).join('/');

            return { element: field(null, path, true), block: null, path, message };
        }

        return { element: null, block: null, path: '', message };
    });
}
