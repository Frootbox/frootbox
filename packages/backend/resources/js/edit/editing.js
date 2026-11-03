/**
 * Editing of fields on the website (decision 0122): headline and text
 * right in the element, rich text with Tiptap, links and images with a
 * dialog of the bar (decision 0126). Every change is saved on its own with page.update-field,
 * or site.update-field for fields of the website (decision 0128), a second after the last
 * input and when the field is left.
 */

import { follow, linkOf } from './field-tools.js';

const PLAIN = ['headline', 'text'];
const DELAY = 1000;

/** The stored value of a marked field, from data-fb-value. */
export function storedValue(element) {
    if (element.dataset.fbValue === undefined) {
        return null;
    }

    try {
        return JSON.parse(element.dataset.fbValue);
    } catch {
        return null;
    }
}

/** Whether two values are the same as JSON, whatever the order of keys. */
export function same(a, b) {
    return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}

function sorted(value) {
    if (Array.isArray(value)) {
        return value.map(sorted);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])]));
    }

    return value ?? null;
}

/** The text of a plain field as the type stores it, null when empty. */
function plainValue(element) {
    const single = element.dataset.fbType === 'headline';
    let text = element.innerText.replace(/ /g, ' ').replace(/\n+$/, '');

    if (single) {
        text = text.replace(/\s*\n\s*/g, ' ');
    }

    return text === '' ? null : text;
}

export class Editing {
    constructor(bar) {
        this.bar = bar;
        this.saved = new WeakMap();
        this.timers = new Map();
        this.queues = new WeakMap();
        this.editors = new WeakMap();
        this.contents = new WeakMap();
        this.loading = null;
        this.pointer = null;

        this.onFocus = (event) => this.focus(event);
        this.onBlur = (event) => this.blur(event);
        this.onInput = (event) => this.input(event);
        this.onKey = (event) => this.key(event);
        this.onClick = (event) => this.click(event);
        this.onPointer = (event) => { this.pointer = { left: event.clientX, top: event.clientY, at: Date.now() }; };
        this.onLeave = (event) => this.leave(event);
    }

    start() {
        for (const element of document.querySelectorAll('[data-fb-field]')) {
            if (PLAIN.includes(element.dataset.fbType)) {
                element.contentEditable = 'plaintext-only';
            }
        }

        document.addEventListener('focusin', this.onFocus, true);
        document.addEventListener('focusout', this.onBlur, true);
        document.addEventListener('input', this.onInput, true);
        document.addEventListener('keydown', this.onKey, true);
        document.addEventListener('click', this.onClick, true);
        document.addEventListener('pointerdown', this.onPointer, true);
        addEventListener('beforeunload', this.onLeave);
    }

    stop() {
        document.removeEventListener('focusin', this.onFocus, true);
        document.removeEventListener('focusout', this.onBlur, true);
        document.removeEventListener('input', this.onInput, true);
        document.removeEventListener('keydown', this.onKey, true);
        document.removeEventListener('click', this.onClick, true);
        document.removeEventListener('pointerdown', this.onPointer, true);
        removeEventListener('beforeunload', this.onLeave);
    }

    field(target) {
        return target instanceof Element ? target.closest('[data-fb-field]') : null;
    }

    /**
     * The elements of one field: itself and those of its parts, in the
     * same block (decision 0203); a field of an object wherever the page
     * shows that object (decision 0241).
     */
    twins(element) {
        const site = element.dataset.fbSite !== undefined;
        const object = element.dataset.fbObject;
        const block = element.closest('[data-fb-block]');
        const all = [...document.querySelectorAll(`[data-fb-field="${CSS.escape(element.dataset.fbField)}"]`)]
            .filter((item) => object !== undefined
                ? item.dataset.fbObject === object
                : item.dataset.fbObject === undefined && (item.dataset.fbSite !== undefined) === site && (site || item.closest('[data-fb-block]') === block));

        return all.includes(element) ? all : [element, ...all];
    }

    /** The value saved last, at first the one the page came with. */
    savedValue(element) {
        return this.saved.has(element) ? this.saved.get(element) : storedValue(element);
    }

    focus(event) {
        const element = this.field(event.target);

        if (['richtext', 'table'].includes(element?.dataset.fbType) && !this.editors.has(element)) {
            this.richText(element);
        }
    }

    blur(event) {
        const element = this.field(event.target);

        if (element && PLAIN.includes(element.dataset.fbType)) {
            this.flush(element);
        }
    }

    input(event) {
        const element = this.field(event.target);

        if (element && PLAIN.includes(element.dataset.fbType)) {
            // Browsers leave a <br> in a field emptied by hand; without it the placeholder shows again.
            if (plainValue(element) === null && element.childNodes.length > 0) {
                element.replaceChildren();
            }

            this.later(element, () => plainValue(element));
        }
    }

    key(event) {
        const element = this.field(event.target);

        if (!element) {
            return;
        }

        const type = element.dataset.fbType;

        if (PLAIN.includes(type)) {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.cancel(element);
                element.innerText = this.savedValue(element) ?? '';
                element.blur();
            } else if (event.key === 'Enter' && type === 'headline') {
                event.preventDefault();
                element.blur();
            }
        } else if (type === 'link' && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.editLink(element);
        } else if (['image', 'video', 'file'].includes(type) && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.editImage(element);
        } else if (type === 'icon' && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.editIcon(element);
        } else if (['richtext', 'table'].includes(type) && event.key === 'F10' && event.altKey) {
            // Alt+F10 reaches the toolbar from the keyboard.
            event.preventDefault();
            this.bar.focusToolbar();
        } else if (['richtext', 'table'].includes(type) && event.key === 'Escape') {
            const editor = this.editors.get(element);

            if (editor) {
                event.preventDefault();
                this.cancel(element);
                editor.commands.setContent(this.contents.get(element)(this.savedValue(element)), { emitUpdate: false });
                editor.commands.blur();
                element.blur();
            }
        }
    }

    click(event) {
        const element = this.field(event.target);
        const anchor = event.target instanceof Element ? event.target.closest('a') : null;

        // Links lead nowhere in the mode where they hold or are a field.
        if (anchor && (element || anchor.querySelector('[data-fb-field]'))) {
            event.preventDefault();
        }

        if (element?.dataset.fbType === 'link' && (event.ctrlKey || event.metaKey)) {
            // Ctrl-click or Cmd-click follows the link like in the browser (decision 0150).
            event.preventDefault();
            follow(linkOf(element), true);
        } else if (element?.dataset.fbType === 'link') {
            event.preventDefault();
            this.editLink(element);
        } else if (['image', 'video', 'file'].includes(element?.dataset.fbType)) {
            event.preventDefault();
            this.editImage(element);
        } else if (element?.dataset.fbType === 'icon') {
            event.preventDefault();
            this.editIcon(element);
        }
    }

    leave(event) {
        const pending = this.timers.size > 0;
        this.flushAll();

        if (pending || this.bar.saving > 0) {
            event.preventDefault();
        }
    }

    /** Saves all pending changes, e.g. before undo or publishing. */
    flushAll() {
        const saves = [...this.timers.keys()].map((element) => this.flush(element));

        return Promise.all(saves);
    }

    /** Saves a second after the last change. */
    later(element, read) {
        clearTimeout(this.timers.get(element)?.timer);
        this.timers.set(element, { read, timer: setTimeout(() => this.flush(element), DELAY) });
    }

    /** Saves a pending change right away. */
    flush(element) {
        const pending = this.timers.get(element);

        if (!pending) {
            return Promise.resolve(true);
        }

        clearTimeout(pending.timer);
        this.timers.delete(element);

        return this.save(element, pending.read());
    }

    cancel(element) {
        clearTimeout(this.timers.get(element)?.timer);
        this.timers.delete(element);
    }

    /** One save after the other per field, each with the value saved before. */
    save(element, value) {
        const queue = (this.queues.get(element) ?? Promise.resolve()).then(() => this.send(element, value));
        this.queues.set(element, queue.catch(() => {}));

        return queue;
    }

    async send(element, value) {
        const previous = this.savedValue(element);

        if (same(previous, value)) {
            return true;
        }

        // Fields of the website, e.g. in the footer, are the same on every page (decision 0128).
        const site = element.dataset.fbSite !== undefined;
        // Further fields of an object go into its draft (decision 0241).
        const object = element.dataset.fbObject ?? null;
        const result = object
            ? await this.bar.run('object.update-field', {
                target: object,
                language: element.dataset.fbLanguage ?? this.bar.config.language,
                name: element.dataset.fbField,
                value,
                previous,
            })
            : site
            ? await this.bar.run('site.update-field', {
                language: this.bar.config.language,
                path: element.dataset.fbField,
                value,
                previous,
            })
            : await this.bar.run('page.update-field', {
                id: this.bar.config.page.id,
                language: this.bar.config.language,
                path: element.dataset.fbField,
                block: element.closest('[data-fb-block]')?.dataset.fbBlock ?? null,
                value,
                previous,
            });

        if (!result.ok) {
            return false;
        }

        const data = result.data;

        // The field itself and its parts, e.g. the caption of an image (decision 0203).
        for (const twin of this.twins(element)) {
            this.saved.set(twin, data.value);

            if (data.value === null) {
                delete twin.dataset.fbValue;
            } else {
                twin.dataset.fbValue = JSON.stringify(data.value);
            }

            if (twin.dataset.fbPart !== undefined) {
                twin.innerHTML = data.parts?.[twin.dataset.fbPart] ?? '';
            } else if (['link', 'image', 'video', 'icon', 'file'].includes(twin.dataset.fbType)) {
                twin.innerHTML = data.html;
            }
        }

        this.bar.changed(data.entry, site, object);

        // A field publishing found missing is no longer marked once it has a value (decision 0143).
        if (data.value !== null) {
            this.bar.solved(element);
        }

        return true;
    }

    editLink(element) {
        const value = this.savedValue(element) ?? {};

        this.bar.openLink({
            withText: true,
            text: value.text ?? '',
            href: value.target ?? value.url ?? '',
            newWindow: value.newWindow === true,
            apply: ({ text, href, newWindow }) => {
                const link = href.startsWith('page:') ? { target: href } : { url: href };

                if (text) {
                    link.text = text;
                }

                if (newWindow) {
                    link.newWindow = true;
                }

                this.save(element, link);
            },
            remove: () => this.save(element, null),
            done: () => element.focus(),
            openUrl: linkOf(element),
        });
    }

    /** Images, videos (decision 0177) and documents (decision 0179) all come from the media library. */
    editImage(element) {
        this.bar.media.open({
            kind: ['video', 'file'].includes(element.dataset.fbType) ? element.dataset.fbType : 'image',
            value: this.savedValue(element),
            // Caption and copyright are parts of an image field (decision 0203).
            caption: (element.dataset.fbParts ?? '').split(' ').includes('caption'),
            focus: element.dataset.fbPart ?? null,
            apply: (value) => this.save(element, value),
            remove: () => this.save(element, null),
            done: () => element.focus(),
        });
    }

    /** A symbol of the theme (decision 0179). */
    editIcon(element) {
        this.bar.icons.open({
            value: this.savedValue(element),
            apply: (name) => this.save(element, name),
            remove: () => this.save(element, null),
            done: () => element.focus(),
        });
    }

    /** Rich text with Tiptap, a table with Tiptap and prosemirror-tables (decision 0187). */
    async richText(element) {
        const table = element.dataset.fbType === 'table';
        const module = table ? (this.tableLoading ??= import('./table.js')) : (this.loading ??= import('./richtext.js'));
        const { createEditor, valueOf, contentOf } = await module;

        if (this.editors.has(element)) {
            return;
        }

        // Only a click that just happened, not one before a Tab.
        const pointer = this.pointer && Date.now() - this.pointer.at < 2000 ? this.pointer : null;
        const editor = createEditor(element, this.savedValue(element), {
            update: () => this.later(element, () => valueOf(editor)),
            selection: () => this.bar.showToolbar(editor),
            blur: (event) => {
                // Focus that moves into the bar keeps the toolbar.
                if (event.relatedTarget === this.bar) {
                    return;
                }

                this.flush(element);
                this.bar.hideToolbar(editor);
            },
        });

        this.editors.set(element, editor);
        this.contents.set(element, contentOf);

        // The element had the focus before Tiptap listened: focus it anew,
        // with the cursor where the click was and without scrolling.
        const position = pointer ? editor.view.posAtCoords(pointer) : null;
        element.blur();
        editor.commands.focus(position ? position.pos : 'end', { scrollIntoView: false });
    }
}
