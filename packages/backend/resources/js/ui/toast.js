const CHECK = '<svg class="fb-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/></svg>';
const DURATION = 5000;

let region = null;

/**
 * A short confirmation at the bottom right, e.g. after saving. The live
 * region exists before the text arrives, so screen readers announce it.
 */
export function showToast(text) {
    if (!region) {
        region = document.createElement('div');
        region.className = 'fb-toast-region';
        region.setAttribute('role', 'status');
        document.body.append(region);
    }

    const toast = document.createElement('div');
    toast.className = 'fb-toast';
    toast.innerHTML = CHECK;
    const span = document.createElement('span');
    toast.append(span);
    region.replaceChildren(toast);

    // A tick later, so the change is announced.
    requestAnimationFrame(() => {
        span.textContent = text;
    });

    setTimeout(() => toast.remove(), DURATION);
}
