/*
 * SPDX-License-Identifier: MIT
 */

// After a change the bar swaps the content of the page instead of
// loading it again (decision 0336): no white flash, the position stays,
// and whatever the core works out over the whole page (heading levels,
// jump bars, the footer) is right, because it is the whole page.

const CONFIG = 'fb-edit-config';

// Where the pointer was last: after the swap the browser reports the new
// element under a pointer that never moved, which must not take the
// place of the block that has the focus.
let pointer = null;
document.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
}, { capture: true, passive: true });

/** Whether an event of the pointer is only the swap, not a move of it. */
export function unmoved(event, held) {
    return held !== null && event.clientX === held.x && event.clientY === held.y;
}

/** Puts a new bar on the page with the configuration of the editing mode. */
export function mountBar(config, held = null) {
    const bar = document.createElement('fb-editor-bar');
    bar.config = config;
    bar.held = held;
    // The bar speaks the language of the backend (decision 0133).
    bar.lang = config.ui?.language ?? '';
    bar.dir = config.ui?.direction ?? 'ltr';
    document.body.append(bar);

    return bar;
}

/** Scripts with code; others (JSON, templates) are data and get swapped like any element. */
function executable(node) {
    return node instanceof HTMLScriptElement && ['', 'module', 'text/javascript', 'application/javascript'].includes((node.getAttribute('type') ?? '').toLowerCase());
}

/** A script that runs once it is in the document; parsed ones never do. */
function runnable(script) {
    const copy = document.createElement('script');

    for (const { name, value } of script.attributes) {
        copy.setAttribute(name, value);
    }

    copy.textContent = script.textContent;

    return copy;
}

/** Stylesheets and scripts a new block brings along; what is there stays. */
function mergeHead(next) {
    const links = new Set([...document.head.querySelectorAll('link[href]')].map((link) => link.href));
    const scripts = new Set([...document.querySelectorAll('script[src]')].map((script) => script.src));
    const styles = new Set([...document.head.querySelectorAll('style')].map((style) => style.textContent));

    for (const element of next.head.children) {
        if (element instanceof HTMLLinkElement && element.getAttribute('href') && !links.has(new URL(element.getAttribute('href'), location.href).href)) {
            document.head.append(document.importNode(element, true));
        } else if (element instanceof HTMLScriptElement && element.getAttribute('src') && !scripts.has(new URL(element.getAttribute('src'), location.href).href)) {
            document.head.append(runnable(element));
        } else if (element instanceof HTMLStyleElement && !styles.has(element.textContent)) {
            document.head.append(document.importNode(element, true));
        }
    }

    const config = document.getElementById(CONFIG);
    const source = next.getElementById(CONFIG);

    if (config && source) {
        config.textContent = source.textContent;
    }

    document.title = next.title;
}

/** The body of the answer in place of the current one; code that ran stays, new code runs. */
function swapBody(next) {
    const scripts = new Set([...document.querySelectorAll('script[src]')].map((script) => script.src));

    for (const child of [...document.body.childNodes]) {
        if (!executable(child)) {
            child.remove();
        }
    }

    const anchor = [...document.body.children].find(executable) ?? null;

    for (const child of [...next.body.childNodes]) {
        if (executable(child)) {
            const src = child.getAttribute('src');

            if (src && !scripts.has(new URL(src, location.href).href)) {
                document.body.append(runnable(child));
            }

            continue;
        }

        document.body.insertBefore(document.importNode(child, true), anchor);
    }

    for (const { name } of [...document.body.attributes]) {
        if (!next.body.hasAttribute(name)) {
            document.body.removeAttribute(name);
        }
    }

    for (const { name, value } of next.body.attributes) {
        document.body.setAttribute(name, value);
    }
}

/**
 * Fetches the page again and swaps its content; the bar starts again
 * with the new configuration, like after loading. Without an answer in
 * the editing mode (signed out, redirected) it loads the page instead.
 */
export async function refreshPage(bar) {
    let next = null;

    try {
        const response = await fetch(location.href, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'text/html' } });

        if (response.ok && !response.redirected) {
            next = new DOMParser().parseFromString(await response.text(), 'text/html');
        }
    } catch {
        next = null;
    }

    const source = next?.getElementById(CONFIG);

    if (!next || !source) {
        location.reload();

        return;
    }

    const x = scrollX;
    const y = scrollY;

    mergeHead(next);
    // The old bar goes first: it lets go of the page before the page changes.
    bar.remove();
    swapBody(next);
    scrollTo(x, y);
    mountBar(JSON.parse(source.textContent ?? '{}'), pointer);
    document.dispatchEvent(new CustomEvent('frootbox:refresh'));
}
