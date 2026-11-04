/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { axeBuilder } from './axe';

// The search on the website (decision 0228): the head links to the page
// "Suche" of the demo, which finds pages, articles and events of
// Bohnenglück with the words marked.

test('visitors search the website from the head', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Website durchsuchen' }).click();
    await expect(page).toHaveURL(/\/suche$/);

    const field = page.getByRole('searchbox', { name: 'Website durchsuchen' });
    await field.fill('Röstkurs');
    await field.press('Enter');
    await expect(page).toHaveURL(/\/suche\?q=R%C3%B6stkurs$/);
    await expect(page.getByRole('status')).toHaveText(/Treffer zu „Röstkurs“\.$/);

    const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);

    await page.locator('.search-hit').getByRole('link', { name: 'Röstkurs', exact: true }).click();
    await expect(page).toHaveURL(/\/termine\/roestkurs$/);

    await page.goto('/suche?q=Kaffee');
    await expect(page.locator('.search-hit mark').first()).toHaveText(/kaffee/i);

    await page.goto('/suche?q=Quantenphysik');
    await expect(page.getByRole('status')).toHaveText('Zu „Quantenphysik“ wurde nichts gefunden.');
});
