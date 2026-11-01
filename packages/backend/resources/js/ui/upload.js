import { LitElement } from 'lit';
import { refresh as refreshParts, runAction } from './action.js';
import { showToast } from './toast.js';

/** The image types the media library takes (decision 0126). */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function meta(name) {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
}

function failedText() {
    return document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
}

/**
 * Uploads one file and adds it to the media library: the file goes to
 * the upload address, its token to media.create. Returns { ok, data,
 * problem } like runAction(); data is the new medium, problem.errors a
 * list of { pointer, message }.
 */
export async function uploadMedium(url, file, folderId = null) {
    const body = new FormData();
    body.append('file', file, file.name);
    let response;
    let answer = null;

    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { Accept: 'application/json', 'X-CSRF-Token': meta('fb-csrf') },
            credentials: 'same-origin',
            body,
        });
        answer = await response.json().catch(() => null);
    } catch {
        return { ok: false, data: null, problem: { detail: failedText(), errors: {} } };
    }

    if (!response.ok) {
        return { ok: false, data: null, problem: { detail: answer?.detail ?? failedText(), errors: answer?.errors ?? [], status: response.status } };
    }

    return runAction('media.create', { upload: answer.data.upload, folderId: folderId || null });
}

/**
 * <fb-upload>: uploads images into the media library, by a button inside
 * it with data-fb-upload or by dropping files onto it (decision 0126).
 *
 *     <fb-upload url="/cms/uploads" folder="01J…" refresh="media-grid" done="Uploaded" progress="Uploading {done} of {total} …">
 *         … <button data-fb-upload>Upload</button> … <p data-fb-upload-status role="status"></p>
 *     </fb-upload>
 *
 * - url: where the files go first
 * - folder: the folder of the new media, empty for none
 * - refresh: ids of elements to load again afterwards
 * - label: the text shown while files are dragged over it
 * - progress and done: texts for the status and the toast
 * - disabled: no uploads, e.g. without the permission
 *
 * Errors appear as an alert above the content, one line per file.
 * Fires "fb-uploaded" with detail.media, the new media.
 */
export class Upload extends LitElement {
    static properties = {
        url: {},
        folder: {},
        refresh: {},
        label: {},
        progress: {},
        done: {},
        disabled: { type: Boolean, reflect: true },
        dragging: { type: Boolean, reflect: true },
        busy: { type: Boolean, reflect: true },
    };

    constructor() {
        super();
        this.url = '';
        this.folder = '';
        this.refresh = '';
        this.label = 'Drop images here to upload them';
        this.progress = 'Uploading {done} of {total} …';
        this.done = null;
        this.disabled = false;
        this.dragging = false;
        this.busy = false;
        this.depth = 0;
        this.onClick = this.onClick.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.dataset.fbDropLabel = this.label;
        this.addEventListener('click', this.onClick);
        this.addEventListener('dragenter', this.onDragEnter);
        this.addEventListener('dragover', this.onDragOver);
        this.addEventListener('dragleave', this.onDragLeave);
        this.addEventListener('drop', this.onDrop);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.onClick);
        this.removeEventListener('dragenter', this.onDragEnter);
        this.removeEventListener('dragover', this.onDragOver);
        this.removeEventListener('dragleave', this.onDragLeave);
        this.removeEventListener('drop', this.onDrop);
        super.disconnectedCallback();
    }

    /** Opens the file dialog of the browser. */
    choose() {
        if (this.disabled || this.busy) {
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = IMAGE_TYPES.join(',');
        input.addEventListener('change', () => this.upload([...(input.files ?? [])]));
        input.click();
    }

    onClick(event) {
        if (event.target instanceof Element && event.target.closest('[data-fb-upload]')?.closest('fb-upload') === this) {
            event.preventDefault();
            this.choose();
        }
    }

    hasFiles(event) {
        return !this.disabled && [...(event.dataTransfer?.types ?? [])].includes('Files');
    }

    onDragEnter(event) {
        if (this.hasFiles(event)) {
            event.preventDefault();
            this.depth++;
            this.dragging = true;
        }
    }

    onDragOver(event) {
        if (this.hasFiles(event)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    onDragLeave() {
        this.depth = Math.max(0, this.depth - 1);
        this.dragging = this.depth > 0;
    }

    onDrop(event) {
        if (!this.hasFiles(event)) {
            return;
        }

        event.preventDefault();
        this.depth = 0;
        this.dragging = false;
        this.upload([...event.dataTransfer.files]);
    }

    status(text) {
        const status = this.querySelector('[data-fb-upload-status]');

        if (status) {
            status.textContent = text;
        }
    }

    /** Uploads the files one after another. */
    async upload(files) {
        if (files.length === 0 || this.busy) {
            return;
        }

        this.busy = true;
        this.querySelector(':scope > .fb-alert')?.remove();
        const media = [];
        const problems = [];

        for (const [index, file] of files.entries()) {
            this.status(this.progress.replace('{done}', String(index + 1)).replace('{total}', String(files.length)));
            const result = await uploadMedium(this.url, file, this.folder);

            if (result.ok) {
                media.push(result.data);
            } else {
                // The message of the file itself says more than "check the fields".
                problems.push(`${file.name}: ${result.problem.errors?.[0]?.message ?? result.problem.detail}`);
            }
        }

        this.busy = false;
        this.status('');

        if (problems.length > 0) {
            this.showProblems(problems);
        }

        if (media.length === 0) {
            return;
        }

        this.dispatchEvent(new CustomEvent('fb-uploaded', { detail: { media }, bubbles: true }));

        if (this.refresh) {
            await refreshParts(this.refresh.split(/\s+/).filter((id) => id !== ''));
        }

        if (this.done && problems.length === 0) {
            showToast(this.done);
        }
    }

    showProblems(problems) {
        const alert = document.createElement('div');
        alert.className = 'fb-alert';
        alert.dataset.tone = 'danger';
        alert.setAttribute('role', 'alert');
        const list = document.createElement('ul');

        for (const problem of problems) {
            const item = document.createElement('li');
            item.textContent = problem;
            list.append(item);
        }

        alert.append(list);
        this.prepend(alert);
    }
}

customElements.define('fb-upload', Upload);
