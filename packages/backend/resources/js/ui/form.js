import { LitElement } from 'lit';
import { refresh as refreshParts, runAction } from './action.js';
import { showToast } from './toast.js';

const ALERT = '<svg class="fb-icon fb-icon--small" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.5"/></svg>';
const TOAST_KEY = 'fb-toast';

/**
 * The field of an error: "/translations/en/slug" is the field named
 * "translations.en.slug", else "translations.en" and so on; "/roles/1"
 * is "roles" or "roles[]". An element with data-fb-pointer="/ids/2"
 * takes the errors of that pointer and below, e.g. one page in a list
 * that is published together (decision 0176). Null for "/" or no such
 * field.
 */
function fieldFor(form, pointer) {
    const raw = pointer.split('/').slice(1).filter((part) => part !== '');
    const parts = raw.map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'));

    for (let length = parts.length; length > 0; length--) {
        const target = form.querySelector(`[data-fb-pointer="${CSS.escape('/' + raw.slice(0, length).join('/'))}"]`);

        if (target) {
            return target;
        }

        const name = parts.slice(0, length).join('.');
        const field = form.elements.namedItem(name) ?? form.elements.namedItem(name + '[]');

        if (field) {
            return field instanceof RadioNodeList ? field[0] : field;
        }
    }

    return null;
}

/** "title: is required" for "/translations/de/title", the last name in the pointer that is no number. */
function withName(pointer, message) {
    const name = pointer.split('/').filter((part) => part !== '' && !/^\d+$/.test(part)).pop();

    return name ? `${name.replaceAll('~1', '/').replaceAll('~0', '~')}: ${message}` : message;
}

/** "2026-11-01T18:00" in the time zone of the browser for an ISO time. */
function localTime(iso) {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (number) => String(number).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Sets input[name] with "a.b.c" as {a: {b: {c: …}}}. */
function assign(input, name, value, list) {
    const keys = name.split('.');
    const last = keys.pop();
    let target = input;

    for (const key of keys) {
        target[key] ??= {};
        target = target[key];
    }

    if (list) {
        target[last] = [...(target[last] ?? []), ...(Array.isArray(value) ? value : [value])];
    } else {
        target[last] = value;
    }
}

function valueAt(data, path) {
    return path.split('.').reduce((object, key) => object?.[key], data);
}

/** Whether formInput() sends the element. */
function sent(element) {
    return element.name !== '' && !element.name.startsWith('_') && !element.disabled && element.type !== 'submit' && element.type !== 'button';
}

/** The value of one field as text, to tell whether it changed. */
function fieldValue(element) {
    if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked ? '1' : '0';
    }

    if (element.multiple) {
        return [...element.selectedOptions].map((option) => option.value).join('\n');
    }

    return element.value ?? '';
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
 * - data-type="lines" is a list of the lines that are not empty,
 *   data-type="comma" one of the parts between commas, e.g. new tags
 * - data-type="boolean" is true for "1" or "true", e.g. a hidden field
 * - data-type="json" is the parsed value, empty is null, e.g. the hidden
 *   field of <fb-rich-text> or <fb-image-input>
 * - data-type="datetime" on a datetime-local field is the time with the
 *   offset of the browser, empty is null; data-value="<ISO time>" fills
 *   it in the time zone of the browser
 * - data-empty="null" sends null instead of an empty text
 * - a name with dots is nested: "translations.en.title"
 * - fields without a name, disabled fields and names starting with _
 *   (e.g. _csrf, or radio buttons that only switch fields) are left out
 */
export function formInput(form) {
    const input = {};

    for (const element of form.elements) {
        const raw = element.name;

        if (!raw || raw.startsWith('_') || element.disabled || element.type === 'submit' || element.type === 'button') {
            continue;
        }

        const list = raw.endsWith('[]');
        const name = list ? raw.slice(0, -2) : raw;

        if (element.type === 'checkbox') {
            assign(input, name, list ? (element.checked ? [element.value] : []) : element.checked, list);

            continue;
        }

        if (element.type === 'radio') {
            if (element.checked) {
                assign(input, name, element.value, false);
            }

            continue;
        }

        let value = element.value;

        if (element.type === 'number' || element.dataset.type === 'number') {
            value = value.trim() === '' ? null : Number(value);
        } else if (element.dataset.type === 'boolean') {
            value = value === '1' || value === 'true';
        } else if (element.dataset.type === 'json') {
            value = value.trim() === '' ? null : JSON.parse(value);
        } else if (element.dataset.type === 'datetime') {
            value = value === '' ? null : new Date(value).toISOString();
        } else if (element.dataset.type === 'lines') {
            value = value.split('\n').map((line) => line.trim()).filter((line) => line !== '');
        } else if (element.dataset.type === 'comma') {
            value = value.split(',').map((part) => part.trim()).filter((part) => part !== '');
        } else if (element.multiple) {
            value = [...element.selectedOptions].map((option) => option.value);
        } else if (value === '' && element.dataset.empty === 'null') {
            value = null;
        }

        assign(input, name, value, list);
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
 * - show: the id of a hidden element to show after success and after
 *   refresh, e.g. a new API token; elements in it with
 *   data-fb-value="token" get that value of the result, fields with
 *   data-fb-entry the id for action.undo (decision 0176); without one
 *   the <fb-form> around such a field is hidden
 * - refresh: ids of elements to load again after success, separated by
 *   spaces (decision 0116); the page stays
 * - until: the name of a value of the result; while it is not true, the
 *   form sends the action again (decision 0326), e.g. one step of a sync
 *   after the other. After each step it loads the elements of refresh
 *   again. again is JSON that replaces parts of the input from the
 *   second step on, e.g. {"full": false}. A button with data-fb-stop
 *   in the form shows while it runs and stops after the current step;
 *   leaving the page asks first.
 * - base: a JSON pointer whose errors belong to the fields of this form,
 *   e.g. "/items/de/2" when the form edits one item of a list
 *
 * Fields that depend on another one: an element with
 * data-fb-when="type=frootbox/jobs/job" is shown only while the field
 * named type has that value, and the fields in it are disabled (left
 * out) while it is hidden. "type!=" stands for any value but empty.
 *
 * Unsaved changes (decision 0130): the form remembers its input when it
 * loads and after success. While the input differs, it has the attribute
 * dirty, its save buttons (data-fb-saves, decisions 0130 and 0131) turn
 * from tonal to primary and a status next to them says so. Fields changed by a script count once it fires "input".
 * While dirty, the changed fields carry data-fb-changed, e.g. for the
 * dot on a tab of <fb-tab-panels> (decision 0235).
 *
 * A form in a <dialog> closes it after success.
 * Errors appear at their field and as a summary at the top, which gets
 * the focus. A link in the summary fires "fb-reveal" on its field before
 * focusing it, so a hidden tab opens; a field in a tab of the form is
 * named with that tab ("Application · Email: …").
 *
 * Fires "fb-form-input" with detail.input before sending (a
 * listener may replace it), "fb-form-success" with detail.data
 * (cancelable: then nothing else happens) and "fb-form-error" with
 * detail.problem.
 */
export class Form extends LitElement {
    static properties = {
        action: {},
        next: {},
        done: {},
        failed: {},
        reset: { type: Boolean },
        show: {},
        refresh: {},
        until: {},
        again: {},
        base: {},
        busy: { type: Boolean, reflect: true },
        dirty: { type: Boolean, reflect: true },
    };

    constructor() {
        super();
        this.action = '';
        this.next = null;
        this.done = null;
        this.failed = document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
        this.reset = false;
        this.show = null;
        this.refresh = null;
        this.until = null;
        this.again = null;
        this.stopped = false;
        this.base = '';
        this.busy = false;
        this.dirty = false;
        this.saved = null;
        this.values = new Map();
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onStop = this.onStop.bind(this);
        this.onLeave = this.onLeave.bind(this);
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
        this.addEventListener('input', this.onChange);
        this.addEventListener('change', this.onChange);
        this.addEventListener('click', this.onStop);

        for (const field of this.querySelectorAll('input[data-type="datetime"][data-value]')) {
            field.value = localTime(field.dataset.value);
        }

        this.switchFields();
        this.remember();

        // Building blocks inside may set their fields after their first render.
        setTimeout(() => {
            if (!this.dirty) {
                this.remember();
            }
        });
    }

    disconnectedCallback() {
        this.removeEventListener('submit', this.onSubmit);
        this.removeEventListener('input', this.onChange);
        this.removeEventListener('change', this.onChange);
        this.removeEventListener('click', this.onStop);
        window.removeEventListener('beforeunload', this.onLeave);
        super.disconnectedCallback();
    }

    /** Takes the current input as the saved state, e.g. after loading or saving. */
    remember() {
        this.saved = this.form ? JSON.stringify(formInput(this.form)) : null;
        this.values = new Map([...(this.form?.elements ?? [])].map((element) => [element, fieldValue(element)]));
        this.setDirty(false);
    }

    /** Compares the input with the saved state. */
    check() {
        if (this.form && this.saved !== null) {
            this.setDirty(JSON.stringify(formInput(this.form)) !== this.saved);
        }
    }

    /** Shows the fields with data-fb-when whose condition holds, see above. */
    switchFields() {
        const form = this.form;

        if (!form) {
            return;
        }

        for (const element of form.querySelectorAll('[data-fb-when]')) {
            const condition = element.dataset.fbWhen;
            const negated = condition.includes('!=');
            const [name, expected] = condition.split(negated ? '!=' : '=', 2);
            const field = form.elements.namedItem(name);
            const value = field && 'value' in field ? field.value : '';
            const shown = negated ? value !== (expected ?? '') : value === (expected ?? '');
            element.hidden = !shown;

            for (const input of element.matches('input, select, textarea') ? [element] : element.querySelectorAll('input, select, textarea')) {
                input.disabled = !shown;
            }
        }
    }

    onChange(event) {
        if (event.type === 'change' && event.target instanceof Element && event.target.closest('fb-form') === this) {
            this.switchFields();
        }

        if (event.target instanceof Element && event.target.closest('fb-form') === this) {
            // After the other listeners, e.g. the one that fills in a slug.
            queueMicrotask(() => this.check());
        }
    }

    /**
     * Save buttons turn from tonal to primary while the form is changed,
     * and the status next to the first one says so.
     */
    setDirty(dirty) {
        this.dirty = dirty;
        const buttons = [...(this.form?.querySelectorAll('[type="submit"][data-fb-saves]') ?? [])];

        for (const button of buttons) {
            button.classList.toggle('fb-button--primary', dirty);
            button.classList.toggle('fb-button--tonal', !dirty);
        }

        for (const element of this.form?.elements ?? []) {
            element.toggleAttribute('data-fb-changed', dirty && sent(element) && this.values.get(element) !== fieldValue(element));
        }

        if (buttons.length === 0) {
            return;
        }

        let status = this.querySelector('.fb-form__status');

        if (!status) {
            // The live region exists before its text changes, so it is read out.
            status = document.createElement('span');
            status.className = 'fb-form__status';
            status.setAttribute('role', 'status');
            buttons[0].after(status);
        }

        status.textContent = dirty ? (document.body?.dataset.fbUnsaved || 'Not saved') : '';
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

        // Disabling the button takes the focus away, a refresh brings it back.
        const active = document.activeElement;

        this.clearErrors();
        this.setBusy(true);

        const prepared = new CustomEvent('fb-form-input', { detail: { input: formInput(form) }, bubbles: true });
        this.dispatchEvent(prepared);
        const result = this.until ? await this.repeat(prepared.detail.input, active) : await runAction(this.action, prepared.detail.input, this.failed);
        this.setBusy(false);

        if (result.ok && this.stopped) {
            return;
        }

        if (!result.ok) {
            this.showProblem(result.problem);

            return;
        }

        this.remember();

        const data = result.data;
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
            this.remember();
        }

        // A dialog gives the focus back to the button that opened it.
        const dialog = this.closest('dialog');
        let focused = active;

        if (dialog?.open) {
            dialog.close();
            focused = document.activeElement;
        }

        if (this.refresh) {
            await refreshParts(this.refresh.split(/\s+/).filter((id) => id !== ''), { active: focused });
        }

        // After the refresh, which may have loaded it again.
        const shown = this.show ? document.getElementById(this.show) : null;

        if (shown) {
            for (const element of shown.querySelectorAll('[data-fb-value]')) {
                element.textContent = String(valueAt(data, element.dataset.fbValue) ?? '');
            }

            for (const field of shown.querySelectorAll('[data-fb-entry]')) {
                field.value = result.entry === null ? '' : String(result.entry);
                const form = field.closest('fb-form');

                if (form) {
                    form.hidden = result.entry === null;
                    form.remember?.();
                }
            }

            shown.hidden = false;
            shown.tabIndex = -1;
            shown.focus();
        }

        if (this.done) {
            showToast(this.done);
        }
    }

    /**
     * Sends the action until the value named by until is true, the user
     * stops or a step fails; the result of the last step.
     */
    async repeat(input, active) {
        const again = this.again ? JSON.parse(this.again) : {};
        const ids = (this.refresh ?? '').split(/\s+/).filter((id) => id !== '');
        this.stopped = false;
        window.addEventListener('beforeunload', this.onLeave);

        try {
            let result = await runAction(this.action, input, this.failed);

            while (result.ok && valueAt(result.data, this.until) !== true && !this.stopped) {
                if (ids.length) {
                    await refreshParts(ids, { active });
                }

                result = await runAction(this.action, { ...input, ...again }, this.failed);
            }

            if (result.ok && this.stopped && ids.length) {
                await refreshParts(ids, { active });
            }

            return result;
        } finally {
            window.removeEventListener('beforeunload', this.onLeave);
        }
    }

    onStop(event) {
        if (event.target instanceof Element && event.target.closest('[data-fb-stop]') && event.target.closest('fb-form') === this) {
            event.preventDefault();
            this.stopped = true;
        }
    }

    onLeave(event) {
        event.preventDefault();
    }

    setBusy(busy) {
        this.busy = busy;

        for (const button of this.form?.querySelectorAll('[data-fb-stop]') ?? []) {
            button.hidden = !busy;
        }

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
            const element = fieldFor(form, this.localPointer(pointer ?? '/'));

            if (!element || !element.id) {
                // Without a field, the last name in the pointer says what is meant, e.g. "title".
                items.push({ text: withName(pointer ?? '', message) });

                continue;
            }

            if (element.dataset.fbPointer !== undefined) {
                // Below the pointer, the last name says what is meant, e.g. "level".
                const text = withName(this.localPointer(pointer ?? '/').slice(element.dataset.fbPointer.length), message);
                this.markField(element, text);
                items.push({ text: this.placeOf(element) + this.labelOf(element) + ': ' + text, id: element.id });
            } else if (element.getAttribute('aria-invalid') !== 'true') {
                this.markField(element, message);
                items.push({ text: this.placeOf(element) + this.labelOf(element) + ': ' + message, id: element.id });
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
                        const target = document.getElementById(item.id);
                        target?.dispatchEvent(new CustomEvent('fb-reveal', { bubbles: true }));
                        target?.focus();
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
        // In a dialog the summary goes below the title, inside its padding.
        const dialogTitle = form.querySelector('.fb-dialog__body > .fb-dialog__title');

        if (dialogTitle) {
            dialogTitle.after(summary);
        } else {
            form.prepend(summary);
        }
        summary.focus();

        this.dispatchEvent(new CustomEvent('fb-form-error', { detail: { problem }, bubbles: true }));
    }

    /** "/items/de/2/label" with base "/items/de/2" is "/label"; outside the base "/". */
    localPointer(pointer) {
        if (!this.base) {
            return pointer;
        }

        return pointer.startsWith(this.base + '/') ? pointer.slice(this.base.length) : '/';
    }

    markField(element, message) {
        const error = document.createElement('p');
        error.className = 'fb-error';
        error.dataset.fbForm = '';
        error.innerHTML = ALERT;
        const text = document.createElement('span');
        text.textContent = message;
        error.append(text);

        // An element for a pointer may take several errors, in its part for them.
        if (element.dataset.fbPointer !== undefined) {
            error.id = `${element.id}-error-${element.querySelectorAll('.fb-error[data-fb-form]').length}`;
            (element.querySelector('[data-fb-errors]') ?? element).append(error);

            return;
        }

        error.id = element.id + '-error';

        const described = (element.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id !== '');
        element.setAttribute('aria-describedby', [...described, error.id].join(' '));
        element.setAttribute('aria-invalid', 'true');

        // A group of checkboxes shows the error once, below the group.
        const container = element.closest('.fb-fieldset') ?? element.closest('.fb-field, .fb-check') ?? element.parentElement;
        container.append(error);
    }

    /** "Application · " for a field in a tab of this form (decision 0235), else nothing. */
    placeOf(element) {
        const panel = element.closest('[data-fb-panel]');

        return panel && this.form.contains(panel) ? panel.dataset.fbPanel + ' · ' : '';
    }

    labelOf(element) {
        if (element.dataset.fbLabel) {
            return element.dataset.fbLabel;
        }

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

/**
 * Asks before unsaved changes get lost (decision 0130): when the page is
 * left and when htmx replaces an element with a changed form in it, e.g.
 * after a click in the page tree. Forms in closed dialogs do not count.
 */
export function guardUnsaved() {
    const unsaved = (root) => [...root.querySelectorAll('fb-form[dirty]')].some((form) => !form.closest('dialog:not([open])'));

    window.addEventListener('beforeunload', (event) => {
        if (unsaved(document)) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    document.addEventListener('htmx:confirm', (event) => {
        const target = event.detail?.target;

        if (!(target instanceof Element) || !unsaved(target)) {
            return;
        }

        event.preventDefault();

        if (window.confirm(document.body?.dataset.fbLeave || 'Your changes are not saved. Leave anyway?')) {
            event.detail.issueRequest(true);
        }
    });
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
