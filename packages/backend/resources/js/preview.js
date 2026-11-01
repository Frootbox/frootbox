// The note for guests with a preview link (decision 0152): "Preview, not
// published yet", until when the link works, and "End the preview". Plain
// DOM without Lit, shielded from the theme like the editor bar (0151).
const source = document.getElementById('fb-preview-config');

class PreviewNote extends HTMLElement {
    connectedCallback() {
        if (this.shadowRoot) {
            return;
        }

        const config = this.config ?? {};
        const labels = config.labels ?? {};
        const root = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `${config.tokens ?? ''}
            :host {
                all: initial !important;
                position: fixed !important;
                inset-block-end: var(--fb-space-4) !important;
                inset-inline-start: 50% !important;
                z-index: var(--fb-layer-edit) !important;
                display: block !important;
                translate: -50% 0 !important;
                max-inline-size: calc(100vw - 2 * var(--fb-space-4)) !important;
            }

            .note {
                display: flex;
                flex-wrap: wrap;
                gap: var(--fb-space-1) var(--fb-space-3);
                align-items: center;
                padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
                border: var(--fb-size-border) solid var(--fb-border);
                border-radius: var(--fb-radius-lg);
                background: var(--fb-surface);
                color: var(--fb-text);
                box-shadow: var(--fb-shadow-lg);
                font-family: var(--fb-font-family);
                font-size: var(--fb-text-sm);
                line-height: var(--fb-leading-normal);
            }

            strong { font-weight: var(--fb-weight-semibold); }

            span { color: var(--fb-text-muted); }

            a {
                display: inline-flex;
                align-items: center;
                min-block-size: var(--fb-size-control-sm);
                padding-inline: var(--fb-space-3);
                border-radius: var(--fb-radius-md);
                background: var(--fb-surface-2);
                color: var(--fb-text);
                font-weight: var(--fb-weight-medium);
                text-decoration: none;
            }

            a:hover { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

            a:focus-visible {
                outline: var(--fb-size-focus) solid var(--fb-focus);
                outline-offset: var(--fb-size-focus-offset);
            }

            @media print { .note { display: none; } }`;

        const note = document.createElement('div');
        note.className = 'note';
        note.setAttribute('role', 'region');
        note.setAttribute('aria-label', labels.region ?? 'Preview');

        const title = document.createElement('strong');
        title.textContent = labels.title ?? '';
        note.append(title);

        const until = new Date(config.expiresAt ?? '');

        if (!Number.isNaN(until.getTime()) && labels.until) {
            const date = new Intl.DateTimeFormat(document.documentElement.lang || undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(until);
            const text = document.createElement('span');
            text.textContent = labels.until.replace('{date}', date);
            note.append(text);
        }

        const end = document.createElement('a');
        end.href = config.end ?? '?fb-preview=0';
        end.textContent = labels.end ?? '';
        note.append(end);

        root.append(style, note);
    }
}

if (source) {
    customElements.define('fb-preview-note', PreviewNote);
    const note = document.createElement('fb-preview-note');
    note.config = JSON.parse(source.textContent ?? '{}');
    document.body.append(note);
}
