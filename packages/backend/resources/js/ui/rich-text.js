// SPDX-License-Identifier: MIT
import { html, nothing, render } from 'lit';
import { icon } from '../edit/icons.js';

const LABELS = {
    formatting: 'Formatting',
    heading: 'Heading',
    subheading: 'Subheading',
    bold: 'Bold',
    italic: 'Italic',
    list: 'List',
    ordered: 'Numbered list',
    quote: 'Quote',
    link: 'Link',
    address: 'Address of the link',
    apply: 'Apply',
    remove: 'Remove the link',
    cancel: 'Cancel',
    loading: 'Loading the editor …',
};

const TOOLS = [
    { name: 'heading', icon: 'heading', active: (editor) => editor.isActive('heading', { level: 1 }), run: (chain) => chain.toggleHeading({ level: 1 }) },
    { name: 'subheading', icon: 'heading', small: true, active: (editor) => editor.isActive('heading', { level: 2 }), run: (chain) => chain.toggleHeading({ level: 2 }) },
    { name: 'bold', icon: 'bold', active: (editor) => editor.isActive('bold'), run: (chain) => chain.toggleBold() },
    { name: 'italic', icon: 'italic', active: (editor) => editor.isActive('italic'), run: (chain) => chain.toggleItalic() },
    { name: 'list', icon: 'list', active: (editor) => editor.isActive('bulletList'), run: (chain) => chain.toggleBulletList() },
    { name: 'ordered', icon: 'ordered', active: (editor) => editor.isActive('orderedList'), run: (chain) => chain.toggleOrderedList() },
    { name: 'quote', icon: 'quote', active: (editor) => editor.isActive('blockquote'), run: (chain) => chain.toggleBlockquote() },
];

/**
 * <fb-rich-text>: rich text in a form of the backend (decision 0220),
 * with the editor of the editing mode and the nodes of the server. The
 * hidden field inside holds the document as JSON and goes with the form:
 *
 *     <fb-rich-text labelledby="article-text-label" labels='{"bold": "Fett", …}'>
 *         <input type="hidden" name="translations.de.text" data-type="json" value='{"type": "doc", "content": []}'>
 *     </fb-rich-text>
 *
 * - labelledby: the id of the label of the field
 * - labels: the texts, see LABELS
 * - lang and dir on the element count for the text
 *
 * Tiptap loads on the first connection as a chunk of its own. The
 * element is in the light DOM, so the editor works in every browser.
 */
export class RichTextInput extends HTMLElement {
    connectedCallback() {
        if (this.started) {
            return;
        }

        this.started = true;
        this.input = this.querySelector('input');
        this.labels = { ...LABELS, ...JSON.parse(this.getAttribute('labels') || '{}') };
        this.linking = null;
        this.frame = document.createElement('div');
        this.frame.className = 'fb-rich-text__frame';
        this.append(this.frame);
        this.paint();
        this.load();
    }

    disconnectedCallback() {
        // An element that moves stays; one that is gone frees the editor.
        queueMicrotask(() => {
            if (!this.isConnected) {
                this.editor?.destroy();
                this.editor = null;
                this.started = false;
                this.frame?.remove();
            }
        });
    }

    async load() {
        const { clean, contentOf, createEditor } = await import('../edit/richtext.js');
        const content = document.createElement('div');
        content.className = 'fb-rich-text__content';
        content.dataset.fbHeadings = '2';
        this.clean = clean;
        this.content = content;

        let value = null;

        try {
            value = JSON.parse(this.input?.value || 'null');
        } catch {
            value = null;
        }

        this.editor = createEditor(content, contentOf(value), {
            update: () => this.store(),
            selection: () => this.paint(),
            blur: () => this.paint(),
        });

        const element = this.editor.view.dom;
        element.setAttribute('role', 'textbox');
        element.setAttribute('aria-multiline', 'true');

        if (this.hasAttribute('labelledby')) {
            element.setAttribute('aria-labelledby', this.getAttribute('labelledby'));
        }

        if (this.input?.disabled) {
            this.editor.setEditable(false);
        }

        this.paint();
    }

    /** Writes the document into the hidden field, as the form sends it. */
    store() {
        if (!this.input || !this.editor) {
            return;
        }

        this.input.value = JSON.stringify(this.editor.isEmpty ? { type: 'doc', content: [] } : this.clean(this.editor.getJSON()));
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.paint();
    }

    run(tool) {
        tool.run(this.editor.chain().focus()).run();
    }

    openLink() {
        this.linking = { href: this.editor.getAttributes('link').href ?? '' };
        this.paint();
        this.querySelector('.fb-rich-text__link input')?.focus();
    }

    applyLink(event) {
        event.preventDefault();
        const href = this.querySelector('.fb-rich-text__link input')?.value.trim() ?? '';
        const chain = this.editor.chain().focus().extendMarkRange('link');
        (href === '' ? chain.unsetLink() : chain.setLink({ href })).run();
        this.linking = null;
        this.paint();
    }

    closeLink() {
        this.linking = null;
        this.paint();
        this.editor?.commands.focus();
    }

    onLinkKey(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeLink();
        }
    }

    paint() {
        const editor = this.editor;
        const labels = this.labels;
        const disabled = !editor || this.input?.disabled;

        render(html`
            <div class="fb-rich-text__toolbar" role="toolbar" aria-label=${labels.formatting}>
                ${TOOLS.map((tool) => html`<button class="fb-rich-text__tool${tool.small ? ' fb-rich-text__tool--small' : ''}" type="button" title=${labels[tool.name]} aria-label=${labels[tool.name]}
                    aria-pressed=${editor ? String(tool.active(editor)) : 'false'} ?disabled=${disabled} @mousedown=${(event) => event.preventDefault()} @click=${() => this.run(tool)}>${icon(tool.icon)}</button>`)}
                <button class="fb-rich-text__tool" type="button" title=${labels.link} aria-label=${labels.link} aria-pressed=${editor ? String(editor.isActive('link')) : 'false'}
                    ?disabled=${disabled} @mousedown=${(event) => event.preventDefault()} @click=${() => this.openLink()}>${icon('link')}</button>
            </div>
            ${this.linking ? html`<div class="fb-rich-text__link" @keydown=${(event) => this.onLinkKey(event)}>
                <input class="fb-input" type="url" dir="ltr" aria-label=${labels.address} placeholder="https://" .value=${this.linking.href} @keydown=${(event) => event.key === 'Enter' && this.applyLink(event)}>
                <button class="fb-button fb-button--primary fb-button--small" type="button" @click=${(event) => this.applyLink(event)}>${labels.apply}</button>
                ${this.linking.href ? html`<button class="fb-button fb-button--ghost fb-button--small" type="button" @click=${() => { this.querySelector('.fb-rich-text__link input').value = ''; this.applyLink(new Event('click')); }}>${labels.remove}</button>` : nothing}
                <button class="fb-button fb-button--ghost fb-button--small" type="button" @click=${() => this.closeLink()}>${labels.cancel}</button>
            </div>` : nothing}
            ${editor ? nothing : html`<p class="fb-rich-text__status" role="status">${labels.loading}</p>`}
        `, this.frame);

        if (this.content && this.content.parentNode !== this.frame) {
            this.frame.append(this.content);
        }
    }
}

customElements.define('fb-rich-text', RichTextInput);
