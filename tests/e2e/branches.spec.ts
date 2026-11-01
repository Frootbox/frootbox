/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test, type Page } from '@playwright/test';
import { signIn } from './admin';

// Roles within a branch of the page tree (decision 0118): an editor for
// "Über uns" sees the way to it, changes only there, and the REST API
// says the same. The user is unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const PASSWORD = 'e2e-zweig-redakteur-42';

/** Runs an action with the session of the page, as the backend does. */
async function action(page: Page, name: string, input: object): Promise<{ status: number; body: any }> {
    return page.evaluate(async ([name, input]) => {
        const meta = (key: string) => document.querySelector(`meta[name="${key}"]`)?.getAttribute('content') ?? '';
        const response = await fetch(meta('fb-actions') + name, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': meta('fb-csrf') },
            body: JSON.stringify(input),
        });

        return { status: response.status, body: await response.json() };
    }, [name, input] as const);
}

/** The id of a page in the tree by its address. */
async function pageId(page: Page, path: string): Promise<string> {
    const id = await page.locator(`#page-tree .fb-tree__item[data-path="${path}"]`).getAttribute('data-id');
    expect(id).toBeTruthy();

    return id ?? '';
}

test('limits an editor to the branch', async ({ page, browser }) => {
    const email = `zweig-${unique()}@example.test`;

    await signIn(page, '/cms/pages');
    const start = await pageId(page, '/');
    const about = await pageId(page, '/ueber-uns');
    const created = await action(page, 'user.create', { email, name: 'Zweig Redakteur', password: PASSWORD, roles: [] });
    expect(created.status).toBe(200);
    const userId: number = created.body.data.user.id;

    // The admin gives the role in the user screen.
    await page.goto(`/cms/users/${userId}`);
    const branches = page.locator('#user-branches');
    await branches.getByLabel('Rolle').selectOption('editor');
    await branches.getByLabel('Seite').selectOption(`page:${about}`);
    await branches.getByRole('button', { name: 'Rolle vergeben' }).click();
    await expect(page.locator('.fb-toast').last()).toHaveText('Die Rolle ist vergeben.');
    await expect(branches.locator('.fb-list__meta')).toContainText('/ueber-uns');

    // The editor in a browser of their own.
    const context = await browser.newContext();
    const editor = await context.newPage();
    await editor.goto('/cms/pages');
    await editor.getByLabel('E-Mail').fill(email);
    await editor.getByLabel('Passwort').fill(PASSWORD);
    await editor.getByRole('button', { name: 'Anmelden' }).click();
    await expect(editor).toHaveURL('/cms/pages');

    const tree = editor.locator('#page-tree');
    const top = tree.locator(`[data-id="${start}"]`);
    await expect(top).toHaveAttribute('data-outside', '');
    await expect(top.locator(':scope > .fb-tree__row')).toContainText('Außerhalb Deiner Seiten');
    await expect(top.locator(':scope > .fb-tree__row a')).toHaveCount(0);
    await expect(tree.locator(`[data-id="${about}"] > .fb-tree__row a`)).toHaveAttribute('aria-current', 'page');
    await expect(editor.getByRole('navigation').getByRole('link', { name: 'Navigationen' })).toHaveCount(0);

    const detail = editor.locator('#page-detail');
    await expect(detail.getByLabel('Adresse')).toBeVisible();
    await expect(detail.getByRole('button', { name: 'Offline nehmen' })).toBeVisible();
    await expect(detail.getByRole('button', { name: 'Seite löschen' })).toHaveCount(0);
    expect((await editor.request.get(`/cms/pages/${start}`)).status()).toBe(403);
    expect((await action(editor, 'page.update', { id: start, excludeFromSiteSearch: 'page' })).status).toBe(403);

    // The REST API says the same.
    const token = await action(editor, 'account.create-token', { name: 'Test' });
    expect(token.status).toBe(200);
    const headers = { Authorization: `Bearer ${token.body.data.token}` };
    expect((await editor.request.get(`/api/v1/page.show?id=${about}`, { headers })).status()).toBe(200);
    expect((await editor.request.get(`/api/v1/page.show?id=${start}`, { headers })).status()).toBe(403);
    expect((await editor.request.post('/api/v1/navigation.update', { headers, data: { name: 'main', items: {} } })).status()).toBe(403);

    await context.close();
    expect((await action(page, 'user.delete', { id: userId })).status).toBe(200);
});
