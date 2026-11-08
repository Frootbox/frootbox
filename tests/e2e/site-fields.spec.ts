/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { signIn } from './admin';
import { axeBuilder } from './axe';

// The screen "Fields of the website" (decision 0348): values by language,
// publishing and an earlier version back. It runs after the other tests
// (project "site"), as it changes every page, and ends with the values it found.

test('changes the fields of the website by language and restores a version', async ({ page }) => {
    await signIn(page, '/cms/site?language=en');
    await expect(page.getByRole('heading', { level: 1, name: 'Website-Felder' })).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Website-Felder' })).toBeVisible();

    // English has no name of its own: the field is empty and shows the German one.
    const brand = page.getByLabel(/^Name der Website/);
    await expect(brand).toHaveValue('');
    await expect(brand).toHaveAttribute('placeholder', /\S/);
    await expect(page.getByText('Ein leeres Feld zeigt den Wert in Deutsch.')).toBeVisible();
    await expect(page.getByText(/Listen änderst Du auf der Website\./)).toBeVisible();

    const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations).toEqual([]);

    const before = (await page.locator('#site-status').textContent())?.match(/Besucher sehen Version (\d+)\./)?.[1];
    expect(before).toBeDefined();

    const name = `Bean luck ${Math.floor(Math.random() * 100000)}`;
    await brand.fill(name);
    await page.locator('#site-values').getByRole('button', { name: 'Speichern' }).click();
    await expect(page.locator('#site-status')).toContainText('Es gibt Änderungen, die Besucher noch nicht sehen.');
    await expect(page.getByLabel(/^Name der Website/)).toHaveValue(name);

    await page.locator('#site-status').getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('#site-status')).toContainText(/Besucher sehen Version \d+\./);
    await page.goto('/en');
    await expect(page.locator('[data-fb-field="brand"], .base-header__brand').first()).toContainText(name);

    // The version before comes back as a draft, then online.
    await page.goto('/cms/site?language=en');
    await page.locator('#site-versions').getByRole('button', { name: `Version ${before} wiederherstellen` }).click();
    await expect(page.locator('#site-status')).toContainText('Es gibt Änderungen, die Besucher noch nicht sehen.');
    await expect(page.getByLabel(/^Name der Website/)).toHaveValue('');
    await page.locator('#site-status').getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('#site-status')).toContainText(/Besucher sehen Version \d+\./);
});
