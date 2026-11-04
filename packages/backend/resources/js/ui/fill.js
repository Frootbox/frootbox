/**
 * Small helpers for dialogs and choices (decision 0116):
 *
 * - <button data-fb-commandfor="redirect-edit"
 *   data-fb-fill='{"id": 3, "path": "/old"}'> fills the fields with these
 *   names in the dialog, clears old errors and then opens it; a
 *   checkbox takes true or false, or a list for names ending in [] that
 *   checks those with a value in it; a radio button checks the one with
 *   that value. ui.button turns commandfor and command into it: with
 *   the native ones, a click before this script opened the dialog empty
 *   and it sent nothing or the wrong thing. Such a click waits for the
 *   script instead (Head::FILL_SCRIPT).
 * - <input type="radio" data-fb-enables="redirect-location"> enables
 *   that field while it is checked and disables the fields of the other
 *   radio buttons of its group, so only the chosen one is sent
 */
export function bindFills(root = document) {
    root.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('[data-fb-fill][data-fb-commandfor]') : null;
        const dialog = button && !button.disabled ? document.getElementById(button.dataset.fbCommandfor) : null;

        if (!(dialog instanceof HTMLDialogElement)) {
            return;
        }

        let values;

        try {
            values = JSON.parse(button.dataset.fbFill);
        } catch {
            return;
        }

        for (const fbForm of dialog.querySelectorAll('fb-form')) {
            fbForm.clearErrors?.();
        }

        for (const form of dialog.querySelectorAll('form')) {
            form.reset();

            for (const [name, value] of Object.entries(values)) {
                for (const field of form.querySelectorAll(`[name="${CSS.escape(name)}"]`)) {
                    if (field.type === 'checkbox') {
                        field.checked = Array.isArray(value) ? value.includes(field.value) : Boolean(value);
                    } else if (field.type === 'radio') {
                        field.checked = field.value === String(value);
                    } else {
                        field.value = value ?? '';
                    }
                }
            }

            updateSwitches(form);
        }

        // The filled values are the saved state of the dialog (decision 0130).
        for (const fbForm of dialog.querySelectorAll('fb-form')) {
            fbForm.remember?.();
        }

        if (!dialog.open) {
            dialog.showModal();
        }
    });

    root.addEventListener('change', (event) => {
        if (event.target instanceof HTMLInputElement && event.target.dataset.fbEnables !== undefined) {
            updateSwitches(event.target.form ?? document);
        }
    });

    for (const form of document.forms) {
        updateSwitches(form);
    }

    document.addEventListener('fb-refreshed', (event) => event.target.querySelectorAll?.('form').forEach(updateSwitches));
    document.addEventListener('reset', (event) => queueMicrotask(() => updateSwitches(event.target)), true);
}

function updateSwitches(root) {
    for (const radio of root.querySelectorAll('input[type="radio"][data-fb-enables]')) {
        const field = document.getElementById(radio.dataset.fbEnables);

        if (field) {
            field.disabled = !radio.checked;
            field.closest('.fb-field')?.toggleAttribute('hidden', !radio.checked);
        }
    }
}
