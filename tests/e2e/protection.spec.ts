/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// The password of the website (decision 0153). It holds for the whole
// installation, so these tests run in a project of their own after all
// others (playwright.config.ts), one after the other, and switch the
// protection off at the end.

test.describe.configure({ mode: 'serial' });

test('locks out guests until they know the password', async ({ page, browser, request: guest }) => {
    await signIn(page, '/cms/access');

    // A page in the cache must not leak either.
    await expect.poll(async () => (await guest.get('/kontakt')).headers()['x-frootbox-cache'], { timeout: 15000 }).toBe('hit');

    await page.getByLabel('Passwort', { exact: true }).fill('bohnen-vorschau');
    await page.getByRole('button', { name: 'Website schützen' }).click();
    await expect(page.locator('.fb-nav__item--notice')).toHaveText('Website ist passwortgeschützt');

    const locked = await guest.get('/kontakt');
    expect(locked.status()).toBe(401);
    expect(locked.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(await locked.text()).toContain('name="fb-site-password"');
    expect(await (await guest.get('/robots.txt')).text()).toContain('Disallow: /');

    // Backend and REST API stay reachable.
    expect((await guest.get('/cms/login')).status()).toBe(200);
    expect((await guest.get('/api/v1/openapi.json')).status()).toBe(200);

    // A preview link gets past the password.
    const link = await action(page, 'preview.create', { note: 'Am Passwort vorbei' });
    const customer = await browser.newContext();
    const customerPage = await customer.newPage();
    await customerPage.goto(link.body.data.path);
    await expect(customerPage).toHaveURL('/');
    await expect(customerPage.locator('fb-preview-note')).toHaveCount(1);
    await customer.close();

    // In the browser: wrong, then right.
    const visitors = await browser.newContext();
    const visitorPage = await visitors.newPage();
    const response = await visitorPage.goto('/kontakt');
    expect(response?.status()).toBe(401);
    await expect(visitorPage.getByRole('heading', { level: 1 })).toHaveText('Noch nicht öffentlich');
    await visitorPage.getByLabel('Passwort').fill('falsch-geraten');
    await visitorPage.getByRole('button', { name: 'Weiter' }).click();
    await expect(visitorPage.getByRole('alert')).toHaveText('Das Passwort stimmt nicht.');
    await visitorPage.getByLabel('Passwort').fill('bohnen-vorschau');
    await visitorPage.getByRole('button', { name: 'Weiter' }).click();
    await expect(visitorPage).toHaveURL('/kontakt');
    await expect(visitorPage.locator('main.fb-login')).toHaveCount(0);

    // A new password locks out browsers let in before.
    await page.reload();
    await page.getByLabel('Neues Passwort').fill('neue-bohnen-2026');
    await page.getByRole('button', { name: 'Neues Passwort setzen' }).click();
    await expect(page.getByText('Das neue Passwort gilt.')).toBeVisible();
    expect((await visitorPage.goto('/kontakt'))?.status()).toBe(401);
    await visitors.close();
});

test('throttles wrong passwords', async ({ request }) => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 12; attempt++) {
        const response = await request.post('/kontakt', { form: { 'fb-site-password': `falsch-${attempt}` } });
        statuses.push(response.status());

        if ((await response.text()).includes('Zu viele Versuche')) {
            break;
        }
    }

    expect(statuses.every((status) => status === 401)).toBe(true);
    expect(statuses.length).toBeLessThan(12);
});

test('switches the protection off again', async ({ page, request }) => {
    await signIn(page, '/cms/access');
    await page.getByRole('button', { name: 'Ausschalten' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ausschalten' }).click();
    await expect(page.locator('.fb-nav__item--notice')).toHaveCount(0);

    expect((await request.get('/kontakt')).status()).toBe(200);
});
