/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { ready, signIn } from './admin';

// The help (decisions 0215, 0218): the help button of a screen opens the
// page about it in a panel at the side, links to other help pages stay
// in the panel, the search finds help pages, and the editor bar has the
// help about editing.

const KEYS = 'ControlOrMeta+k';

test('the help button of a screen opens the page about it at the side', async ({ page }) => {
    await signIn(page, '/cms/pages');

    await ready(page, 'fb-help');
    await page.getByRole('link', { name: 'Hilfe: Seiten' }).click();
    const panel = page.getByRole('dialog', { name: 'Seiten' });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading', { name: 'Seite verschieben' })).toBeVisible();
    await expect(page).toHaveURL('/cms/pages', { timeout: 1000 });
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();

    // Links to other help pages stay in the panel.
    await page.goto('/cms');
    await ready(page, 'fb-help');
    await page.getByRole('link', { name: 'Hilfe: Erste Schritte' }).click();
    await page.getByRole('dialog', { name: 'Erste Schritte' }).getByRole('link', { name: 'Auf der Website bearbeiten' }).click();
    const editing = page.getByRole('dialog', { name: 'Auf der Website bearbeiten' });
    await expect(editing).toBeVisible();
    await expect(page).toHaveURL('/cms');

    // The whole help on its own screen.
    await editing.getByRole('link', { name: 'In der Hilfe öffnen' }).click();
    await expect(page).toHaveURL('/cms/help/frootbox/backend/editing');
    await expect(page.getByRole('heading', { level: 2, name: 'Auf der Website bearbeiten' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Themen' }).getByRole('link', { name: 'Blöcke dieser Website' })).toBeVisible();
});

test('the search finds a help page', async ({ page }) => {
    await signIn(page, '/cms/media');

    await ready(page, 'fb-search');
    await page.keyboard.press(KEYS);
    const dialog = page.getByRole('dialog', { name: 'Suchen' });
    await dialog.getByRole('combobox').fill('sitemap verschieben');
    await expect(dialog.getByRole('group', { name: 'Hilfe' }).getByRole('option', { name: /^Seiten/ })).toBeVisible();
    await dialog.getByRole('group', { name: 'Hilfe' }).getByRole('option', { name: /^Seiten/ }).click();
    await expect(page).toHaveURL('/cms/help/frootbox/backend/pages');
});

test('the editor bar has the help about editing', async ({ page }) => {
    await signIn(page, '/cms/pages');

    await page.goto('/');
    const bar = page.locator('fb-editor-bar');
    await bar.getByRole('button', { name: 'Hilfe' }).click();
    const panel = bar.getByRole('dialog', { name: 'Auf der Website bearbeiten' });
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
});
