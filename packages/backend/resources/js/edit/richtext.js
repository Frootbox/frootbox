/**
 * Rich text on the website (decision 0122): Tiptap right on the element
 * of the field, with the nodes and marks of the rich-text schema of the
 * server (decision 0097). Loaded on the first focus of such a field, as
 * a chunk of its own.
 */
import { Editor, mergeAttributes } from '@tiptap/core';
import Heading from '@tiptap/extension-heading';
import StarterKit from '@tiptap/starter-kit';

/**
 * Headings store their rank (decision 0129): 1 „Überschrift“, 2
 * „Unterüberschrift“, 3 „Kleine Überschrift“. The page decides the level,
 * the editor shows them at the one the page gives rank 1, like visitors
 * see them.
 */
const RankedHeading = Heading.extend({
    addOptions() {
        return { ...this.parent?.(), levels: [1, 2, 3], level: 2 };
    },

    parseHTML() {
        // Copied from the page or this editor: the rank, not the level.
        const ranked = [1, 2, 3, 4, 5, 6].map((level) => ({
            tag: `h${level}[data-rank]`,
            priority: 60,
            getAttrs: (element) => {
                const rank = Number(element.getAttribute('data-rank'));

                return this.options.levels.includes(rank) ? { level: rank } : false;
            },
        }));

        return [...ranked, ...this.parent?.() ?? []];
    },

    renderHTML({ node, HTMLAttributes }) {
        const rank = this.options.levels.includes(node.attrs.level) ? node.attrs.level : this.options.levels[0];

        return [`h${Math.min(6, this.options.level + rank - 1)}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-rank': rank }), 0];
    },
});

/** The ranks a field offers, from data-fb-headings (3 if not given). */
export function ranksOf(element) {
    const count = Math.max(0, Math.min(3, Number(element.dataset.fbHeadings ?? 3)));

    return [1, 2, 3].slice(0, count);
}

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
    const ranks = ranksOf(element);
    const level = Math.max(1, Math.min(6, Number(element.dataset.fbHeadingLevel) || 2));

    return new Editor({
        element: { mount: element },
        content: value ?? EMPTY,
        injectCSS: false,
        extensions: [
            StarterKit.configure({
                trailingNode: false,
                dropcursor: false,
                gapcursor: false,
                heading: false,
                link: {
                    openOnClick: false,
                    autolink: true,
                    defaultProtocol: 'https',
                    // Page links look like "page:01J…" (decision 0105).
                    isAllowedUri: (url, { defaultValidate }) => url.startsWith('page:') || defaultValidate(url),
                    HTMLAttributes: { rel: null, target: null, class: null },
                },
            }),
            // Strg+Alt+1 to 3 and "# " to "### " give the ranks, Strg+Alt+0 text.
            ...ranks.length > 0 ? [RankedHeading.configure({ levels: ranks, level })] : [],
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
