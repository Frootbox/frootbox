/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';
import { axeBuilder } from './axe';

// Navigations on the website (decision 0349): the tab at the main
// navigation, the panel "Navigation" with moving, adding and indenting,
// publishing with the page, and own items for a language that shows those
// of another one. It runs after the other tests (project "navigations"),
// as it changes the menu of every page, and puts the menu back at the end.

test('changes the main navigation on the website and publishes it', async ({ page, browser }) => {
    await signIn(page, '/cms/site');
    const before = await page.evaluate(async () => (await (await fetch('/cms/queries/navigation.show?name=main', { headers: { Accept: 'application/json' } })).json()).data);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL('/');

    const bar = page.locator('fb-editor-bar');
    const menu = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const panel = bar.getByRole('region', { name: 'Hauptnavigation' });

    try {
        // Alt+F10 at a link of the navigation reaches the button on its tab.
        await menu.getByRole('link', { name: 'Unsere Sorten' }).focus();
        await page.keyboard.press('Alt+F10');
        const edit = bar.getByRole('button', { name: '„Hauptnavigation“ bearbeiten' });
        await expect(edit).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(panel.getByRole('button', { name: '„Kontakt“ bearbeiten' })).toBeVisible();

        const results = await (await axeBuilder(page)).include('fb-editor-bar').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(results.violations).toEqual([]);

        // Moving swaps the page: the menu shows the draft, the focus stays on the button.
        await panel.getByRole('button', { name: '„Kontakt“ nach oben' }).click();
        await expect(menu.getByRole('link')).toHaveText(['Unsere Sorten', 'Kontakt', 'Über uns']);
        await expect(panel.getByRole('button', { name: '„Kontakt“ nach oben' })).toBeFocused();
        await expect(bar.locator('.state')).toHaveAttribute('data-state', 'changed');

        // A new item with the option of the theme.
        await panel.getByRole('button', { name: 'Punkt hinzufügen' }).click();
        await expect(panel.getByLabel('Art')).toBeFocused();
        await panel.getByLabel('Art').selectOption('phone');
        await panel.getByLabel('Telefonnummer').fill('+49 40 999');
        await panel.getByLabel('Text', { exact: true }).fill('Anrufen');
        await panel.getByLabel('Als Button').check();
        await panel.getByRole('button', { name: 'Übernehmen' }).click();
        await expect(menu.getByRole('link', { name: 'Anrufen' })).toHaveAttribute('href', 'tel:+4940999');
        await expect(menu.getByRole('link', { name: 'Anrufen' })).toHaveClass(/base-nav__button/);
        await expect(panel.getByRole('button', { name: '„Anrufen“ bearbeiten' })).toBeFocused();

        // "About us" goes below "Contact", which opens as a group.
        await panel.getByRole('button', { name: '„Über uns“ unter den Punkt davor' }).click();
        await expect(menu.locator('summary')).toHaveText('Kontakt');
        await expect(panel.locator('li[data-path="1.0"]')).toContainText('Über uns');
        await expect(panel.getByRole('button', { name: '„Über uns“ eine Ebene höher' })).toBeEnabled();

        // One button publishes the page and the navigation; guests see it.
        await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
        await expect(bar.getByRole('status')).toHaveText('Die Änderungen sind veröffentlicht.');
        const guest = await browser.newPage();
        await guest.goto('/');
        await expect(guest.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Anrufen' })).toBeAttached();
        expect(await guest.locator('[data-fb-navigation]').count()).toBe(0);
        await guest.close();

        // English shows the German items until it has its own, found under "More".
        await page.goto('/en');
        await bar.getByRole('button', { name: 'Mehr' }).click();
        await bar.getByRole('menuitem', { name: 'Navigationen' }).click();
        await expect(panel).toContainText('English hat keine eigenen Punkte und zeigt die auf Deutsch.');
        await expect(panel.getByRole('button', { name: '„Unsere Sorten“ bearbeiten' })).toHaveCount(0);
        await panel.getByRole('button', { name: 'Eigene Punkte für English' }).click();
        await expect(panel.getByRole('button', { name: 'Punkt hinzufügen' })).toBeFocused();
        await expect(panel.getByRole('button', { name: '„Anrufen“ bearbeiten' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(panel).toHaveCount(0);
    } finally {
        // The menu as it was, for the tests after this one; actions need a page of the backend.
        await page.goto('/cms/site');
        expect((await action(page, 'navigation.update', { name: 'main', items: { ...before.published, en: null } })).status).toBe(200);
        expect((await action(page, 'navigation.publish', { names: ['main'] })).status).toBe(200);
    }
});
