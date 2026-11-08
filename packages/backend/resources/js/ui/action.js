/**
 * Runs an action of the backend (decision 0115) and returns
 * { ok, data, entry, problem }. entry is the id for action.undo if the
 * action can be undone, else null (decision 0176). problem is
 * { detail, errors, status } as the server sends it, or the text of
 * `failed` if it cannot be reached.
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
        return { ok: false, data: null, entry: null, problem: { detail: failed, errors: [] } };
    }

    if (!response.ok) {
        return { ok: false, data: null, entry: null, problem: { detail: body?.detail ?? failed, errors: body?.errors ?? [], status: response.status } };
    }

    return { ok: true, data: body?.data ?? null, entry: body?.entry ?? null, problem: null };
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
        const unsaved = keepUnsaved(current);
        const adopted = document.adoptNode(replacement);
        current.replaceWith(adopted);
        unsaved(adopted);
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
            focus.dataset.fbReading = '';
        }

        focus.focus();
    }

    return true;
}

/**
 * Keeps the values of changed forms (decision 0130) when an element is
 * replaced, e.g. the page details after saving one of its forms. Returns
 * a function that puts them into the forms of the new element, matched by
 * action, base and order.
 */
function keepUnsaved(root) {
    // "page.update||0" for the first form of that action, so forms that
    // appear or disappear meanwhile do not shift the others.
    const keys = (forms) => {
        const counts = new Map();

        return forms.map((form) => {
            const name = `${form.getAttribute('action')}|${form.getAttribute('base') ?? ''}`;
            const index = counts.get(name) ?? 0;
            counts.set(name, index + 1);

            return `${name}|${index}`;
        });
    };
    const kept = new Map();
    const forms = [...root.querySelectorAll('fb-form')];
    const formKeys = keys(forms);

    forms.forEach((form, index) => {
        if (form.hasAttribute('dirty') && form.querySelector('form')) {
            kept.set(formKeys[index], [...form.querySelector('form').elements]
                .filter((field) => field.name && !field.disabled && field.type !== 'submit' && field.type !== 'button')
                .map((field) => ({ name: field.name, type: field.type, value: field.value, checked: field.checked })));
        }
    });

    return (replacement) => {
        if (kept.size === 0) {
            return;
        }

        const replaced = [...replacement.querySelectorAll('fb-form')];
        const replacedKeys = keys(replaced);

        replaced.forEach((form, index) => {
            const fields = kept.get(replacedKeys[index]);
            const element = form.querySelector('form');

            if (!fields || !element) {
                return;
            }

            for (const field of fields) {
                for (const target of element.querySelectorAll(`[name="${CSS.escape(field.name)}"]`)) {
                    if (target.type === 'checkbox' || target.type === 'radio') {
                        if (target.value === field.value) {
                            target.checked = field.checked;
                        }
                    } else if (target.type === field.type) {
                        target.value = field.value;
                    }
                }
            }

            form.check?.();
        });
    };
}

function meta(name) {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
}

function defaultFailed() {
    return document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
}
