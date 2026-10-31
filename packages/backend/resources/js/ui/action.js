/**
 * Runs an action of the backend (decision 0115) and returns
 * { ok, data, problem }. problem is { detail, errors, status } as the
 * server sends it, or the text of `failed` if it cannot be reached.
 */
export async function runAction(name, input, failed = defaultFailed()) {
    let response;
    let body = null;

    try {
        response = await fetch(meta('fb-actions') + name, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-Token': meta('fb-csrf'),
            },
            credentials: 'same-origin',
            body: JSON.stringify(input),
        });
        body = await response.json().catch(() => null);
    } catch {
        return { ok: false, data: null, problem: { detail: failed, errors: [] } };
    }

    if (!response.ok) {
        return { ok: false, data: null, problem: { detail: body?.detail ?? failed, errors: body?.errors ?? [], status: response.status } };
    }

    return { ok: true, data: body?.data ?? null, problem: null };
}

/**
 * Loads the current address again and replaces only the elements with
 * these ids (decision 0116), e.g. refresh(['page-tree', 'page-detail']).
 * Focus inside a replaced element goes to the element with the same id
 * in the new one, else to the first element with data-fb-focus in it.
 * Returns false if the page could not be loaded. active is the element
 * that had the focus before, e.g. a button that was disabled meanwhile.
 */
export async function refresh(ids, { url = window.location.href, active = document.activeElement } = {}) {
    let html;

    try {
        const response = await fetch(url, { headers: { Accept: 'text/html' }, credentials: 'same-origin' });

        if (!response.ok) {
            return false;
        }

        html = await response.text();
    } catch {
        return false;
    }

    const next = new DOMParser().parseFromString(html, 'text/html');
    let focus = null;

    for (const id of ids) {
        const current = document.getElementById(id);
        const replacement = next.getElementById(id);

        if (!current || !replacement) {
            continue;
        }

        const hadFocus = active instanceof Element && current.contains(active);
        const adopted = document.adoptNode(replacement);
        current.replaceWith(adopted);
        adopted.dispatchEvent(new CustomEvent('fb-refreshed', { bubbles: true }));

        if (hadFocus) {
            focus = (active.id && adopted.querySelector(`[id="${CSS.escape(active.id)}"]`)) || adopted.querySelector('[data-fb-focus]') || adopted;
        }
    }

    if (next.title) {
        document.title = next.title;
    }

    if (focus) {
        if (!focus.matches('a[href], button, input, select, textarea, [tabindex]')) {
            focus.tabIndex = -1;
        }

        focus.focus();
    }

    return true;
}

function meta(name) {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
}

function defaultFailed() {
    return document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
}
