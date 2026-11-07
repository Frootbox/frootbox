// The entry of the editing mode on pages of the website (decision 0119).
// It brings Lit along, because an import map could clash with the theme.
import { EditorBar } from './edit/editor-bar.js';
import { mountBar } from './edit/refresh.js';

customElements.define('fb-editor-bar', EditorBar);

const source = document.getElementById('fb-edit-config');

if (source) {
    mountBar(JSON.parse(source.textContent ?? '{}'));
}
