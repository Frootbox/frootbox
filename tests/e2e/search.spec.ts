/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { action, ready, signIn } from './admin';

// The global search (decisions 0214, 0217): Ctrl+K or ⌘+K opens it from
// any screen and from the editor bar, the keyboard opens a hit, every
// spelling counts, and an editor with a branch finds only pages there,
// in the backend as in the REST API. Words are unique, so retries find
// no leftovers.

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const PASSWORD = 'e2e-such-redakteur-42';
const KEYS = 'ControlOrMeta+k';

async function createPage(page: Page, parentId: string, title: string, text: string): Promise<string> {
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId,
        translations: { de: { title, content: { fields: { title }, areas: { main: [
            { block: 'frootbox/theme-base/Quote', fields: { quote: text, author: 'Frau Müller' } },
        ] } } } },
    });
    expect(created.status).toBe(200);

    return created.body.data.id;
}

async function pageId(page: Page, path: string): Promise<string> {
    const id = await page.locator(`#page-tree .fb-tree__item[data-path="${path}"]`).getAttribute('data-id');
    expect(id).toBeTruthy();

    return id ?? '';
}

test('finds a page from any screen and opens it with the keyboard', async ({ page }) => {
    const word = `Röstgrad${unique()}`;

    await signIn(page, '/cms/pages');
    const start = await pageId(page, '/');
    const id = await createPage(page, start, `Sorten ${word}`, `Unser Espresso mit hellem ${word}`);
    const size = await createPage(page, start, `Größe ${word}`, 'Tassen');

    await page.goto('/cms/media');
    await ready(page, 'fb-search');
    await page.keyboard.press(KEYS);
    const dialog = page.getByRole('dialog', { name: 'Suchen' });
    await expect(dialog).toBeVisible();
    const field = dialog.getByRole('combobox', { name: 'Suchen' });
    await expect(field).toBeFocused();

    await field.fill(word.toLowerCase().replace('ö', 'oe'));
    const results = dialog.getByRole('listbox');
    await expect(results.getByRole('group', { name: 'Seiten' }).getByRole('option')).toHaveCount(2);
    await expect(dialog.getByRole('status')).toHaveText('2 Treffer');
    await expect(results.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');

    // Every spelling: "grosse" finds "Größe".
    await field.fill(`grosse ${word}`);
    await expect(results.getByRole('option')).toHaveCount(1);
    await expect(results.getByRole('option')).toContainText(`Größe ${word}`);

    await field.fill(`espresso ${word}`);
    await expect(results.getByRole('option')).toHaveCount(1);
    await expect(results.getByRole('option')).toContainText(`Unser Espresso mit hellem ${word}`);
    await field.press('Enter');
    await expect(page).toHaveURL(`/cms/pages/${id}`);

    // Screens and commands by their name, all hits on the screen of the search.
    await ready(page, 'fb-search');
    await page.getByRole('link', { name: 'Suchen' }).click();
    await dialog.getByRole('combobox').fill('neue seite');
    await expect(results.getByRole('group', { name: 'Gehe zu' }).getByRole('option', { name: 'Neue Seite' })).toBeVisible();
    await dialog.getByRole('combobox').press('Escape');
    await expect(dialog).toBeHidden();

    await page.goto(`/cms/search?q=${encodeURIComponent(word)}`);
    await expect(page.getByRole('heading', { name: 'Seiten' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: `Größe ${word}` })).toHaveAttribute('href', `/cms/pages/${size}`);

    for (const created of [id, size]) {
        expect((await action(page, 'page.delete', { id: created })).status).toBe(200);
    }
});

test('an editor with a branch finds only pages there, also in the REST API', async ({ page, browser }) => {
    const word = `Bohnensorte${unique()}`;
    const email = `suche-${unique()}@example.test`;

    await signIn(page, '/cms/pages');
    const start = await pageId(page, '/');
    const about = await pageId(page, '/ueber-uns');
    const inside = await createPage(page, about, `Innen ${word}`, word);
    const outside = await createPage(page, start, `Außen ${word}`, word);
    const created = await action(page, 'user.create', { email, name: 'Such Redakteur', password: PASSWORD, roles: [] });
    expect(created.status).toBe(200);
    const userId: number = created.body.data.user.id;
    expect((await action(page, 'user.assign-role', { userId, role: 'editor', scope: `page:${about}` })).status).toBe(200);

    const context = await browser.newContext();
    const editor = await context.newPage();
    await editor.goto('/cms/pages');
    await editor.getByLabel('E-Mail').fill(email);
    await editor.getByLabel('Passwort').fill(PASSWORD);
    await editor.getByRole('button', { name: 'Anmelden' }).click();
    await expect(editor).toHaveURL('/cms/pages');

    await ready(editor, 'fb-search');
    await editor.keyboard.press(KEYS);
    const dialog = editor.getByRole('dialog', { name: 'Suchen' });
    await dialog.getByRole('combobox').fill(word);
    await expect(dialog.getByRole('option')).toHaveCount(1);
    await expect(dialog.getByRole('option')).toContainText(`Innen ${word}`);

    const token = await action(editor, 'account.create-token', { name: 'Suche' });
    expect(token.status).toBe(200);
    const response = await editor.request.get(`/api/v1/search.find?q=${encodeURIComponent(word)}`, { headers: { Authorization: `Bearer ${token.body.data.token}` } });
    expect(response.status()).toBe(200);
    const hits = (await response.json()).data;
    expect(hits.map((hit: { item: string }) => hit.item)).toEqual([inside]);

    await context.close();
    expect((await action(page, 'user.delete', { id: userId })).status).toBe(200);

    for (const id of [inside, outside]) {
        expect((await action(page, 'page.delete', { id })).status).toBe(200);
    }
});

test('the editor bar opens the same search', async ({ page }) => {
    const word = `Mahlgrad${unique()}`;

    await signIn(page, '/cms/pages');
    const id = await createPage(page, await pageId(page, '/'), `Mühle ${word}`, word);

    await page.goto('/');
    const bar = page.locator('fb-editor-bar');
    await bar.getByRole('button', { name: 'Suchen' }).click();
    const dialog = bar.getByRole('dialog', { name: 'Suchen' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill(word);
    await expect(dialog.getByRole('option')).toContainText(`Mühle ${word}`);
    await dialog.getByRole('combobox').press('Escape');
    await expect(dialog).toBeHidden();

    await page.keyboard.press(KEYS);
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').press('Enter');
    await expect(page).toHaveURL(`/cms/pages/${id}`);

    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
