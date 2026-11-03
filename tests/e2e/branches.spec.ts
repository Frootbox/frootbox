/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
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

// Roles within a space of a plugin (decision 0245): an editor for the
// jobs of "Ausbildung" sees and changes only these.
test('limits an editor to a space of the jobs', async ({ page, browser }) => {
    const id = unique();
    const email = `verwaltung-${id}@example.test`;

    await signIn(page, '/cms/vacancies');
    const space = await action(page, 'space.create', { type: 'frootbox/jobs/job', title: `Ausbildung ${id}` });
    expect(space.status).toBe(200);
    const spaceId: string = space.body.data.id;
    const inside = await action(page, 'frootbox/jobs/job.create', { translations: { de: { title: `Azubi ${id}` } }, space: spaceId });
    const outside = await action(page, 'frootbox/jobs/job.create', { translations: { de: { title: `Koch ${id}` } } });
    expect([inside.status, outside.status]).toEqual([200, 200]);
    const created = await action(page, 'user.create', { email, name: 'Verwaltung Redakteur', password: PASSWORD, roles: [] });
    expect(created.status).toBe(200);
    const userId: number = created.body.data.user.id;

    // The admin gives the role in the user screen.
    await page.goto(`/cms/users/${userId}`);
    const spaces = page.locator('#user-spaces');
    await spaces.getByLabel('Rolle').selectOption('editor');
    await spaces.getByLabel('Verwaltung').selectOption({ label: `Stellenangebote · Ausbildung ${id}` });
    await spaces.getByRole('button', { name: 'Rolle vergeben' }).click();
    await expect(page.locator('.fb-toast').last()).toHaveText('Die Rolle ist vergeben.');
    await expect(spaces.locator('.fb-list__meta')).toHaveText(`Stellenangebote · Ausbildung ${id}`);

    // A context of its own for the editor, and for axe.
    const context = await browser.newContext();
    const editor = await context.newPage();
    await signIn(editor, '/cms/vacancies', { email, password: PASSWORD });
    await expect(editor.getByRole('link', { name: `Azubi ${id}` })).toBeVisible();
    await expect(editor.getByRole('link', { name: `Koch ${id}` })).toHaveCount(0);
    await expect(editor.getByRole('link', { name: 'Neue Stelle' }).first()).toHaveAttribute('href', `/cms/vacancies/new?space=${spaceId}`);
    expect((await editor.request.get(`/cms/vacancies/${outside.body.data.id}`)).status()).toBe(403);
    expect((await action(editor, 'frootbox/jobs/job.update', { id: outside.body.data.id, translations: { de: { title: 'Nein' } } })).status).toBe(403);
    expect((await action(editor, 'frootbox/jobs/job.publish', { ids: [inside.body.data.id] })).status).toBe(200);
    await context.close();

    // The user screen with the new section has no violations.
    await page.waitForLoadState('load');
    const results = await new AxeBuilder({ page }).include('#user-spaces').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);

    for (const job of [inside, outside]) {
        expect((await action(page, 'frootbox/jobs/job.delete', { id: job.body.data.id })).status).toBe(200);
    }

    expect((await action(page, 'space.delete', { id: spaceId })).status).toBe(200);
    expect((await action(page, 'user.delete', { id: userId })).status).toBe(200);
});
