/*
 * <base-gallery>: a click on an image of the grid shows it large in a
 * <dialog>, with buttons and arrow keys for the others (decision 0163).
 * Without this script the grid stays as it is. In the editing mode a
 * click selects the image for editing, so the gallery does nothing there.
 */
class BaseGallery extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');

    if (!this.dialog || this.closest('[data-fb-block]') || this.dataset.ready) {
      return;
    }

    this.dataset.ready = '';
    this.stage = this.dialog.querySelector('.base-gallery__stage');
    this.count = this.dialog.querySelector('.base-gallery__count');
    this.figures = [...this.querySelectorAll('.base-gallery__figure')].filter((figure) => figure.querySelector('img'));

    this.figures.forEach((figure, index) => {
      const picture = figure.querySelector('picture') ?? figure.querySelector('img');
      const button = document.createElement('button');
      const alt = figure.querySelector('img').alt.trim();

      button.type = 'button';
      button.className = 'base-gallery__open';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-label', alt === '' ? this.dialog.dataset.larger : `${alt}: ${this.dialog.dataset.larger}`);
      picture.replaceWith(button);
      button.append(picture);
      button.addEventListener('click', () => this.show(index));
    });

    this.dialog.querySelector('[data-close]').addEventListener('click', () => this.dialog.close());
    this.dialog.querySelector('[data-previous]').addEventListener('click', () => this.show(this.index - 1));
    this.dialog.querySelector('[data-next]').addEventListener('click', () => this.show(this.index + 1));
    this.dialog.addEventListener('keydown', (event) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

      if (step) {
        event.preventDefault();
        // The arrow points the way the images run, also from right to left.
        this.show(this.index + (getComputedStyle(this).direction === 'rtl' ? -step : step));
      }
    });
    // A click on the dark area around the image closes it.
    this.dialog.addEventListener('click', (event) => event.target === this.dialog && this.dialog.close());
    // The focus goes back to the button that opened the dialog, also after browsing.
    this.dialog.addEventListener('close', () => this.opener?.focus());
  }

  show(index) {
    const total = this.figures.length;
    this.index = (index + total) % total;

    const figure = this.figures[this.index];
    const copy = figure.cloneNode(true);
    const picture = copy.querySelector('picture') ?? copy.querySelector('img');

    // The whole image, as large as the screen allows.
    copy.querySelectorAll('[sizes]').forEach((element) => element.setAttribute('sizes', '100vw'));
    copy.querySelector('button')?.replaceWith(picture);
    copy.querySelector('img').loading = 'eager';
    this.stage.replaceChildren(copy);
    this.count.textContent = `${this.index + 1} / ${total}`;

    if (!this.dialog.open) {
      this.opener = figure.querySelector('button');
      this.dialog.showModal();
    }
  }
}

if (!customElements.get('base-gallery')) {
  customElements.define('base-gallery', BaseGallery);
}
