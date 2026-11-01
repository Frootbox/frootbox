import { showToast } from './toast.js';

/**
 * <button data-fb-copy="https://…" data-fb-copied="Copied">: copies the
 * text to the clipboard and confirms it with a toast. A path starting
 * with / becomes a full address on this domain.
 */
export function bindCopies(root = document) {
    root.addEventListener('click', async (event) => {
        const button = event.target instanceof Element ? event.target.closest('[data-fb-copy]') : null;

        if (!button) {
            return;
        }

        const value = button.dataset.fbCopy;
        const text = value.startsWith('/') ? new URL(value, window.location.origin).href : value;

        try {
            await navigator.clipboard.writeText(text);
            showToast(button.dataset.fbCopied || 'Copied');
        } catch {
            // Without the clipboard, e.g. over plain http, the address can be copied by hand.
            window.prompt(button.dataset.fbCopyManually || document.body?.dataset.fbCopyManually || 'Copy the text:', text);
        }
    });
}
