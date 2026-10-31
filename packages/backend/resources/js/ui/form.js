import { LitElement } from 'lit';
import { showToast } from './toast.js';

const ALERT = '<svg class="fb-icon fb-icon--small" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.5"/></svg>';
const TOAST_KEY = 'fb-toast';

function meta(name) {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
}

/** "/roles/1" → "roles", "/" → null */
function fieldName(pointer) {
    const first = pointer.split('/')[1] ?? '';

    return first === '' ? null : first.replaceAll('~1', '/').replaceAll('~0', '~');
}

function valueAt(data, path) {
    return path.split('.').reduce((object, key) => object?.[key], data);
}

/** {user.id} in next="/cms/users/{user.id}" from the result. */
function fill(template, data) {
    return template.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, path) => {
        const value = valueAt(data, path);

        return value === undefined || value === null ? match : encodeURIComponent(String(value));
    });
}

/**
 * The input of a form as JSON for an action:
 *
 * - checkboxes are true or false, with a name ending in [] a list of the
 *   checked values
 * - type="number" and data-type="number" are numbers, empty is null
 * - data-type="lines" is a list of the lines that are not empty
 * - data-type="boolean" is true for "1" or "true", e.g. a hidden field
 * - data-empty="null" sends null instead of an empty text
 * - fields without a name, disabled fields and _csrf are left out
 */
export function formInput(form) {
    const input = {};

    for (const element of form.elements) {
        const raw = element.name;

        if (!raw || raw === '_csrf' || element.disabled || element.type === 'submit' || element.type === 'button') {
            continue;
        }

        const list = raw.endsWith('[]');
        const name = list ? raw.slice(0, -2) : raw;

        if (element.type === 'checkbox') {
            if (list) {
                input[name] ??= [];

                if (element.checked) {
                    input[name].push(element.value);
                }
            } else {
                input[name] = element.checked;
            }

            continue;
        }

        if (element.type === 'radio') {
            if (element.checked) {
                input[name] = element.value;
            }

            continue;
        }

        let value = element.value;

        if (element.type === 'number' || element.dataset.type === 'number') {
            value = value.trim() === '' ? null : Number(value);
        } else if (element.dataset.type === 'boolean') {
            value = value === '1' || value === 'true';
        } else if (element.dataset.type === 'lines') {
            value = value.split('\n').map((line) => line.trim()).filter((line) => line !== '');
        } else if (element.multiple) {
            value = [...element.selectedOptions].map((option) => option.value);
        } else if (value === '' && element.dataset.empty === 'null') {
            value = null;
        }

        if (list) {
            input[name] = [...(input[name] ?? []), ...(Array.isArray(value) ? value : [value])];
        } else {
            input[name] = value;
        }
    }

    return input;
}

/**
 * <fb-form>: sends the form inside it to an action of the backend
 * (decision 0115) and shows the answer.
 *
 *     <fb-form action="user.create" next="/cms/users/{user.id}" done="Saved">
 *         <form class="fb-stack" novalidate>…</form>
 *     </fb-form>
 *
 * - action: the name of the action, sent to <meta name="fb-actions"> + name
 * - next: where to go afterwards, {path} takes a value of the result;
 *   without it the page stays and only shows the toast
 * - done: the text of the toast after success
 * - failed: the text when the server cannot be reached, by default from
 *   data-fb-failed of the body
 * - reset: empty the form after success
 * - show: the id of a hidden element to show after success, e.g. a new
 *   API token; elements in it with data-fb-value="token" get that value
 *   of the result
 *
 * Errors appear at their field and as a summary at the top, which gets
 * the focus. Fires "fb-form-success" with detail.data (cancelable: then
 * nothing else happens) and "fb-form-error" with detail.problem.
 */
export class Form extends LitElement {
    static properties = {
        action: {},
        next: {},
        done: {},
        failed: {},
        reset: { type: Boolean },
        show: {},
        busy: { type: Boolean, reflect: true },
    };

    constructor() {
        super();
        this.action = '';
        this.next = null;
        this.done = null;
        this.failed = document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
        this.reset = false;
        this.show = null;
        this.busy = false;
        this.onSubmit = this.onSubmit.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    get form() {
        return this.querySelector('form');
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('submit', this.onSubmit);
    }

    disconnectedCallback() {
        this.removeEventListener('submit', this.onSubmit);
        super.disconnectedCallback();
    }

    async onSubmit(event) {
        const form = event.target;

        if (!(form instanceof HTMLFormElement) || form.closest('fb-form') !== this) {
            return;
        }

        event.preventDefault();

        if (this.busy) {
            return;
        }

        this.clearErrors();
        this.setBusy(true);

        let response;
        let body = null;

        try {
            response = await fetch(meta('fb-actions') + this.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-Token': meta('fb-csrf'),
                },
                credentials: 'same-origin',
                body: JSON.stringify(formInput(form)),
            });
            body = await response.json().catch(() => null);
        } catch {
            this.setBusy(false);
            this.showProblem({ detail: this.failed, errors: [] });

            return;
        }

        this.setBusy(false);

        if (!response.ok) {
            this.showProblem({ detail: body?.detail ?? this.failed, errors: body?.errors ?? [], status: response.status });

            return;
        }

        const data = body?.data ?? null;
        const success = new CustomEvent('fb-form-success', { detail: { data }, bubbles: true, cancelable: true });

        if (!this.dispatchEvent(success)) {
            return;
        }

        if (this.next) {
            try {
                if (this.done) {
                    sessionStorage.setItem(TOAST_KEY, this.done);
                }
            } catch {
                // Without storage there is no toast on the next page.
            }

            window.location.assign(fill(this.next, data));

            return;
        }

        if (this.reset) {
            form.reset();
        }

        const shown = this.show ? document.getElementById(this.show) : null;

        if (shown) {
            for (const element of shown.querySelectorAll('[data-fb-value]')) {
                element.textContent = String(valueAt(data, element.dataset.fbValue) ?? '');
            }

            shown.hidden = false;
            shown.tabIndex = -1;
            shown.focus();
        }

        if (this.done) {
            showToast(this.done);
        }
    }

    setBusy(busy) {
        this.busy = busy;

        for (const button of this.form?.querySelectorAll('[type="submit"]') ?? []) {
            button.disabled = busy;
            button.toggleAttribute('aria-busy', busy);
        }
    }

    clearErrors() {
        this.querySelector('.fb-form__summary')?.remove();

        for (const error of this.querySelectorAll('.fb-error[data-fb-form]')) {
            const field = this.querySelector(`[aria-describedby~="${error.id}"]`);

            if (field) {
                const rest = field.getAttribute('aria-describedby').split(' ').filter((id) => id !== error.id);
                rest.length ? field.setAttribute('aria-describedby', rest.join(' ')) : field.removeAttribute('aria-describedby');
                field.removeAttribute('aria-invalid');
            }

            error.remove();
        }
    }

    /**
     * Shows the detail as summary and each error at its field. Errors
     * without a field of their own are listed in the summary.
     */
    showProblem(problem) {
        const form = this.form;
        const items = [];

        for (const { pointer, message } of problem.errors) {
            const name = fieldName(pointer ?? '/');
            const field = name === null ? null : (form.elements.namedItem(name) ?? form.elements.namedItem(name + '[]'));
            const element = field instanceof RadioNodeList ? field[0] : field;

            if (!element || !element.id) {
                items.push({ text: message });

                continue;
            }

            if (element.getAttribute('aria-invalid') !== 'true') {
                this.markField(element, message);
                items.push({ text: this.labelOf(element) + ': ' + message, id: element.id });
            }
        }

        // In the order of the form, errors without a field first.
        const position = (item) => (item.id ? [...form.elements].findIndex((element) => element.id === item.id) : -1);
        items.sort((a, b) => position(a) - position(b));

        const summary = document.createElement('div');
        summary.className = 'fb-alert fb-form__summary';
        summary.dataset.tone = 'danger';
        summary.setAttribute('role', 'alert');
        summary.tabIndex = -1;
        summary.innerHTML = ALERT;

        const content = document.createElement('div');
        const title = document.createElement('p');
        title.className = items.length ? 'fb-alert__title' : '';
        title.textContent = problem.detail;
        content.append(title);

        if (items.length) {
            const list = document.createElement('ul');
            list.className = 'fb-form__errors';

            for (const item of items) {
                const entry = document.createElement('li');

                if (item.id) {
                    const link = document.createElement('a');
                    link.href = '#' + item.id;
                    link.textContent = item.text;
                    link.addEventListener('click', (event) => {
                        event.preventDefault();
                        document.getElementById(item.id)?.focus();
                    });
                    entry.append(link);
                } else {
                    entry.textContent = item.text;
                }

                list.append(entry);
            }

            content.append(list);
        }

        summary.append(content);
        form.prepend(summary);
        summary.focus();

        this.dispatchEvent(new CustomEvent('fb-form-error', { detail: { problem }, bubbles: true }));
    }

    markField(element, message) {
        const error = document.createElement('p');
        error.className = 'fb-error';
        error.id = element.id + '-error';
        error.dataset.fbForm = '';
        error.innerHTML = ALERT;
        const text = document.createElement('span');
        text.textContent = message;
        error.append(text);

        const described = (element.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id !== '');
        element.setAttribute('aria-describedby', [...described, error.id].join(' '));
        element.setAttribute('aria-invalid', 'true');

        // A group of checkboxes shows the error once, below the group.
        const container = element.closest('.fb-fieldset') ?? element.closest('.fb-field, .fb-check') ?? element.parentElement;
        container.append(error);
    }

    labelOf(element) {
        const fieldset = element.closest('fieldset');
        const label = element.type === 'checkbox' || element.type === 'radio'
            ? fieldset?.querySelector('legend')
            : element.labels?.[0] ?? fieldset?.querySelector('legend');

        if (!label) {
            return element.name;
        }

        const copy = label.cloneNode(true);
        copy.querySelectorAll('.fb-label__optional').forEach((optional) => optional.remove());

        return copy.textContent.trim();
    }
}

/** A toast that the form before the redirect asked for. */
export function showPendingToast() {
    try {
        const text = sessionStorage.getItem(TOAST_KEY);

        if (text) {
            sessionStorage.removeItem(TOAST_KEY);
            showToast(text);
        }
    } catch {
        // Without storage there is nothing to show.
    }
}

customElements.define('fb-form', Form);
