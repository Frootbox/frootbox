import { html, svg } from 'lit';

/** The icons of the bar, drawn with the text colour. */
const ICONS = {
    pencil: svg`<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>`,
    external: svg`<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>`,
    collapse: svg`<path d="m6 9 6 6 6-6"/>`,
    expand: svg`<path d="m9 6 6 6-6 6"/>`,
    lock: svg`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
    undo: svg`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`,
    bold: svg`<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>`,
    italic: svg`<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>`,
    heading: svg`<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/>`,
    outline: svg`<path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6v4c0 1.1.9 2 2 2h3"/><path d="M3 10v6c0 1.1.9 2 2 2h3"/>`,
    list: svg`<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>`,
    ordered: svg`<path d="M10 6h10"/><path d="M10 12h10"/><path d="M10 18h10"/><path d="M4 4h1v4"/><path d="M4 14h2l-2 4h2"/>`,
    quote: svg`<path d="M5 11h4v6H5zM5 11a5 5 0 0 1 4-5"/><path d="M14 11h4v6h-4zM14 11a5 5 0 0 1 4-5"/>`,
    direction: svg`<path d="M10 4v9"/><path d="M14 4v9"/><path d="M16 4H9.5a3 3 0 0 0 0 6h.5"/><path d="M4 18h16"/><path d="m7 15-3 3 3 3"/><path d="m17 15 3 3-3 3"/>`,
    link: svg`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
    close: svg`<path d="M6 6l12 12"/><path d="M18 6 6 18"/>`,
    left: svg`<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>`,
    right: svg`<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>`,
    up: svg`<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>`,
    down: svg`<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>`,
    parent: svg`<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v6"/>`,
    copy: svg`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>`,
    trash: svg`<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>`,
    settings: svg`<path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>`,
    plus: svg`<path d="M12 5v14"/><path d="M5 12h14"/>`,
    image: svg`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>`,
    palette: svg`<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>`,
    restore: svg`<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>`,
    warning: svg`<path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4"/><path d="M12 17v.5"/>`,
    comment: svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    check: svg`<path d="M20 6 9 17l-5-5"/>`,
    more: svg`<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>`,
    text: svg`<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h10"/>`,
    header: svg`<rect x="3" y="4" width="18" height="8" rx="1.5"/><path d="M3 16h18"/><path d="M3 20h12"/>`,
    teaser: svg`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/><path d="M7 16h4"/>`,
    callout: svg`<path d="M4 10v4h3l7 4V6l-7 4z"/><path d="M18 9a4 4 0 0 1 0 6"/>`,
    form: svg`<rect x="3" y="5" width="18" height="5" rx="1"/><rect x="3" y="14" width="11" height="5" rx="1"/>`,
    columns: svg`<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>`,
    block: svg`<rect x="4" y="4" width="16" height="16" rx="2"/>`,
    places: svg`<rect x="3" y="4" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/>`,
};

export function icon(name) {
    return html`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}
