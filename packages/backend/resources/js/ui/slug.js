const REPLACE = {
    ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', å: 'a',
    á: 'a', à: 'a', â: 'a', ã: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e',
    í: 'i', ì: 'i', î: 'i', ï: 'i', ó: 'o', ò: 'o', ô: 'o', õ: 'o',
    ú: 'u', ù: 'u', û: 'u', ç: 'c', ñ: 'n', ý: 'y', ÿ: 'y',
};
const MAX_LENGTH = 100;

/** "Über uns & Team" → "ueber-uns-team", like Slug::fromTitle() in PHP. */
export function slugify(title) {
    const slug = [...title.toLowerCase()].map((char) => REPLACE[char] ?? char).join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slug.slice(0, MAX_LENGTH).replace(/-+$/, '');
}

/**
 * Addresses that follow a title (decision 0116):
 *
 * - <input data-fb-slug="new-title"> takes the slug of that field until
 *   someone types into it
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
            if (slug.dataset.fbSlugTouched !== '1') {
                slug.value = slugify(source.value);
            }
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
