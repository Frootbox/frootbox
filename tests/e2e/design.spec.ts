/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The design of the website (decision 0127): from the backend into the
// panel on the website, a change shows at once, stays in the draft until
// it is published, and visitors see it afterwards.

const primary = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim());

test('changes the colours on the website and publishes them', async ({ page, browser }) => {
    await signIn(page, '/cms/theme');
    await expect(page.getByRole('heading', { level: 1, name: 'Design' })).toBeVisible();
    await expect(page.locator('.fb-swatch').first()).toBeVisible();

    await page.getByRole('button', { name: 'Auf der Website gestalten' }).click();
    await expect(page).toHaveURL('/');
    const bar = page.locator('fb-edit-bar');
    const panel = bar.getByRole('region', { name: 'Design der Website' });
    await expect(panel.getByRole('heading', { name: 'Design der Website' })).toBeFocused();
    await expect(panel.getByRole('group', { name: 'Farben' })).toBeVisible();

    // The page follows the field at once, the draft a moment later.
    const hex = panel.getByRole('textbox', { name: 'Hex-Wert von Hauptfarbe' });
    await hex.fill('#225588');
    await hex.press('Enter');
    expect(await primary(page)).toBe('#225588');
    await expect(panel.getByText('Nur Du siehst die Änderungen, bis Du sie veröffentlichst.')).toBeVisible();
    await expect(bar.getByText('Gespeichert')).toBeVisible();

    // A light main colour is hard to read with white text on it.
    await hex.fill('#eeeeee');
    await hex.press('Enter');
    await expect(panel.getByText(/^Nur 1,\d+ : 1 zu „Text auf der Hauptfarbe“/)).toBeVisible();
    await hex.fill('#225588');
    await hex.press('Enter');
    await expect(panel.getByText(/zu „Text auf der Hauptfarbe“/)).toHaveCount(0);

    await panel.getByRole('combobox', { name: 'Schrift für Überschriften' }).selectOption('rounded');
    await panel.getByRole('slider', { name: 'Rundung der Ecken' }).fill('4');
    await expect(bar.getByText('Gespeichert')).toBeVisible();

    // Visitors still see the published design.
    const guest = await browser.newPage();
    await guest.goto('/');
    expect(await primary(guest)).toBe('#8a4b2a');

    await panel.getByRole('button', { name: 'Design veröffentlichen' }).click();
    await expect(panel.getByText('Besucher sehen dieses Design.')).toBeVisible();
    await guest.reload();
    expect(await primary(guest)).toBe('#225588');
    expect(await guest.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--radius').trim())).toBe('4px');
    await guest.close();

    // Back to the theme, so the other tests see the website as before.
    await page.goto('/cms/theme');
    await expect(page.getByText('Besucher sehen Version')).toBeVisible();
    expect((await action(page, 'design.update', { tokens: { 'color-primary': null, 'font-heading': null, radius: null } })).status).toBe(200);
    expect((await action(page, 'design.publish', {})).status).toBe(200);
});
