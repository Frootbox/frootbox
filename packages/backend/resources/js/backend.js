// The entry of every backend page: the building blocks and htmx, which
// sends the CSRF token of the session with every request (decision 0112).
import { bindFills, bindSlugs, generatePasswords, localTimes, showPendingToast } from '@frootbox/ui';
import htmx from 'htmx.org';

generatePasswords();
bindSlugs();
bindFills();
localTimes();
showPendingToast();

document.addEventListener('htmx:configRequest', (event) => {
    const token = document.querySelector('meta[name="fb-csrf"]')?.getAttribute('content');

    if (token) {
        event.detail.headers['X-CSRF-Token'] = token;
    }
});

// Parts that <fb-form refresh> or <fb-tree> loaded again (decision 0116).
document.addEventListener('fb-refreshed', (event) => {
    htmx.process(event.target);
    localTimes(event.target);
});
document.addEventListener('htmx:afterSwap', (event) => localTimes(event.target));

export default htmx;
