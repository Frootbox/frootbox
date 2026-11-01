/** Waits this long after the last key before asking for the address. */
const DELAY = 200;

/** The timer and the number of the last question per address field. */
const pending = new WeakMap();

/**
 * The address the core makes from a title in a language, through the
 * query page.slug (decision 0134), so the rules live only in the core.
 */
export async function slugify(query, title) {
    const url = new URL(query, location.href);
    url.searchParams.set('title', title);
    const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });

    if (!response.ok) {
        throw new Error(`page.slug answered ${response.status}`);
    }

    return (await response.json()).data;
}

/**
 * Addresses that follow a title (decision 0116):
 *
 * - <input data-fb-slug="new-title" data-fb-slug-query="…/page.slug?language=de">
 *   takes the slug of that field until someone types into it
 * - <select data-fb-prefix="new-slug"> puts data-prefix of the chosen
 *   option in front of that field
 */
export function bindSlugs(root = document) {
    root.addEventListener('input', (event) => {
        const source = event.target;

        if (!(source instanceof HTMLInputElement)) {
            return;
        }

        if (source.dataset.fbSlug !== undefined) {
            source.dataset.fbSlugTouched = source.value === '' ? '' : '1';

            return;
        }

        for (const slug of document.querySelectorAll(`input[data-fb-slug="${CSS.escape(source.id)}"]`)) {
            follow(slug, source.value);
        }
    });

    root.addEventListener('change', (event) => {
        const select = event.target;

        if (!(select instanceof HTMLSelectElement) || !select.dataset.fbPrefix) {
            return;
        }

        const prefix = select.selectedOptions[0]?.dataset.prefix;
        const affix = document.getElementById(select.dataset.fbPrefix)?.closest('.fb-affix')?.querySelector('.fb-affix__text');

        if (prefix !== undefined && affix) {
            affix.textContent = prefix;
        }
    });
}

/** Fills in the address of a title, the last answer wins. */
function follow(slug, title) {
    const last = pending.get(slug);
    clearTimeout(last?.timer);
    const asked = (last?.asked ?? 0) + 1;

    if (title.trim() === '') {
        pending.set(slug, { asked });

        if (slug.dataset.fbSlugTouched !== '1') {
            slug.value = '';
        }

        return;
    }

    const timer = setTimeout(async () => {
        try {
            const value = await slugify(slug.dataset.fbSlugQuery, title);

            if (pending.get(slug)?.asked === asked && slug.dataset.fbSlugTouched !== '1') {
                slug.value = value;
            }
        } catch {
            // Without a suggestion the core makes the address when saving.
        }
    }, DELAY);

    pending.set(slug, { asked, timer });
}
