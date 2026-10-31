/**
 * Rich text on the website (decision 0122): Tiptap right on the element
 * of the field, with the nodes and marks of the rich-text schema of the
 * server (decision 0097). Loaded on the first focus of such a field, as
 * a chunk of its own.
 */
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

const EMPTY = { type: 'doc', content: [] };

/** Leaves out attributes without value, as the server stores none of them. */
export function clean(node) {
    if (Array.isArray(node)) {
        return node.map(clean);
    }

    if (!node || typeof node !== 'object') {
        return node;
    }

    const result = {};

    for (const [key, value] of Object.entries(node)) {
        if (value === null || value === undefined) {
            continue;
        }

        if (key === 'attrs') {
            const attrs = Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined));

            if (Object.keys(attrs).length > 0) {
                result.attrs = attrs;
            }

            continue;
        }

        result[key] = clean(value);
    }

    return result;
}

/**
 * Mounts the editor on the element; its HTML is replaced by the one
 * Tiptap renders from the stored value.
 */
export function createEditor(element, value, { update, selection, blur }) {
    return new Editor({
        element: { mount: element },
        content: value ?? EMPTY,
        injectCSS: false,
        extensions: [
            StarterKit.configure({
                trailingNode: false,
                dropcursor: false,
                gapcursor: false,
                // The page has its h1; pasted ones become paragraphs.
                heading: { levels: [2, 3, 4] },
                link: {
                    openOnClick: false,
                    autolink: true,
                    defaultProtocol: 'https',
                    // Page links look like "page:01J…" (decision 0105).
                    isAllowedUri: (url, { defaultValidate }) => url.startsWith('page:') || defaultValidate(url),
                    HTMLAttributes: { rel: null, target: null, class: null },
                },
            }),
        ],
        onUpdate: () => update(),
        // Each change may move the selection or what the toolbar shows active.
        onTransaction: () => selection(),
        onFocus: () => selection(),
        onBlur: ({ event }) => blur(event),
    });
}

/** The value to store, null when the editor is empty. */
export function valueOf(editor) {
    return editor.isEmpty ? null : clean(editor.getJSON());
}
