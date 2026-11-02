import { LitElement } from 'lit';
import { refresh as refreshParts, runAction } from './action.js';
import { DOCUMENT_TYPES, IMAGE_TYPES, VIDEO_TYPES, sendInParts } from './parts.js';
import { showToast } from './toast.js';

export { DOCUMENT_TYPES, IMAGE_TYPES, VIDEO_TYPES };

function meta(name) {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
}

function failedText() {
    return document.body?.dataset.fbFailed || 'The server cannot be reached. Check the connection and try again.';
}

/**
 * Sends one file to the upload address in parts (decision 0177) and
 * returns { ok, data, problem } with data.upload as the token.
 */
export function sendUpload(url, file, progress = () => {}) {
    return sendInParts(url, file, {
        headers: { 'X-CSRF-Token': meta('fb-csrf') },
        partBytes: meta('fb-upload-part'),
        failed: failedText(),
        progress,
    });
}

/**
 * Uploads one file and adds it to the media library: the file goes to
 * the upload address in parts, its token to media.create, to
 * media.replace with the id of a medium in replace (decision 0146) or to
 * media.source-add with the id of a video in source (decision 0177).
 * Returns { ok, data, problem } like runAction(); data is the medium,
 * problem.errors a list of { pointer, message }.
 */
export async function uploadMedium(url, file, folderId = null, replace = null, source = null, progress = () => {}) {
    const sent = await sendUpload(url, file, progress);

    if (!sent.ok) {
        return sent;
    }

    if (source) {
        return runAction('media.source-add', { id: source, upload: sent.data.upload });
    }

    if (replace) {
        return runAction('media.replace', { id: replace, upload: sent.data.upload });
    }

    return runAction('media.create', { upload: sent.data.upload, folderId: folderId || null });
}

/**
 * <fb-upload>: uploads images and videos into the media library, by a button inside
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
 * - existing: the note for a file that is already in the library, with
 *   {name} (decision 0146); such a file is not added a second time
 * - replace: the id of a medium whose file one file replaces
 *   (media.replace) instead of adding new ones
 * - source: the id of a video that gets one more file in another format
 *   (media.source-add, decision 0177)
 * - accept: "image", "video", "document" or empty for all
 *
 * Files go in parts (decision 0177); the status shows the percentage of
 * the current file with {percent} in progress.
 *
 * Errors appear as an alert above the content, one line per file, notes
 * on files already in the library as a calm alert. Fires "fb-uploaded"
 * with detail.media, the new media.
 */
export class Upload extends LitElement {
    static properties = {
        url: {},
        folder: {},
        refresh: {},
        label: {},
        progress: {},
        done: {},
        existing: {},
        replace: {},
        source: {},
        accept: {},
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
        this.existing = '{name} is already in the media library.';
        this.replace = '';
        this.source = '';
        this.accept = '';
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
        input.multiple = !this.replace && !this.source;
        input.accept = this.types().join(',');
        input.addEventListener('change', () => this.upload([...(input.files ?? [])]));
        input.click();
    }

    types() {
        return { image: IMAGE_TYPES, video: VIDEO_TYPES, document: DOCUMENT_TYPES }[this.accept] ?? [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOCUMENT_TYPES];
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

        // One file replaces one file, a video gets one file at a time.
        files = this.replace || this.source ? files.slice(0, 1) : files;

        this.busy = true;
        this.querySelectorAll(':scope > .fb-alert').forEach((alert) => alert.remove());
        const media = [];
        const problems = [];
        const known = [];

        for (const [index, file] of files.entries()) {
            const text = (percent) => this.progress.replace('{done}', String(index + 1)).replace('{total}', String(files.length)).replace('{percent}', String(percent));
            this.status(text(0));
            const result = await uploadMedium(this.url, file, this.folder, this.replace || null, this.source || null, (sent, total) => this.status(text(Math.round((sent / Math.max(1, total)) * 100))));

            if (result.ok && result.data.existing) {
                known.push(this.existing.replace('{name}', result.data.fileName));
            } else if (result.ok) {
                media.push(result.data);
            } else {
                // The message of the file itself says more than "check the fields".
                problems.push(`${file.name}: ${result.problem.errors?.[0]?.message ?? result.problem.detail}`);
            }
        }

        this.busy = false;
        this.status('');

        if (known.length > 0) {
            this.showAlert(known, 'info');
        }

        if (problems.length > 0) {
            this.showAlert(problems, 'danger');
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

    showAlert(lines, tone) {
        const alert = document.createElement('div');
        alert.className = 'fb-alert';
        alert.dataset.tone = tone;
        alert.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
        const list = document.createElement('ul');

        for (const line of lines) {
            const item = document.createElement('li');
            item.textContent = line;
            list.append(item);
        }

        alert.append(list);
        this.prepend(alert);
    }
}

customElements.define('fb-upload', Upload);
