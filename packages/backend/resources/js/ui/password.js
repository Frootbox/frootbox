const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A random password from letters and digits that are easy to tell apart. */
export function randomPassword(length = 16) {
    const values = crypto.getRandomValues(new Uint32Array(length));

    return [...values].map((value) => ALPHABET[value % ALPHABET.length]).join('');
}

/**
 * <button data-fb-generate="field-password"> puts a random password into
 * that field and shows it, so it can be passed on once.
 */
export function generatePasswords(root = document) {
    root.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('[data-fb-generate]') : null;
        const field = button ? document.getElementById(button.dataset.fbGenerate) : null;

        if (!(field instanceof HTMLInputElement)) {
            return;
        }

        event.preventDefault();
        field.type = 'text';
        field.value = randomPassword();
        field.focus();
        field.select();
    });
}
