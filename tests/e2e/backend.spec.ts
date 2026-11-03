/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { ADMIN, signIn } from './admin';

// The frame of the backend at /cms: signing in and out, the menu and the
// appearance switch. The demo site is German, so is the backend.

test('leads guests to the sign-in and back', async ({ page }) => {
    await page.goto('/cms/design');

    await expect(page).toHaveURL('/cms/login?next=%2Fcms%2Fdesign');
    await expect(page).toHaveTitle('Anmelden · Frootbox');
    await expect(page.getByLabel('E-Mail')).toBeFocused();

    await page.getByLabel('E-Mail').fill(ADMIN.email);
    await page.getByLabel('Passwort').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page).toHaveURL('/cms/design');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Design-System');
});

test('says when the password is wrong', async ({ page }) => {
    await page.goto('/cms/login');
    await page.getByLabel('E-Mail').fill(ADMIN.email);
    await page.getByLabel('Passwort').fill('falsch');
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page.getByRole('alert')).toHaveText('E-Mail oder Passwort ist falsch.');
    await expect(page.getByLabel('E-Mail')).toHaveValue(ADMIN.email);
    await expect(page.getByLabel('Passwort')).toBeFocused();
});

test('shows the frame with menu and dashboard', async ({ page }) => {
    await signIn(page);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hallo, Admin');
    const menu = page.getByRole('navigation', { name: 'Hauptmenü' });
    await expect(menu.getByRole('link', { name: 'Übersicht' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.getByRole('link', { name: 'Design-System' })).toBeVisible();
    await expect(page.getByText('Wartet auf Veröffentlichung')).toBeVisible();

    // The web component is defined and rendered its buttons.
    const appearance = page.getByRole('group', { name: 'Darstellung' });
    await expect(appearance.getByRole('button')).toHaveCount(3);
});

test('remembers the appearance', async ({ page }) => {
    await signIn(page);

    await page.getByRole('group', { name: 'Darstellung' }).getByRole('button', { name: 'Dunkel' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Dunkel' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Wie das System' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});

test('signs out', async ({ page }) => {
    await signIn(page);

    await page.getByRole('button', { name: 'Abmelden' }).click();

    await expect(page).toHaveURL('/cms/login?signed-out=1');
    await expect(page.getByRole('status')).toHaveText('Du bist abgemeldet.');
    await page.goto('/cms');
    await expect(page).toHaveURL('/cms/login');
});

test('refuses forms without the token', async ({ page }) => {
    await signIn(page);

    const response = await page.request.post('/cms/logout', { form: {}, headers: { Origin: 'http://127.0.0.1:8100' } });
    expect(response.status()).toBe(403);
});

test('refuses a sign-in from another website', async ({ request }) => {
    const response = await request.post('/cms/login', {
        form: { email: ADMIN.email, password: ADMIN.password },
        headers: { Origin: 'https://evil.example' },
        maxRedirects: 0,
    });

    expect(response.status()).toBe(403);
    expect(response.headers()['set-cookie']).toBeUndefined();
});

test('reserves /cms in front of the pages', async ({ request }) => {
    const response = await request.get('/cms', { maxRedirects: 0 });

    expect(response.status()).toBe(302);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['x-frootbox-cache']).toBeUndefined();
});

test('shows tab panels with their states on the design page', async ({ page }) => {
    await signIn(page, '/cms/design');
    const light = page.locator('[data-design-mode="light"]');
    const bar = light.getByRole('tablist', { name: 'Teile des Formulars' });

    // The bar comes from the headings of the parts (decision 0235).
    await expect(bar.getByRole('tab')).toHaveCount(4);
    await expect(bar.getByRole('tab', { name: /^Texte/ })).toHaveAttribute('aria-selected', 'true');
    // A link is a tab to another screen, icons stand before the names (decision 0237).
    await expect(bar.getByRole('tab', { name: 'Einsendungen 12' })).toHaveAttribute('aria-selected', 'false');
    await expect(bar.locator('.fb-tabs__tab > .fb-icon')).toHaveCount(4);
    await expect(bar.getByRole('tab', { name: /^Felder/ })).toHaveAccessibleName('Felder 5');
    await expect(bar.getByRole('tab', { name: /^Felder/ })).toHaveAccessibleDescription('Fehler: 1');
    await expect(bar.getByRole('tab', { name: /^Weiteres/ })).toHaveAccessibleDescription('Nicht gespeichert');

    // fb-reveal on a field opens its part, e.g. from the summary of errors.
    await page.evaluate(() => document.getElementById('design-light-fields-name')?.dispatchEvent(new CustomEvent('fb-reveal', { bubbles: true })));
    await expect(bar.getByRole('tab', { name: /^Felder/ })).toHaveAttribute('aria-selected', 'true');
    await expect(light.getByRole('tabpanel', { name: /^Felder/ })).toBeVisible();
    await expect(page).toHaveURL(/#design-light-fields$/);

    // Links in the look of a segmented control keep the open tab.
    const languages = light.getByRole('navigation', { name: 'Sprache', exact: true });
    await expect(languages.getByRole('link', { name: 'Deutsch' })).toHaveAttribute('aria-current', 'page');
    await expect(languages.getByRole('link', { name: 'English' })).toHaveAttribute('href', /#design-light-fields$/);
});
