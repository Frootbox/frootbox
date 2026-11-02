// SPDX-License-Identifier: MIT
import { LitElement, css, html, nothing } from 'lit';

const LABELS = {
    help: 'Help',
    close: 'Close',
    open: 'Open in the help',
    loading: 'Loading …',
    failed: 'The help could not be loaded. Try again.',
    english: 'This page is only available in English so far.',
};

/** The styles of a help page, also for the screen of the help (see prose.css). */
export const proseStyles = css`
    .prose { display: flex; flex-direction: column; gap: var(--fb-space-3); line-height: var(--fb-leading-normal); }
    .prose > * { margin: 0; }
    .prose h2 { margin-block-start: var(--fb-space-4); font-size: var(--fb-text-lg); font-weight: var(--fb-weight-bold); line-height: var(--fb-leading-snug); }
    .prose h3, .prose h4, .prose h5, .prose h6 { margin-block-start: var(--fb-space-2); font-size: var(--fb-text-md); font-weight: var(--fb-weight-semibold); }
    .prose ul, .prose ol { display: flex; flex-direction: column; gap: var(--fb-space-1); padding-inline-start: var(--fb-space-6); }
    .prose a { color: var(--fb-accent-text); }
    .prose code { padding: 0 var(--fb-space-1); border-radius: var(--fb-radius-sm); background: var(--fb-surface-2); font-family: var(--fb-font-mono); font-size: var(--fb-text-sm); }
    .prose pre { padding: var(--fb-space-3); overflow-x: auto; border-radius: var(--fb-radius-md); background: var(--fb-surface-2); }
    .prose pre code { padding: 0; background: none; }
    .prose blockquote { padding: var(--fb-space-3) var(--fb-space-4); border-inline-start: var(--fb-size-indicator) solid var(--fb-accent); border-radius: var(--fb-radius-sm); background: var(--fb-accent-soft); }
    .prose blockquote > * { margin: 0; }
    .prose img { max-inline-size: 100%; height: auto; border: var(--fb-size-border) solid var(--fb-border); border-radius: var(--fb-radius-md); }
`;

/**
 * <fb-help>: the help about a screen as a panel at its side (decisions
 * 0215, 0218). What is inside opens it, without a script it leads to
 * the page in the help:
 *
 *     <fb-help src="/cms/help/frootbox/backend/pages" labels='{"help": "Hilfe", …}'>
 *         <a href="/cms/help/frootbox/backend/pages">Help</a>
 *     </fb-help>
 *
 * - src: answers with Accept: application/json as
 *   {data: {title, html, url, translated}}; the HTML is safe, the core
 *   wrote it from Markdown
 * - base: links below this path are help pages and open in the panel,
 *   e.g. "/cms/help/"
 * - labels: the texts, see LABELS
 *
 * Links to other help pages open in the panel as well. Escape closes it.
 */
export class Help extends LitElement {
    static properties = {
        src: {},
        base: {},
        labels: { type: Object },
        page: { state: true },
        state: { state: true },
    };

    static styles = [proseStyles, css`
        :host { display: contents; }

        dialog {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(calc(var(--fb-size-dialog) * 0.8), 100%);
            max-width: 100%;
            height: 100%;
            max-height: 100%;
            margin: 0;
            padding: 0;
            border: 0;
            border-inline-start: var(--fb-size-border) solid var(--fb-border);
            background: var(--fb-surface);
            color: var(--fb-text);
            font-family: var(--fb-font-family);
            font-size: var(--fb-text-base);
            box-shadow: var(--fb-shadow-lg);
        }

        :host(:dir(rtl)) dialog { inset: 0 auto 0 0; }

        dialog[open] { display: flex; flex-direction: column; }

        dialog::backdrop { background: var(--fb-backdrop); }

        header {
            display: flex;
            gap: var(--fb-space-3);
            align-items: center;
            justify-content: space-between;
            padding: var(--fb-space-3) var(--fb-space-4) var(--fb-space-3) var(--fb-space-6);
            border-bottom: var(--fb-size-border) solid var(--fb-border);
        }

        h2 { margin: 0; font-size: var(--fb-text-xl); font-weight: var(--fb-weight-bold); line-height: var(--fb-leading-snug); }

        .body { flex: 1; min-height: 0; padding: var(--fb-space-6); overflow-y: auto; }

        .note, .status { margin: 0 0 var(--fb-space-4); color: var(--fb-text-muted); font-size: var(--fb-text-sm); }

        footer { padding: var(--fb-space-3) var(--fb-space-6); border-top: var(--fb-size-border) solid var(--fb-border); font-size: var(--fb-text-sm); }

        footer a { color: var(--fb-accent-text); }

        .close {
            min-height: var(--fb-size-control-sm);
            padding: 0 var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: var(--fb-text-muted);
            font: inherit;
            font-size: var(--fb-text-sm);
            cursor: pointer;
        }

        .close:hover { background: var(--fb-surface-2); color: var(--fb-text); }

        .close:focus-visible, a:focus-visible { outline: var(--fb-size-focus) solid var(--fb-focus); outline-offset: var(--fb-size-focus-offset); }
    `];

    constructor() {
        super();
        this.src = '';
        this.base = '';
        this.labels = {};
        this.page = null;
        this.state = 'idle';
    }

    get text() {
        return { ...LABELS, ...this.labels };
    }

    async open(src = this.src) {
        const dialog = this.renderRoot.querySelector('dialog');

        if (!dialog.open) {
            dialog.showModal();
        }

        this.state = 'loading';

        try {
            const response = await fetch(src, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });

            if (!response.ok) {
                throw new Error(String(response.status));
            }

            this.page = (await response.json()).data;
            this.state = 'done';
            await this.updateComplete;
            this.renderRoot.querySelector('.body').scrollTop = 0;
            this.renderRoot.querySelector('h2')?.focus();
        } catch {
            this.page = null;
            this.state = 'failed';
        }
    }

    close() {
        this.renderRoot.querySelector('dialog')?.close();
    }

    onTrigger(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        event.preventDefault();
        this.open();
    }

    /** Links to other help pages stay in the panel, anchors scroll within it. */
    onBodyClick(event) {
        const link = event.composedPath().find((element) => element instanceof HTMLAnchorElement);

        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const href = link.getAttribute('href') ?? '';

        if (href.startsWith('#')) {
            event.preventDefault();
            this.renderRoot.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ block: 'start' });

            return;
        }

        const url = new URL(link.href, location.href);

        if (this.base && url.origin === location.origin && url.pathname.startsWith(this.base)) {
            event.preventDefault();
            this.open(url.pathname).then(() => url.hash && this.renderRoot.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ block: 'start' }));
        }
    }

    updated() {
        const prose = this.renderRoot.querySelector('.prose');

        // Safe HTML of the core, written from Markdown.
        if (prose && this.page && prose.dataset.url !== this.page.url) {
            prose.innerHTML = this.page.html;
            prose.dataset.url = this.page.url;
        }
    }

    onKey(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.close();
        }
    }

    render() {
        const text = this.text;
        const page = this.page;

        return html`
            <slot @click=${this.onTrigger}></slot>
            <dialog aria-labelledby="title" @keydown=${this.onKey}>
                <header>
                    <h2 id="title" tabindex="-1">${page?.title ?? text.help}</h2>
                    <button class="close" type="button" @click=${this.close}>${text.close}</button>
                </header>
                <div class="body" @click=${this.onBodyClick}>
                    ${this.state === 'loading' ? html`<p class="status" role="status">${text.loading}</p>` : nothing}
                    ${this.state === 'failed' ? html`<p class="status" role="alert">${text.failed}</p>` : nothing}
                    ${page && page.translated === false ? html`<p class="note">${text.english}</p>` : nothing}
                    ${page && this.state === 'done' ? html`<div class="prose"></div>` : nothing}
                </div>
                ${page ? html`<footer><a href=${page.url}>${text.open}</a></footer>` : nothing}
            </dialog>
        `;
    }
}

customElements.define('fb-help', Help);
