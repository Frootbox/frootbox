/**
 * Rich text on the website (decision 0122): Tiptap right on the element
 * of the field, with the nodes and marks of the rich-text schema of the
 * server (decision 0097). Loaded on the first focus of such a field, as
 * a chunk of its own.
 */
import { Editor, Extension, mergeAttributes } from '@tiptap/core';
import Heading from '@tiptap/extension-heading';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';

/**
 * The levels the page gives the headings of a document, by the rule of
 * the core: each rank wants its level, none skips one after the heading
 * before, none goes above the floor, and only one h1.
 */
function levelsOf(ranks, { wanted, last, floor, main }) {
    return ranks.map((rank) => {
        let level = Math.max(Math.min(Math.max(1, wanted[rank - 1] ?? wanted.at(-1)), last + 1), floor);
        level = Math.min(main && level === 1 ? 2 : level, 6);
        last = level;
        main = main || level === 1;

        return level;
    });
}

/** What the page gives the field, see Headings::flow() in the core. */
function flowOf(element) {
    try {
        const flow = JSON.parse(element.dataset.fbHeadingFlow ?? '');

        if (Array.isArray(flow.wanted) && flow.wanted.length > 0) {
            return { wanted: flow.wanted.map(Number), last: Number(flow.last) || 0, floor: Number(flow.floor) || 1, main: Boolean(flow.main) };
        }
    } catch {
        // Without it the headings start below an h1.
    }

    return { wanted: [2, 3, 4], last: 1, floor: 1, main: true };
}

const rankOf = (node, levels) => levels.includes(node.attrs.level) ? node.attrs.level : levels[0];

const levelOf = (decorations) => decorations.find((decoration) => decoration.spec.headingLevel)?.spec.headingLevel;

/**
 * Headings store their rank (decision 0129): 1 „Überschrift“, 2
 * „Unterüberschrift“, 3 „Kleine Überschrift“. The page decides the level,
 * the editor shows each at the level visitors get: a decoration carries
 * it, and the node view makes the element of that level.
 */
const RankedHeading = Heading.extend({
    addOptions() {
        return { ...this.parent?.(), levels: [1, 2, 3], flow: { wanted: [2, 3, 4], last: 1, floor: 1, main: true } };
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

    // Copying: the level the rank wants; pasting reads the rank.
    renderHTML({ node, HTMLAttributes }) {
        const rank = rankOf(node, this.options.levels);
        const level = Math.max(1, Math.min(6, this.options.flow.wanted[rank - 1] ?? 2));

        return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-rank': rank }), 0];
    },

    addNodeView() {
        return ({ node, decorations, HTMLAttributes }) => {
            const rank = rankOf(node, this.options.levels);
            const level = levelOf(decorations) ?? levelsOf([rank], this.options.flow)[0];
            const dom = document.createElement(`h${level}`);

            for (const [name, value] of Object.entries(mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-rank': rank }))) {
                if (value !== null && value !== undefined) {
                    dom.setAttribute(name, String(value));
                }
            }

            // Another rank, direction or level makes a new element.
            return {
                dom,
                contentDOM: dom,
                update: (updated, next) => updated.type === node.type && rankOf(updated, this.options.levels) === rank
                    && updated.attrs.dir === node.attrs.dir && (levelOf(next) ?? level) === level,
            };
        };
    },

    addProseMirrorPlugins() {
        const extension = this;
        const decorate = (doc) => {
            const headings = [];
            doc.descendants((node, pos) => {
                if (node.type.name === extension.name) {
                    headings.push({ node, pos });
                }

                return !node.isTextblock;
            });
            const levels = levelsOf(headings.map(({ node }) => rankOf(node, extension.options.levels)), extension.options.flow);

            return DecorationSet.create(doc, headings.map(({ node, pos }, index) => Decoration.node(pos, pos + node.nodeSize, {}, { headingLevel: levels[index] })));
        };

        return [...this.parent?.() ?? [], new Plugin({
            key: new PluginKey('headingLevels'),
            state: {
                init: (_, state) => decorate(state.doc),
                apply: (transaction, set) => transaction.docChanged ? decorate(transaction.doc) : set,
            },
            props: {
                decorations(state) {
                    return this.getState(state);
                },
            },
        })];
    },
});

/** Blocks that may run the other way than the text around them (decision 0133). */
const DIRECTIONAL = ['paragraph', 'heading', 'blockquote'];

/**
 * An optional "dir" on paragraphs, headings and quotes, stored only where
 * a block runs the other way, e.g. an English quote in Arabic text.
 */
const BlockDirection = Extension.create({
    name: 'blockDirection',

    addGlobalAttributes() {
        return [{
            types: DIRECTIONAL,
            attributes: {
                dir: {
                    default: null,
                    parseHTML: (element) => (['ltr', 'rtl'].includes(element.getAttribute('dir')) ? element.getAttribute('dir') : null),
                    renderHTML: (attributes) => (attributes.dir ? { dir: attributes.dir } : {}),
                },
            },
        }];
    },

    addCommands() {
        return {
            // The other direction than the field, or back to the one of the field.
            toggleBlockDirection: () => ({ editor, state, tr }) => {
                const back = hasOtherDirection(editor);
                const other = getComputedStyle(editor.view.dom).direction === 'rtl' ? 'ltr' : 'rtl';
                const { from, to } = state.selection;

                tr.doc.nodesBetween(from, to, (node, pos) => {
                    if (DIRECTIONAL.includes(node.type.name)) {
                        tr.setNodeMarkup(pos, undefined, { ...node.attrs, dir: back ? null : other });
                    }
                });

                return true;
            },
        };
    },
});

/** Whether the text at the cursor runs the other way than the field. */
function hasOtherDirection(editor) {
    const { $from } = editor.state.selection;

    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);

        if (DIRECTIONAL.includes(node.type.name) && node.attrs.dir) {
            return true;
        }
    }

    return false;
}

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
    const flow = flowOf(element);

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
            ...ranks.length > 0 ? [RankedHeading.configure({ levels: ranks, flow })] : [],
            BlockDirection,
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
