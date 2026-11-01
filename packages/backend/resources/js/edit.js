// The entry of the editing mode on pages of the website (decision 0119).
// It brings Lit along, because an import map could clash with the theme.
import { EditorBar } from './edit/editor-bar.js';

customElements.define('fb-editor-bar', EditorBar);

const source = document.getElementById('fb-edit-config');

if (source) {
    const bar = document.createElement('fb-editor-bar');
    bar.config = JSON.parse(source.textContent ?? '{}');
    document.body.append(bar);
}
