/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { LIBRARY, PAGES } from './library';

// Accessibility of the base theme with axe-core (decisions 0163, 0169):
// every page of its sample website without violations of WCAG 2.2 AA,
// wide and narrow, in German and from right to left in Arabic, and with
// the menu open.

test.use({ baseURL: LIBRARY });

// WCAG 2.2 AA plus the best practices of axe, e.g. landmarks and the order of headings.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const widths = { wide: { width: 1280, height: 800 }, narrow: { width: 390, height: 844 } };

/** The violations, short enough to read in the report. */
async function violations(page: import('@playwright/test').Page): Promise<string[]> {
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    // A page that axe could not check would pass silently.
    expect(results.passes.map((pass) => pass.id)).toEqual(expect.arrayContaining(['color-contrast', 'html-has-lang', 'landmark-one-main', 'heading-order', 'region']));

    return results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')} (${violation.help})`));
}

for (const [width, viewport] of Object.entries(widths)) {
    for (const prefix of ['', '/ar']) {
        test(`has no violations, ${width}, ${prefix ? 'ar' : 'de'}`, async ({ page }) => {
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

test('has no violations with the menu open', async ({ page }) => {
    await page.setViewportSize(widths.narrow);
    await page.goto(PAGES.start);
    await page.getByRole('button', { name: 'Menü', exact: true }).click();
    await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Widgets').click();

    expect(await violations(page)).toEqual([]);
});
