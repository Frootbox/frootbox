/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// Webhooks (decision 0253): the screen under administration, a webhook
// set up with the actions as checks and its secret shown once. Nothing is
// sent: no action of the test is chosen.

const violations = async (page: Page) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();

    return results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`));
};

test('an admin sets up a webhook and sees its secret once', async ({ page }) => {
    const title = `Shop ${Date.now()}`;
    await signIn(page, '/cms/webhooks');
    await expect(page.getByRole('heading', { name: 'Webhooks', level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Hauptmenü' }).getByRole('link', { name: 'Webhooks' })).toHaveAttribute('aria-current', 'page');
    expect(await violations(page)).toEqual([]);

    await page.getByRole('link', { name: 'Neuer Webhook' }).click();
    await expect(page.getByRole('heading', { name: 'Neuer Webhook', level: 1 })).toBeVisible();
    await page.getByLabel('Titel').fill(title);
    await page.getByLabel('Adresse').fill('http://hooks.example.com/in');
    const group = page.locator('details').filter({ has: page.locator('summary code', { hasText: /^redirect$/ }) });
    await group.locator('summary').click();
    await group.getByLabel('Alle aus redirect').check();
    expect(await violations(page)).toEqual([]);

    // Live only https.
    await page.getByRole('button', { name: 'Webhook einrichten' }).click();
    await expect(page.getByText('Gib eine Adresse mit https:// ein.').first()).toBeVisible();
    await page.getByLabel('Adresse').fill('https://hooks.example.com/in');
    await page.getByRole('button', { name: 'Webhook einrichten' }).click();

    const secret = page.locator('#webhook-secret');
    await expect(secret).toBeVisible();
    await expect(secret.locator('code')).toHaveText(/^whsec_[A-Za-z0-9+/]{32}$/);
    expect(await violations(page)).toEqual([]);

    await secret.getByRole('link', { name: 'Fertig' }).click();
    await page.getByRole('link', { name: title }).click();
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expect(page.getByText('Aktiv', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Alle aus redirect')).toBeChecked();
    await expect(page.getByRole('region', { name: 'Zustellungen' })).toContainText('Noch keine Zustellungen');
    await expect(page.locator('body')).not.toContainText('whsec_');
    expect(await violations(page)).toEqual([]);

    const id = page.url().split('/').pop()!;
    expect((await action(page, 'frootbox/webhooks/webhook.delete', { id })).status).toBe(200);
});
