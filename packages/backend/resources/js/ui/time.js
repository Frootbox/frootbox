/**
 * <time datetime="2026-12-01T07:00:00+00:00" data-fb-time> shows the time
 * in the time zone of the browser, like a datetime-local field, in the
 * language of the page. The server writes its own zone as a fallback.
 */
export function localTimes(root = document) {
    const format = new Intl.DateTimeFormat(document.documentElement.lang || undefined, {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    for (const time of root.querySelectorAll('time[data-fb-time]')) {
        const date = new Date(time.dateTime);

        if (!Number.isNaN(date.getTime())) {
            time.textContent = format.format(date);
        }
    }
}
