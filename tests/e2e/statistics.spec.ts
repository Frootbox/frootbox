/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { axeBuilder } from './axe';
import { signIn } from './admin';

// The statistics (decision 0229): a visitor's page view reaches the
// screen "Statistik" without a cookie. Headless browsers count as bots,
// so the visitor here has the user agent of a normal browser.

const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

test('a visit shows up in the statistics', async ({ browser, page }) => {
    const context = await browser.newContext({ userAgent: BROWSER });
    const visitor = await context.newPage();
    const sent = visitor.waitForRequest((request) => request.url().endsWith('/_statistics/hit') && request.method() === 'POST');
    await visitor.goto('/termine');
    const hit = await sent;
    expect(JSON.parse(hit.postData() ?? '{}')).toMatchObject({ language: 'de', visit: true });
    expect(await context.cookies()).toEqual([]);
    await context.close();

    await signIn(page, '/cms/statistics');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Statistik');
    await expect(page.getByRole('link', { name: 'Letzte 30 Tage' })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.fb-figure').first()).toContainText('Besuche');
    await expect(page.getByRole('region', { name: 'Meistbesuchte Seiten' })).toContainText('Termine');

    const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);

    await page.getByRole('link', { name: 'Letzte 7 Tage' }).click();
    await expect(page).toHaveURL(/\/cms\/statistics\?days=7$/);
});
