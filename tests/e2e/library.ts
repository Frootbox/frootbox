/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test as base, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The second installation of the browser tests: the base theme alone with
// its small sample website (decisions 0163, 0209), built by
// `tools/e2e.php --base`.
export const LIBRARY = process.env.PLAYWRIGHT_LIBRARY_URL ?? 'http://127.0.0.1:8101';

// The pages of packages/themes/base/demo/site.yaml: head, foot, layouts
// and the jump bar. Every block shows the design page.
export const PAGES = {
    start: '/',
    about: '/ueber-uns',
    coffee: '/kaffee',
    landing: '/aktion',
    imprint: '/impressum',
};

export const DESIGN = '/_design';

type StorageState = Awaited<ReturnType<import('@playwright/test').BrowserContext['storageState']>>;

// Tests as the agency sees the design page: a guest with a preview link
// (decision 0209), made once per worker by the superuser.
export const designTest = base.extend<object, { preview: StorageState }>({
    baseURL: LIBRARY,
    preview: [
        async ({ browser }, use) => {
            const admin = await browser.newPage({ baseURL: LIBRARY });
            await signIn(admin, '/cms');
            const link = await action(admin, 'preview.create', { note: 'Browser tests of the design page' });
            expect(link.status).toBe(200);
            await admin.context().close();

            // The link leaves a cookie; the page behind it need not load.
            const guest = await browser.newContext({ baseURL: LIBRARY });
            await (await guest.newPage()).goto(link.body.data.path, { waitUntil: 'commit' });
            const state = await guest.storageState();
            expect(state.cookies.length).toBeGreaterThan(0);
            await use(state);
            await guest.close();
        },
        { scope: 'worker', timeout: 60_000 },
    ],
    storageState: async ({ preview }, use) => use(preview),
});

// The note of the preview stands fixed at the edge and belongs to the
// backend: screenshots go without it, axe leaves it out.
export const PREVIEW_NOTE = 'fb-preview-note';

/** Takes the note out of the page; its own styles would win over a hiding style. */
export async function withoutNote(page: Page): Promise<void> {
    await page.locator(PREVIEW_NOTE).evaluate((note) => note.remove());
}

/** The places and surfaces the theme names, from the links at the top of the design page. */
export async function frames(page: Page): Promise<string[]> {
    // Without the preview link the page would not exist, and nothing would be checked.
    expect((await page.goto(DESIGN))?.status()).toBe(200);
    const found = await page.locator('.fb-design-view a').evaluateAll((links) => [...new Set(links.map((link) => new URL((link as HTMLAnchorElement).href).search).filter((search) => /^\?(place|surface)=[a-z0-9-]+$/.test(search)))]);
    expect(found).toEqual(expect.arrayContaining([expect.stringMatching(/^\?place=/), expect.stringMatching(/^\?surface=/)]));

    return found;
}

/**
 * The parts of the design page for one screenshot each: tokens, plain
 * elements and rich text, then each group of blocks from its head to the
 * next one. The boxes are on the full page.
 */
export async function sections(page: Page, withBasics: boolean): Promise<{ name: string; clip: { x: number; y: number; width: number; height: number } }[]> {
    return page.evaluate((withBasics) => {
        const box = (element: Element) => {
            const rect = element.getBoundingClientRect();

            return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height };
        };
        const main = box(document.querySelector('main')!);
        const width = document.documentElement.clientWidth;
        const found: { name: string; clip: { x: number; y: number; width: number; height: number } }[] = [];

        if (withBasics) {
            for (const id of ['tokens', 'elements', 'richtext']) {
                const clip = box(document.getElementById(`fb-design-${id}`)!);
                found.push({ name: id, clip: { ...clip, x: 0, width } });
            }
        }

        const groups = [...document.querySelectorAll('section[id^="fb-design-group-"]')];
        groups.forEach((group, index) => {
            const top = box(group).y;
            const next = groups[index + 1];
            const bottom = next ? box(next).y : main.y + main.height;
            found.push({ name: group.id.replace('fb-design-group-', ''), clip: { x: 0, y: top, width, height: bottom - top } });
        });

        return found;
    }, withBasics);
}

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
