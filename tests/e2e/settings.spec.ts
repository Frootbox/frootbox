/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';
import { axeBuilder } from './axe';

// Settings of extensions and the queue (decision 0221): the news bring
// the number of articles in their feed, the superuser sees the jobs.

test('an admin changes a setting of an extension', async ({ page }) => {
    await signIn(page, '/cms/settings');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Einstellungen');
    const card = page.locator('#settings-frootbox-news');
    const field = card.getByLabel('Artikel im Feed');
    await expect(field).toHaveValue('20');

    await field.fill('0');
    await card.getByRole('button', { name: 'Speichern' }).click();
    await expect(card.locator('.fb-error')).toContainText('mindestens 1');

    await field.fill('5');
    await card.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.locator('.fb-toast').last()).toHaveText('Die Einstellungen sind gespeichert.');
    await page.reload();
    await expect(page.locator('#settings-frootbox-news').getByLabel('Artikel im Feed')).toHaveValue('5');

    // Back to the default, so other tests see the feed as it was.
    expect((await action(page, 'settings.update', { package: 'frootbox/news', values: { feedItems: 20 } })).status).toBe(200);
});

test('the superuser sees the jobs', async ({ page }) => {
    await signIn(page, '/cms/jobs');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aufträge');
    await expect(page.getByRole('link', { name: 'Aufträge' }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Warteschlange' })).toBeVisible();
});

// The installed extensions, read only (decision 0274).
test('the superuser sees the installed extensions', async ({ page }) => {
    await signIn(page, '/cms/extensions');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Erweiterungen');
    await expect(page.getByRole('link', { name: 'Erweiterungen' }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.fb-list__item').filter({ hasText: 'frootbox/news' })).toContainText('Einstellungen');
    await expect(page.getByText('composer require frootbox/news')).toBeVisible();

    const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
});

// SMTP of the core (decision 0269): its own card with the state and a
// test mail. Nothing listens on port 1, so the error of the server shows.
test('an admin sends a test mail over the SMTP server of the settings', async ({ page }) => {
    await signIn(page, '/cms/settings');
    const card = page.locator('#settings-frootbox-core-mail');
    await expect(card.getByRole('heading', { name: 'E-Mail' })).toBeVisible();
    await expect(card.getByText('Ohne SMTP-Server', { exact: true })).toBeVisible();

    expect((await action(page, 'settings.update', { package: 'frootbox/core.mail', values: { host: '127.0.0.1', port: 1 } })).status).toBe(200);
    await page.reload();
    await expect(card.getByText('Mails gehen über den SMTP-Server 127.0.0.1 hinaus, Port 1.')).toBeVisible();

    await card.getByLabel('Testmail senden an').fill('team@example.test');
    await card.getByRole('button', { name: 'Testmail senden' }).click();
    await expect(card.getByText('The SMTP server did not take the mail', { exact: false })).toBeVisible();

    // Back to mail() of PHP, so other tests see the website as it was.
    expect((await action(page, 'settings.update', { package: 'frootbox/core.mail', values: { host: '', port: 587 } })).status).toBe(200);
});
