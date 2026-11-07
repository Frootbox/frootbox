/*
 * SPDX-License-Identifier: MIT
 */

/**
 * Changes the server has not confirmed yet (decision 0330): each value
 * typed or chosen in a field stays in the browser until it is saved, so
 * a lost session, a dropped connection or a crash loses nothing. The
 * editor offers them again after loading the page.
 */

const PREFIX = 'fb-unsaved:';
const DAYS = 7;

export class Unsaved {
    constructor(user) {
        this.key = user ? `${PREFIX}${user}` : null;
    }

    /** All kept changes by field, without those that expired. */
    all() {
        if (!this.key) {
            return {};
        }

        let entries = {};

        try {
            entries = JSON.parse(localStorage.getItem(this.key) ?? '{}') ?? {};
        } catch {
            return {};
        }

        const oldest = Date.now() - DAYS * 24 * 60 * 60 * 1000;
        const fresh = Object.fromEntries(Object.entries(entries).filter(([, entry]) => entry && typeof entry.at === 'number' && entry.at >= oldest));

        if (Object.keys(fresh).length !== Object.keys(entries).length) {
            this.write(fresh);
        }

        return fresh;
    }

    /** Keeps the value of a field and the one it was before. */
    keep(field, value, previous) {
        const entries = this.all();
        entries[field] = { value: value ?? null, previous: entries[field]?.previous ?? previous ?? null, at: Date.now() };
        this.write(entries);
    }

    /** Forgets a field once the server saved this value, not one typed since. */
    saved(field, value, same) {
        const entries = this.all();

        if (entries[field] && same(entries[field].value, value)) {
            delete entries[field];
            this.write(entries);
        }
    }

    /** Forgets a field, whatever it holds. */
    forget(field) {
        const entries = this.all();

        if (entries[field]) {
            delete entries[field];
            this.write(entries);
        }
    }

    write(entries) {
        if (!this.key) {
            return;
        }

        try {
            if (Object.keys(entries).length === 0) {
                localStorage.removeItem(this.key);
            } else {
                localStorage.setItem(this.key, JSON.stringify(entries));
            }
        } catch {
            // Private windows may refuse; then only the server keeps what it got.
        }
    }
}
