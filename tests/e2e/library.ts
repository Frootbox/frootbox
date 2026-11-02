/*
 * SPDX-License-Identifier: MIT
 */

import type { Page } from '@playwright/test';

// The second installation of the browser tests: the base theme alone with
// its sample website (decision 0163), built by `tools/e2e.php --base`.
export const LIBRARY = process.env.PLAYWRIGHT_LIBRARY_URL ?? 'http://127.0.0.1:8101';

// The pages of packages/themes/base/demo/library.yaml.
export const PAGES = {
    start: '/',
    heading: '/heading',
    text: '/text',
    button: '/button',
    section: '/section',
    prose: '/text-with-heading',
    quote: '/quote',
    notice: '/notice',
    divider: '/divider',
    cta: '/call-to-action',
    figures: '/key-figures',
    hero: '/hero',
    pageHeader: '/page-header',
    imageText: '/image-with-text',
    gallery: '/gallery',
    slider: '/slider',
    video: '/video',
    cards: '/cards',
    logos: '/logos',
    linkList: '/link-list',
    accordion: '/accordion',
    steps: '/steps',
    testimonials: '/testimonials',
    prices: '/prices',
    contact: '/contact',
    features: '/features',
    downloads: '/downloads',
    table: '/table',
    landing: '/aktion',
};

// Loads all images and video posters of the page, also those that would wait until they are
// scrolled to, e.g. before a screenshot of the full page. The first call of
// a size makes the file, which can take a moment on the test server.
export async function loadImages(page: Page): Promise<void> {
    await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach((image) => (image.loading = 'eager'));
        // An image that fails counts as done, the screenshot shows it.
        const loaded = (image: HTMLImageElement) =>
            new Promise((done) => {
                image.addEventListener('load', done, { once: true });
                image.addEventListener('error', done, { once: true });
            });
        await Promise.all(images.map((image) => (image.complete ? image.decode() : loaded(image)).catch(() => null)));
        // Posters of videos load on their own; the same address is then in the cache.
        const posters = [...document.querySelectorAll('video[poster]')].map((video) => {
            const image = new Image();
            image.src = video.getAttribute('poster') ?? '';

            return image.decode().catch(() => null);
        });
        await Promise.all(posters);
    });
}
