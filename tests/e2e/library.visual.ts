/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { DESIGN, LIBRARY, PAGES, designTest, frames, loadImages, sections, withoutNote } from './library';

// Screenshots of the base theme (decision 0209). The design page shows
// every block in every variant: in the main area at two widths, in German
// and from right to left in Arabic, and at each place and on each surface
// of the theme, wide. One image per part and group of blocks. The small
// sample website shows head, foot and layouts. Only valid in the
// Playwright container, see backend.visual.ts.

test.use({ baseURL: LIBRARY });

const widths = { wide: { width: 1280, height: 800 }, narrow: { width: 390, height: 844 } };

/** Every part of the design page in one view, as its own image. */
async function shoot(page: import('@playwright/test').Page, path: string, prefix: string, withBasics: boolean): Promise<void> {
    expect((await page.goto(path))?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await loadImages(page);
    await withoutNote(page);
    const parts = await sections(page, withBasics);
    expect(parts.length).toBeGreaterThan(5);

    for (const part of parts) {
        await expect.soft(page).toHaveScreenshot(`${prefix}-${part.name}.png`, { fullPage: true, clip: part.clip });
    }
}

for (const [width, viewport] of Object.entries(widths)) {
    for (const language of ['de', 'ar']) {
        designTest(`design page, ${width}, ${language}`, async ({ page }) => {
            // One image per part, each of the full page.
            test.setTimeout(120_000);
            await page.setViewportSize(viewport);
            await shoot(page, `${DESIGN}?language=${language}`, `design-${width}-${language}`, true);
        });
    }
}

designTest('design page at each place and on each surface', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize(widths.wide);
    const views = await frames(page);

    for (const view of views) {
        await shoot(page, `${DESIGN}${view}`, `design-${view.slice(1).replace('=', '-')}`, false);
    }
});

for (const [name, path] of Object.entries(PAGES)) {
    for (const [width, viewport] of Object.entries(widths)) {
        for (const prefix of ['', '/ar']) {
            const language = prefix ? 'ar' : 'de';

            test(`${name}, ${width}, ${language}`, async ({ page }) => {
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
    await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Rösterei').click();

    await expect(page).toHaveScreenshot('menu-narrow.png');
});

// The error page in the frame of the theme (decision 0189).
for (const [width, viewport] of Object.entries(widths)) {
    for (const [language, path] of Object.entries({ de: '/gibt-es-nicht', ar: '/ar/غير-موجود' })) {
        test(`error page, ${width}, ${language}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            expect((await page.goto(path))?.status()).toBe(404);
            await page.evaluate(() => document.fonts.ready);

            await expect(page).toHaveScreenshot(`error-${width}-${language}.png`, { fullPage: true });
        });
    }
}
