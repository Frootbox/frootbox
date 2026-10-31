import { LitElement, html, svg } from 'lit';

const KEY = 'fb-theme';
const CHOICES = ['system', 'light', 'dark'];

const ICONS = {
    system: svg`<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>`,
    light: svg`<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>`,
    dark: svg`<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>`,
};

function stored() {
    try {
        const value = localStorage.getItem(KEY);

        return CHOICES.includes(value) ? value : 'system';
    } catch {
        return 'system';
    }
}

/**
 * <fb-theme-switch>: the appearance of the backend, like the system,
 * light or dark. The browser remembers the choice; an inline script in
 * the head applies it before the page is drawn.
 *
 *     <fb-theme-switch label="Appearance"
 *         labels='{"system": "Like the system", "light": "Light", "dark": "Dark"}'>
 *     </fb-theme-switch>
 *
 * It renders into the light DOM, so it uses the CSS of .fb-segmented.
 * Fires "fb-theme-change" with detail.theme.
 */
export class ThemeSwitch extends LitElement {
    static properties = {
        label: {},
        labels: { type: Object },
        theme: { state: true },
    };

    constructor() {
        super();
        this.label = 'Appearance';
        this.labels = { system: 'Like the system', light: 'Light', dark: 'Dark' };
        this.theme = stored();
    }

    createRenderRoot() {
        return this;
    }

    render() {
        return html`<div class="fb-segmented" role="group" aria-label=${this.label}>
            ${CHOICES.map((choice) => html`<button type="button" class="fb-segmented__item"
                aria-pressed=${choice === this.theme ? 'true' : 'false'}
                title=${this.labels[choice] ?? choice}
                @click=${() => this.choose(choice)}>
                <svg class="fb-icon fb-icon--small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[choice]}</svg>
                <span class="fb-visually-hidden">${this.labels[choice] ?? choice}</span>
            </button>`)}
        </div>`;
    }

    choose(theme) {
        this.theme = theme;

        try {
            theme === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, theme);
        } catch {
            // Without storage the choice lasts until the next page.
        }

        if (theme === 'system') {
            delete document.documentElement.dataset.theme;
        } else {
            document.documentElement.dataset.theme = theme;
        }

        this.dispatchEvent(new CustomEvent('fb-theme-change', { detail: { theme }, bubbles: true }));
    }
}

customElements.define('fb-theme-switch', ThemeSwitch);
