/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DESIGN, LIBRARY, PAGES, PREVIEW_NOTE, designTest, frames } from './library';

// Accessibility of the base theme with axe-core (decisions 0163, 0169,
// 0209): the design page with every block, in the main area wide and
// narrow, in German and from right to left in Arabic, at each place and
// on each surface; the pages of the small sample website, the error page
// and the menu open. All without violations of WCAG 2.2 AA.

test.use({ baseURL: LIBRARY });

// WCAG 2.2 AA plus the best practices of axe, e.g. landmarks and the order of headings.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const widths = { wide: { width: 1280, height: 800 }, narrow: { width: 390, height: 844 } };

/** The violations, short enough to read in the report. */
async function violations(page: import('@playwright/test').Page): Promise<string[]> {
    // The note of a preview link belongs to the backend.
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude(PREVIEW_NOTE).analyze();
    // A page that axe could not check would pass silently.
    expect(results.passes.map((pass) => pass.id)).toEqual(expect.arrayContaining(['color-contrast', 'html-has-lang', 'landmark-one-main', 'heading-order', 'region']));

    return results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')} (${violation.help})`));
}

for (const [width, viewport] of Object.entries(widths)) {
    for (const language of ['de', 'ar']) {
        designTest(`has no violations on the design page, ${width}, ${language}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            expect((await page.goto(`${DESIGN}?language=${language}`))?.status()).toBe(200);

            expect(await violations(page)).toEqual([]);
        });
    }
}

designTest('has no violations on the design page at each place and on each surface', async ({ page }) => {
    // axe takes a few seconds per view of the large page on CI.
    test.setTimeout(120_000);
    const found: string[] = [];

    for (const view of await frames(page)) {
        await page.goto(DESIGN + view);
        found.push(...(await violations(page)).map((line) => `${view}: ${line}`));
    }

    expect(found).toEqual([]);
});

for (const [width, viewport] of Object.entries(widths)) {
    for (const prefix of ['', '/ar']) {
        test(`has no violations on the sample website, ${width}, ${prefix ? 'ar' : 'de'}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            const found: string[] = [];

            for (const path of Object.values(PAGES)) {
                await page.goto(prefix + (path === '/' && prefix ? '' : path));
                found.push(...(await violations(page)).map((line) => `${path}: ${line}`));
            }

            expect(found).toEqual([]);
        });
    }
}

test('has no violations on the error page', async ({ page }) => {
    const found: string[] = [];

    for (const viewport of Object.values(widths)) {
        await page.setViewportSize(viewport);

        for (const path of ['/gibt-es-nicht', '/ar/غير-موجود']) {
            expect((await page.goto(path))?.status()).toBe(404);
            found.push(...(await violations(page)).map((line) => `${path}: ${line}`));
        }
    }

    expect(found).toEqual([]);
});

test('has no violations with the menu open', async ({ page }) => {
    await page.setViewportSize(widths.narrow);
    await page.goto(PAGES.start);
    await page.getByRole('button', { name: 'Menü', exact: true }).click();
    await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Rösterei').click();

    expect(await violations(page)).toEqual([]);
});

designTest('has no violations with an image of the gallery shown large', async ({ page }) => {
    await page.goto(DESIGN);
    await page.getByRole('button', { name: 'Goldenes Licht auf dunklem Rotbraun: Größer zeigen' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Bilder' })).toBeVisible();

    // The page behind the open dialog is inert, so only the dialog counts.
    const results = await new AxeBuilder({ page }).withTags(TAGS).include('dialog[open]').analyze();
    expect(results.passes.map((pass) => pass.id)).toEqual(expect.arrayContaining(['button-name', 'image-alt']));
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
});
