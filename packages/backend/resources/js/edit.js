// The entry of the editing mode on pages of the website (decision 0119).
// It brings Lit along, because an import map could clash with the theme.
import { EditBar } from './edit/edit-bar.js';

customElements.define('fb-edit-bar', EditBar);

const source = document.getElementById('fb-edit-config');

if (source) {
    const bar = document.createElement('fb-edit-bar');
    bar.config = JSON.parse(source.textContent ?? '{}');
    document.body.append(bar);
}
