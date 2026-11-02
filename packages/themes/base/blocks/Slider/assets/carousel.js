/*
 * <base-carousel>: buttons for a row that scrolls with scroll-snap
 * (decision 0167). Only behaviour, no look: it finds the row by
 * [data-carousel-track], shows [data-carousel-controls] and moves by one
 * width per click of [data-carousel-previous] or [data-carousel-next].
 * Without this script the row can still be swiped and scrolled. It never
 * moves on by itself (WCAG 2.2.2).
 */
class BaseCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-carousel-track]');
    const controls = this.querySelector('[data-carousel-controls]');

    if (!this.track || !controls || this.dataset.ready) {
      return;
    }

    this.dataset.ready = '';
    this.previous = this.querySelector('[data-carousel-previous]');
    this.next = this.querySelector('[data-carousel-next]');
    this.previous?.addEventListener('click', () => this.move(-1));
    this.next?.addEventListener('click', () => this.move(1));
    this.track.addEventListener('scroll', () => this.queue(), { passive: true });
    new ResizeObserver(() => this.queue()).observe(this.track);
    controls.hidden = false;
    this.update();
  }

  move(step) {
    // scrollLeft runs negative from right to left.
    const direction = getComputedStyle(this.track).direction === 'rtl' ? -1 : 1;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.track.scrollBy({ left: step * direction * this.track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  }

  queue() {
    if (!this.waiting) {
      this.waiting = true;
      requestAnimationFrame(() => {
        this.waiting = false;
        this.update();
      });
    }
  }

  update() {
    const position = Math.abs(this.track.scrollLeft);
    const end = this.track.scrollWidth - this.track.clientWidth;

    if (this.previous) this.previous.disabled = position <= 1;
    if (this.next) this.next.disabled = position >= end - 1;
  }
}

if (!customElements.get('base-carousel')) {
  customElements.define('base-carousel', BaseCarousel);
}
