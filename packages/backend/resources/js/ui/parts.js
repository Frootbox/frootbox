/** The image and video types the media library takes (decisions 0126, 0177). */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];

/** Documents by extension (decision 0179): browsers name the type of CSV and Office files differently. */
export const DOCUMENT_TYPES = ['.pdf', '.docx', '.xlsx', '.pptx', '.odt', '.ods', '.odp', '.txt', '.csv', '.zip'];

/** Parts when the server names no size. */
const DEFAULT_PART = 2 * 1024 * 1024;

/** Tries per part before giving up, e.g. on a flaky connection. */
const TRIES = 3;

/**
 * Sends a file to the upload address in parts (decision 0177), so large
 * videos also arrive where post_max_size is small. Each part carries the
 * size of the whole file and where it starts; a part the server answers
 * with 409 goes on at its Upload-Offset. progress(sent, total) follows the
 * bytes. Returns { ok, data, problem } with data as the answer of the last
 * part ({ upload, name, size }) and problem as { detail, errors, status }.
 */
export async function sendInParts(url, file, { headers = {}, partBytes = DEFAULT_PART, progress = () => {}, failed = 'The server cannot be reached.' } = {}) {
    const size = Math.max(4096, Number(partBytes) || DEFAULT_PART);
    let offset = 0;
    let token = null;
    let tries = 0;

    for (;;) {
        const body = new FormData();
        body.append('file', file.slice(offset, offset + size), file.name);
        body.append('name', file.name);
        body.append('total', String(file.size));
        body.append('offset', String(offset));

        if (token) {
            body.append('upload', token);
        }

        let response = null;
        let answer = null;

        try {
            response = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', ...headers }, credentials: 'same-origin', body });
            answer = await response.json().catch(() => null);
        } catch {
            response = null;
        }

        if (response?.status === 409 && response.headers.has('Upload-Offset') && tries < TRIES) {
            // The server has a different part: go on where it stands.
            offset = Number(response.headers.get('Upload-Offset'));
            tries++;
            continue;
        }

        if (!response && tries < TRIES) {
            tries++;
            continue;
        }

        if (!response?.ok) {
            return { ok: false, data: null, problem: { detail: answer?.detail ?? failed, errors: answer?.errors ?? [], status: response?.status ?? 0 } };
        }

        tries = 0;
        token = answer.data.upload;
        offset = answer.data.complete === false ? answer.data.received : file.size;
        progress(Math.min(offset, file.size), file.size);

        if (answer.data.complete !== false) {
            return { ok: true, data: answer.data, problem: null };
        }
    }
}
