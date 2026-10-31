// The entry of every backend page: the building blocks and htmx, which
// sends the CSRF token of the session with every request (decision 0112).
import { generatePasswords, showPendingToast } from '@frootbox/ui';
import htmx from 'htmx.org';

generatePasswords();
showPendingToast();

document.addEventListener('htmx:configRequest', (event) => {
    const token = document.querySelector('meta[name="fb-csrf"]')?.getAttribute('content');

    if (token) {
        event.detail.headers['X-CSRF-Token'] = token;
    }
});

export default htmx;
