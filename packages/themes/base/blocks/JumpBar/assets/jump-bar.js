/*
 * SPDX-License-Identifier: MIT
 */

/*
 * <base-jump-bar>: marks the link of the section in view with
 * aria-current and keeps it visible when the bar scrolls sideways
 * (decision 0200). Without this script the bar stays a list of links.
 */
class BaseJumpBar extends HTMLElement {
  connectedCallback() {
    this.list = this.querySelector('.base-jump-bar__list');
    this.links = [...this.querySelectorAll('a[href^="#"]')]
      .map((link) => ({ link, target: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
      .filter(({ target }) => target);

    if (!this.list || this.links.length === 0) {
      return;
    }

    this.update = this.update.bind(this);
    window.addEventListener('scroll', this.update, { passive: true });
    window.addEventListener('resize', this.update, { passive: true });
    this.update();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.update);
    window.removeEventListener('resize', this.update);
  }

  update() {
    if (this.frame) {
      return;
    }

    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.mark(this.current());
    });
  }

  // The last section whose top has passed the line just below the bar,
  // none as long as the bar has not reached its place at the top.
  current() {
    const bar = this.getBoundingClientRect();

    if (bar.top > (parseFloat(getComputedStyle(this).top) || 0) + 1) {
      return null;
    }

    const line = bar.bottom + 48;
    const root = document.documentElement;
    let current = null;

    for (const entry of this.links) {
      if (entry.target.getBoundingClientRect().top <= line) {
        current = entry;
      }
    }

    // At the end of the page a short last section may never reach the line.
    const last = this.links[this.links.length - 1];

    if (current && window.scrollY + window.innerHeight >= root.scrollHeight - 2 && last.target.getBoundingClientRect().top < window.innerHeight) {
      current = last;
    }

    return current;
  }

  mark(current) {
    for (const { link } of this.links) {
      if (link === current?.link) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }

    if (!current) {
      return;
    }

    const box = this.list.getBoundingClientRect();
    const place = current.link.getBoundingClientRect();
    const room = 16;

    if (place.left < box.left) {
      this.list.scrollBy({ left: place.left - box.left - room });
    } else if (place.right > box.right) {
      this.list.scrollBy({ left: place.right - box.right + room });
    }
  }
}

if (!customElements.get('base-jump-bar')) {
  customElements.define('base-jump-bar', BaseJumpBar);
}
