/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

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
