/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signIn } from './admin';

// The categories of the core (decision 0233): a tree per group, edited in
// dialogs, and nested in the forms of the modules. The test uses the
// group of the jobs, which the demo leaves empty, and deletes what it
// creates, so the lists of other tests stay as they are.

test('an editor builds a tree of categories and chooses from it', async ({ page }) => {
    await signIn(page, '/cms/vacancies');
    await page.locator('.fb-page-header').getByRole('link', { name: 'Kategorien', exact: true }).click();
    await expect(page).toHaveURL(/\/cms\/categories\?group=frootbox(%2F|\/)jobs(%2F|\/)categories$/);
    await expect(page.getByRole('heading', { name: 'Kategorien der Stellenangebote' })).toBeVisible();

    await page.getByRole('button', { name: 'Neue Kategorie' }).click();
    const create = page.getByRole('dialog', { name: /Neue Kategorie/ });
    await create.getByRole('group', { name: 'Deutsch' }).getByLabel('Titel').fill('Küche');
    await create.getByRole('button', { name: 'Anlegen' }).click();
    const tree = page.locator('fb-tree');
    const link = (title: string) => tree.locator('.fb-tree__link', { hasText: title });
    await expect(link('Küche')).toBeVisible();

    await tree.getByRole('button', { name: 'Kategorie unter „Küche“ anlegen' }).click();
    await expect(create.getByLabel('Unter')).toHaveValue(/.+/);
    await create.getByRole('group', { name: 'Deutsch' }).getByLabel('Titel').fill('Konditorei');
    await create.getByRole('button', { name: 'Anlegen' }).click();
    const kitchen = tree.locator('.fb-tree__item[data-title="Küche"]');
    await expect(kitchen.locator('.fb-tree__group .fb-tree__link', { hasText: 'Konditorei' })).toBeVisible();
    await expect(kitchen.locator('.fb-tree__meta').first()).toHaveText('?category=kueche');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);

    await link('Konditorei').click();
    const edit = page.getByRole('dialog', { name: 'Kategorie bearbeiten' });
    await expect(edit.getByRole('group', { name: 'Deutsch' }).getByLabel('Titel')).toHaveValue('Konditorei');
    await edit.getByRole('group', { name: 'Deutsch' }).getByLabel('Titel').fill('Konditorei und Backstube');
    await edit.getByRole('button', { name: 'Speichern' }).click();
    await expect(link('Konditorei und Backstube')).toBeVisible();

    // The form of a job shows the tree with the category below.
    await page.goto('/cms/vacancies');
    await page.getByRole('link', { name: 'Barista (m/w/d)' }).click();
    const group = page.getByRole('group', { name: /Kategorien der Stellenangebote/ });
    await expect(group.getByRole('checkbox', { name: 'Küche' })).toBeVisible();
    await expect(group.locator('.fb-checks .fb-checks').getByRole('checkbox', { name: 'Konditorei und Backstube' })).toBeVisible();

    // Deleting the top one takes the one below with it.
    await page.goto('/cms/categories?group=frootbox/jobs/categories');
    await tree.getByRole('button', { name: '„Küche“ löschen' }).click();
    await page.getByRole('dialog', { name: 'Kategorie löschen?' }).getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page.getByText('Noch keine Kategorien', { exact: true })).toBeVisible();
});
