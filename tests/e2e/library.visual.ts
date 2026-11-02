/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test } from '@playwright/test';
import { LIBRARY, PAGES, loadImages } from './library';

// Screenshots of the base library on its sample website (decision 0163):
// every page shows its block at the three places, here at two widths, in
// German and from right to left in Arabic (with the German text as
// fallback). Only valid in the Playwright container, see backend.visual.ts.

test.use({ baseURL: LIBRARY });

const widths = { wide: { width: 1280, height: 800 }, narrow: { width: 390, height: 844 } };

for (const [name, path] of Object.entries(PAGES)) {
    for (const [width, viewport] of Object.entries(widths)) {
        for (const prefix of ['', '/ar']) {
            const language = prefix ? 'ar' : 'de';

            test(`${name}, ${width}, ${language}`, async ({ page }) => {
                // The first visit of a page with images makes their sizes,
                // which takes a while with AVIF.
                test.setTimeout(300_000);
                await page.setViewportSize(viewport);
                await page.goto(prefix + (path === '/' && prefix ? '' : path));
                await page.evaluate(() => document.fonts.ready);
                await loadImages(page);

                await expect(page).toHaveScreenshot(`${name}-${width}-${language}.png`, { fullPage: true });
            });
        }
    }
}

test('menu, narrow', async ({ page }) => {
    await page.setViewportSize(widths.narrow);
    await page.goto(PAGES.start);
    await page.getByRole('button', { name: 'Menü', exact: true }).click();
    await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Widgets').click();

    await expect(page).toHaveScreenshot('menu-narrow.png');
});
