import { LitElement } from 'lit';

const STEP = 0.05;

/**
 * <fb-focus>: picks the focus point of an image (decision 0126). A click
 * on the image puts the point there, the arrow keys move it in steps of
 * five percent. The values go to the hidden fields focusX and focusY
 * inside it, as shares from 0 to 1.
 *
 *     <fb-focus x="0.5" y="0.5" label="Focus point" position="{x} % from the left, {y} % from the top">
 *         <img src="…" alt="">
 *         <input type="hidden" name="focusX"><input type="hidden" name="focusY">
 *     </fb-focus>
 */
export class Focus extends LitElement {
    static properties = {
        x: { type: Number },
        y: { type: Number },
        label: {},
        position: {},
        disabled: { type: Boolean, reflect: true },
    };

    constructor() {
        super();
        this.x = 0.5;
        this.y = 0.5;
        this.label = 'Focus point';
        this.position = '{x} % from the left, {y} % from the top';
        this.disabled = false;
        this.marker = null;
        this.onClick = this.onClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();

        if (!this.marker) {
            this.marker = document.createElement('button');
            this.marker.type = 'button';
            this.marker.className = 'fb-focus__marker';
            this.append(this.marker);
        }

        this.addEventListener('click', this.onClick);
        this.marker.addEventListener('keydown', this.onKeyDown);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.onClick);
        this.marker?.removeEventListener('keydown', this.onKeyDown);
        super.disconnectedCallback();
    }

    updated() {
        const x = Math.round(this.x * 100);
        const y = Math.round(this.y * 100);
        // The point is on the image, so left and top even in right-to-left text.
        this.marker.style.left = `${x}%`;
        this.marker.style.top = `${y}%`;
        this.marker.disabled = this.disabled;
        this.marker.setAttribute('aria-label', `${this.label}: ${this.position.replace('{x}', String(x)).replace('{y}', String(y))}`);

        for (const [name, value] of [['focusX', this.x], ['focusY', this.y]]) {
            const field = this.querySelector(`input[name="${name}"]`);

            const text = String(Math.round(value * 1000) / 1000);

            if (field && field.value !== text) {
                field.value = text;

                // A moved point is a change of the form (decision 0130), the first render is not.
                if (this.rendered) {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }

        this.rendered = true;
    }

    move(x, y) {
        this.x = Math.min(1, Math.max(0, x));
        this.y = Math.min(1, Math.max(0, y));
        this.dispatchEvent(new CustomEvent('fb-focus-change', { detail: { x: this.x, y: this.y }, bubbles: true }));
    }

    onClick(event) {
        const image = this.querySelector('img');

        if (this.disabled || !image || event.target === this.marker) {
            return;
        }

        const box = image.getBoundingClientRect();

        if (box.width === 0 || box.height === 0) {
            return;
        }

        this.move((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
        this.marker.focus();
    }

    onKeyDown(event) {
        const moves = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] };
        const step = moves[event.key];

        if (this.disabled || !step) {
            return;
        }

        event.preventDefault();
        this.move(this.x + step[0], this.y + step[1]);
    }
}

customElements.define('fb-focus', Focus);
