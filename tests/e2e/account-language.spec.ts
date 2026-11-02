/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The language of the backend per user (decision 0161). An own user, so
// the other tests keep the German backend of the admin. The email is
// unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/** The title of a block from block.list in the language of the user. */
async function blockTitle(page: Page, name: string): Promise<string> {
    return page.evaluate(async (name) => {
        const response = await fetch('/cms/queries/block.list', { headers: { Accept: 'application/json' } });
        const blocks: { name: string; title: string }[] = (await response.json()).data;

        return blocks.find((block) => block.name === name)?.title ?? '';
    }, name);
}

test('lets each user choose the language of the backend', async ({ page, browser }) => {
    const account = { email: `sprache-${unique()}@example.test`, password: `e2e-sprache-${unique()}` };

    await signIn(page, '/cms/users');
    const created = await action(page, 'user.create', { email: account.email, name: 'Lena Sprache', password: account.password, roles: ['editor'] });
    expect(created.status).toBe(200);
    const id: number = created.body.data.user.id;

    const context = await browser.newContext();
    const own = await context.newPage();
    await signIn(own, '/cms/account', account);
    await expect(own.getByRole('heading', { level: 1 })).toHaveText('Dein Konto');
    const select = own.getByLabel('Sprache des Backends');
    await expect(select).toHaveValue('');
    await expect(select.locator('option')).toHaveText(['Automatisch (Deutsch)', 'Deutsch', 'English']);

    // English, for this user only.
    await select.selectOption('en');
    await own.getByRole('button', { name: 'Speichern' }).first().click();
    await expect(own.getByRole('heading', { level: 1 })).toHaveText('Your account');
    await expect(own.locator('html')).toHaveAttribute('lang', 'en');
    await expect(own.getByLabel('Language of the backend')).toHaveValue('en');

    // Labels of the themes follow, the admin keeps German.
    expect(await blockTitle(own, 'frootbox/theme-base/Section')).toBe('Section');
    expect(await blockTitle(page, 'frootbox/theme-base/Section')).toBe('Abschnitt');
    await page.goto('/cms/account');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dein Konto');

    // Back to automatic.
    await own.getByLabel('Language of the backend').selectOption('');
    await own.getByRole('button', { name: 'Save' }).first().click();
    await expect(own.getByRole('heading', { level: 1 })).toHaveText('Dein Konto');
    await context.close();

    expect((await action(page, 'user.delete', { id })).status).toBe(200);
});
