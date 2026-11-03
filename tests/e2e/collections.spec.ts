/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The collections (decision 0246): the demo of Bohnenglück names the first
// collection "Farmen" and shows three farms below "Unsere Farmen" as cards,
// filtered by category without a script, each with its own address and a
// fact sheet of the fields of the collection (decision 0250); an editor
// adds a farm in the backend in the tab of the collection, an admin a field.

const violations = async (page: Page) => {
    // Under load styles and the logo may still be loading; without their sizes axe sees targets too small.
    await page.waitForLoadState('load');
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();

    return results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`));
};

test('visitors filter the farms and open one', async ({ page }) => {
    await page.goto('/unsere-farmen');
    const cards = page.locator('.collection-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.first().getByRole('link')).toHaveText('Finca La Esperanza', { useInnerText: true });
    await expect(cards.nth(2).getByRole('link')).toHaveText('Kooperative Sidama', { useInnerText: true });
    expect(await violations(page)).toEqual([]);

    await page.getByRole('navigation', { name: 'Kategorie' }).getByRole('link', { name: 'Afrika' }).click();
    await expect(page).toHaveURL(/\/unsere-farmen\?category=afrika$/);
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Afrika', exact: true })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Kooperative Sidama' }).click();
    await expect(page).toHaveURL(/\/unsere-farmen\/kooperative-sidama$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kooperative Sidama');
    await expect(page.getByRole('link', { name: 'Alle Einträge' })).toHaveAttribute('href', '/unsere-farmen');
    // The fields of the collection as a fact sheet (decision 0250).
    const facts = page.locator('.collection-facts');
    await expect(facts.locator('dt')).toHaveText(['Höhe', 'Region', 'Aufbereitung', 'Bio-zertifiziert']);
    await expect(facts.locator('dd')).toHaveText(['1.900\u00A0m', 'Sidama, Äthiopien', 'Gewaschen', 'Ja']);
    expect(await violations(page)).toEqual([]);

    await page.goto('/en/our-farms/sidama-cooperative');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sidama cooperative');
    await expect(facts.locator('dd')).toHaveText(['1,900\u00A0m', 'Sidama, Ethiopia', 'Washed', 'Yes']);
});

test('an editor adds a farm in the tab of the collection', async ({ page }) => {
    const title = `Finca ${Date.now()}`;
    await signIn(page, '/cms/collections');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sammlungen');
    await expect(page.getByRole('heading', { level: 2, name: 'Farmen' })).toBeVisible();
    await expect(page.locator('.fb-list__item')).toHaveCount(3);
    expect(await violations(page)).toEqual([]);

    await page.getByRole('link', { name: 'Neuer Eintrag' }).first().click();
    await page.getByLabel('Titel').fill(title);
    await page.getByLabel('Position').fill('-1');
    await page.getByRole('button', { name: 'Als Entwurf speichern' }).click();
    await expect(page).toHaveURL(/\/cms\/collections\/[0-9A-Z]{26}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    const id = page.url().split('/').pop()!;
    expect(await violations(page)).toEqual([]);

    await page.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-page-header')).toContainText('Veröffentlicht');

    // The position puts it first.
    await page.goto('/unsere-farmen');
    await expect(page.locator('.collection-card').first().getByRole('link')).toHaveText(title, { useInnerText: true });

    await page.goto('/cms/collections');
    expect((await action(page, 'frootbox/collections/entry.delete', { id })).status).toBe(200);
});

test('an admin adds a field to the collection', async ({ page }) => {
    await signIn(page, '/cms/collections');
    await page.getByRole('link', { name: 'Felder' }).click();
    await expect(page).toHaveURL(/\/cms\/collections\/fields\?space=default$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Felder');
    await expect(page.locator('.fb-list__item')).toHaveCount(4);
    expect(await violations(page)).toEqual([]);

    await page.getByRole('button', { name: 'Feld hinzufügen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Feld hinzufügen' });
    await dialog.getByLabel('Art').selectOption('number');
    await dialog.getByLabel('Beschriftung').fill('Fläche');
    await dialog.getByLabel('Einheit').fill('ha');
    expect(await violations(page)).toEqual([]);
    await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(page.locator('.fb-list__item')).toHaveCount(5);
    await expect(page.locator('.fb-list__item').last()).toContainText('Zahl · ha · flaeche');

    // Editors fill it in under "More fields".
    await page.goto('/cms/collections');
    await page.getByRole('link', { name: 'Finca La Esperanza' }).click();
    await expect(page.getByLabel('Fläche (ha)')).toBeVisible();
    await expect(page.getByLabel('Höhe (m)')).toHaveValue('1700');

    await page.goto('/cms/collections');
    expect((await action(page, 'frootbox/collections/field.delete', { space: 'default', name: 'flaeche' })).status).toBe(200);
});
