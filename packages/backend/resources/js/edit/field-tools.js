/**
 * Buttons on the tab of a field, by field type (decision 0150). A factory
 * gets the field and the bar and returns its buttons:
 *
 *     { icon: 'external', label: 'Open the link', title?, run(), disabled?, tone? }
 *
 * Field types of extensions add theirs with
 * customElements.get('fb-editor-bar').fieldTools('acme/shop/price', factory).
 * Clicking the field still edits it; the buttons are further ways.
 */

const FACTORIES = new Map();

export function registerFieldTools(type, factory) {
    FACTORIES.set(type, [...(FACTORIES.get(type) ?? []), factory]);
}

/** The buttons of a field, none for types without any. */
export function toolsOf(field, bar) {
    return (FACTORIES.get(field.dataset.fbType) ?? []).flatMap((factory) => factory(field, bar) ?? []);
}

/** The address a link field leads to, from its element as visitors get it. */
export function linkOf(field) {
    const anchor = field.closest('a[href]') ?? field.querySelector('a[href]');

    return anchor ? new URL(anchor.getAttribute('href'), location.href) : null;
}

/**
 * Follows a link: a page of this website in the same tab, where the
 * editing mode goes on; another address, or on request, in a new tab.
 */
export function follow(url, newTab = false) {
    if (!url) {
        return;
    }

    if (newTab || url.origin !== location.origin) {
        window.open(url.href, '_blank', 'noopener');
    } else {
        location.assign(url.href);
    }
}

function removable(field) {
    return field.hasAttribute('data-fb-optional') && field.dataset.fbValue !== undefined;
}

registerFieldTools('link', (field, bar) => {
    const labels = bar.labels;
    const url = linkOf(field);

    return [
        { icon: 'pencil', label: labels.editLink, run: () => bar.editing?.editLink(field) },
        { icon: 'external', label: labels.openLink, title: labels.openLinkHint, run: () => follow(url), disabled: !url },
        ...(removable(field) ? [{ icon: 'trash', label: labels.removeLink, run: () => bar.editing?.save(field, null), tone: 'danger' }] : []),
    ];
});

registerFieldTools('image', (field, bar) => {
    const labels = bar.labels;

    return [
        { icon: 'image', label: field.dataset.fbValue === undefined ? labels.chooseImage : labels.imageChosen, run: () => bar.editing?.editImage(field) },
        ...(removable(field) ? [{ icon: 'trash', label: labels.removeImage, run: () => bar.editing?.save(field, null), tone: 'danger' }] : []),
    ];
});

registerFieldTools('video', (field, bar) => {
    const labels = bar.labels;

    return [
        { icon: 'video', label: field.dataset.fbValue === undefined ? labels.chooseVideo : labels.videoChosen, run: () => bar.editing?.editImage(field) },
        ...(removable(field) ? [{ icon: 'trash', label: labels.removeVideo, run: () => bar.editing?.save(field, null), tone: 'danger' }] : []),
    ];
});

registerFieldTools('icon', (field, bar) => {
    const labels = bar.labels;

    return [
        { icon: 'symbol', label: labels.chooseIcon, run: () => bar.editing?.editIcon(field) },
        ...(removable(field) ? [{ icon: 'trash', label: labels.removeIcon, run: () => bar.editing?.save(field, null), tone: 'danger' }] : []),
    ];
});
