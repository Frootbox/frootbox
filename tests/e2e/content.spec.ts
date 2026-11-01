/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test, type Page } from '@playwright/test';
import { signIn } from './admin';

// Pages, navigations and redirects in the backend (decisions 0116 and
// 0117). Titles are unique, so retries find no leftovers. Navigations
// end without a draft, so the website stays as delivery.spec.ts expects.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/**
 * Creates a draft below the start page and returns its id and address.
 * The layout needs a heading before publishing; until the editing mode
 * (phase 4) the test fills it through the action.
 */
async function createPage(page: Page, title: string, parent: string | null = null): Promise<{ id: string; slug: string }> {
    // A page below another one is made by someone already signed in.
    if (parent === null) {
        await signIn(page, '/cms/pages/new');
    } else {
        await page.goto(`/cms/pages/new?parent=${parent}`);
    }

    // The address follows the title once the scripts run.
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel('Titel').fill(title);
    await expect(page.getByLabel('Adresse')).not.toHaveValue('');
    const slug = await page.getByLabel('Adresse').inputValue();
    await page.getByRole('button', { name: 'Als Entwurf anlegen' }).click();
    await expect(page).toHaveURL(/\/cms\/pages\/[0-9A-Z]{26}$/);
    // The forms remember their state once their script runs (decision 0130).
    await page.waitForFunction(() => customElements.get('fb-form') !== undefined);
    const id = page.url().split('/').pop() ?? '';

    const status = await page.evaluate(async ([id, title]) => {
        const meta = (name: string) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
        const response = await fetch(meta('fb-actions') + 'page.update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': meta('fb-csrf') },
            body: JSON.stringify({ id, translations: { de: { content: { fields: { title } } } } }),
        });

        return response.status;
    }, [id, title]);
    expect(status).toBe(200);

    return { id, slug };
}

const detail = (page: Page) => page.locator('#page-detail');
const status = (page: Page) => page.locator('#page-detail > .fb-card__header .fb-badge').last();

test('creates, publishes and restores a page', async ({ page }) => {
    const title = `Testseite ${unique()}`;
    const { slug } = await createPage(page, title);

    await expect(page.locator('.fb-toast')).toBeVisible();
    await expect(page.locator('#page-detail-title')).toHaveText(title);
    await expect(status(page)).toHaveText('Entwurf');
    await expect(page.locator('#page-tree').getByRole('link', { name: new RegExp(title) })).toHaveAttribute('aria-current', 'page');

    await detail(page).getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-toast').last()).toHaveText('Die Seite ist veröffentlicht.');
    expect((await page.request.get(`/${slug}`)).status()).toBe(200);

    await detail(page).getByLabel('Titel').fill(`${title} neu`);
    await detail(page).getByRole('button', { name: 'Speichern' }).first().click();
    await expect(status(page)).toHaveText('Geändert');
    await detail(page).getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('#page-detail-title')).toHaveText(`${title} neu`);

    await detail(page).getByRole('button', { name: 'Version 1 wiederherstellen' }).click();
    await expect(page.locator('.fb-toast').last()).toHaveText('Version 1 steht jetzt im Entwurf.');
    await expect(page.locator('#page-detail-title')).toHaveText(title);
    await expect(status(page)).toHaveText('Geändert');

    await detail(page).getByRole('button', { name: 'Entwurf verwerfen' }).click();
    await page.locator('#page-discard').getByRole('button', { name: 'Verwerfen' }).click();
    await expect(page.locator('#page-detail-title')).toHaveText(`${title} neu`);
});

test('writes the address of a title in Latin letters', async ({ page }) => {
    await signIn(page, '/cms/pages/new');
    await page.waitForLoadState('domcontentloaded');
    const address = page.getByLabel('Adresse');

    // The rules of the core through page.slug (decision 0134), not a copy in the script.
    await page.getByLabel('Titel').fill('Łódź & Москва');
    await expect(address).toHaveValue('lodz-moskva');
    await page.getByLabel('Titel').fill('Über İstanbul');
    await expect(address).toHaveValue('ueber-istanbul');

    // Once typed into, the address stays.
    await address.fill('eigene-adresse');
    await page.getByLabel('Titel').fill('Etwas anderes');
    await page.waitForTimeout(400);
    await expect(address).toHaveValue('eigene-adresse');
});

test('moves a page with the keyboard', async ({ page }) => {
    // In a branch of its own: tests running at the same time add pages
    // below the start page, which must not get a subpage from this one.
    const name = unique();
    const branch = await createPage(page, `Verschieben ${name}`);
    await createPage(page, `Erste ${name}`, branch.id);
    await createPage(page, `Zweite ${name}`, branch.id);
    const link = () => page.locator('#page-tree').getByRole('link', { name: new RegExp(`Zweite ${name}`) });
    // The keys work once the script of the tree runs.
    await page.waitForFunction(() => customElements.get('fb-tree') !== undefined);

    await link().press('Alt+ArrowUp');
    await expect(page.locator('.fb-toast').last()).toContainText(`„Zweite ${name}“ steht jetzt unter „Verschieben ${name}“, an Stelle 1 von 2`);
    await expect(link()).toBeFocused();

    await page.keyboard.press('Alt+ArrowDown');
    await expect(page.locator('.fb-toast').last()).toContainText(`„Zweite ${name}“ steht jetzt unter „Verschieben ${name}“, an Stelle 2 von 2`);
    await expect(link()).toBeFocused();

    await page.keyboard.press('Alt+ArrowRight');
    await expect(page.locator('.fb-toast').last()).toContainText(`„Zweite ${name}“ steht jetzt unter „Erste ${name}“`);
    await expect(link()).toBeFocused();
});

test('locks a page for visitors right away', async ({ page }) => {
    const title = `Gesperrt ${unique()}`;
    const { slug } = await createPage(page, title);
    await detail(page).getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(status(page)).toHaveText('Veröffentlicht');

    await detail(page).getByRole('button', { name: 'Für Besucher sperren' }).click();
    await page.locator('#page-lock').getByRole('button', { name: 'Sperren' }).click();

    await expect(page.locator('.fb-toast').last()).toHaveText('Die Seite ist gesperrt.');
    await expect(detail(page).getByText('Für Besucher gesperrt')).toBeVisible();
    const locked = await page.request.get(`/${slug}`);
    expect(locked.status()).toBe(503);
    expect(locked.headers()['x-robots-tag']).toBe('noindex');

    await detail(page).getByRole('button', { name: 'Entsperren' }).click();
    await expect(page.locator('.fb-toast').last()).toHaveText('Die Seite ist entsperrt.');
    expect((await page.request.get(`/${slug}`)).status()).toBe(200);
});

test('opens and closes branches of the sitemap', async ({ page }) => {
    // Decisions 0135 and 0136: a branch opens and closes, this browser remembers.
    const parent = await createPage(page, `Zweig ${unique()}`);
    const child = await createPage(page, `Blatt ${unique()}`, parent.id);
    await page.goto('/cms/pages');

    const item = page.locator(`#page-tree [data-id="${parent.id}"]`);
    const toggle = item.locator(':scope > .fb-tree__row > button.fb-tree__toggle');
    const leaf = page.locator(`#page-tree [data-id="${child.id}"] > .fb-tree__row a`);

    // Small trees start open, large ones closed; other tests add pages.
    if (await toggle.getAttribute('aria-expanded') === 'false') {
        await toggle.click();
    }

    await expect(leaf).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(leaf).toBeHidden();

    await page.reload();
    await expect(leaf).toBeHidden();

    // Arrow right opens the branch again, arrow left closes it.
    await item.locator(':scope > .fb-tree__row a').focus();
    await page.keyboard.press('ArrowRight');
    await expect(leaf).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(leaf).toBeHidden();
    await expect(item.locator(':scope > .fb-tree__row .fb-tree__flag')).toHaveText('Entwurf');
});

test('finds a page in the sitemap', async ({ page }) => {
    // Decision 0136: the search shows the hits with the way to them.
    const word = `Suchbar${unique()}`;
    const parent = await createPage(page, `Bereich ${unique()}`);
    const child = await createPage(page, `Tiefe Seite ${word}`, parent.id);
    await page.goto('/cms/pages');

    await page.keyboard.press('/');
    const search = page.getByLabel('Seite finden');
    await expect(search).toBeFocused();
    await search.fill(word.toLowerCase());

    const tree = page.locator('#page-tree');
    await expect(page.locator('#page-tree-filter-status')).toHaveText('Eine Seite gefunden');
    await expect(tree.locator('.fb-tree__item:not([hidden])')).toHaveCount(3);
    await expect(tree.locator(`[data-id="${child.id}"] mark`)).toHaveText(word);

    await search.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/cms/pages/${child.id}$`));
    await expect(detail(page).getByLabel('Titel')).toHaveValue(`Tiefe Seite ${word}`);

    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(tree.locator('.fb-tree__item[hidden]')).toHaveCount(0);
    await expect(tree.locator(`[data-id="${child.id}"] > .fb-tree__row a`)).toBeVisible();
});

test('marks unsaved changes and asks before they get lost', async ({ page }) => {
    // Decision 0130: the save button turns primary while its form is changed.
    const title = `Ungespeichert ${unique()}`;
    await createPage(page, title);
    const form = detail(page).locator('fb-form[action="page.update"]').first();
    const save = form.getByRole('button', { name: 'Speichern' });
    const visibility = detail(page).locator('fb-form[action="page.update"]').nth(1);

    await expect(save).toHaveClass(/fb-button--tonal/);
    await form.getByLabel('Titel').fill(`${title} neu`);
    await expect(save).toHaveClass(/fb-button--primary/);
    await expect(form.getByRole('status')).toHaveText('Nicht gespeichert');

    await form.getByLabel('Titel').fill(title);
    await expect(save).toHaveClass(/fb-button--tonal/);
    await expect(form.getByRole('status')).toHaveText('');

    // Another page in the tree asks first; staying keeps the change.
    await form.getByLabel('Titel').fill(`${title} neu`);
    await visibility.getByLabel('Suchmaschinen').selectOption({ index: 1 });
    page.once('dialog', (dialog) => {
        expect(dialog.message()).toBe('Deine Änderungen sind nicht gespeichert. Trotzdem verlassen?');
        void dialog.dismiss();
    });
    await page.locator('#page-tree').getByRole('link', { name: /Über uns/ }).click();
    await expect(form.getByLabel('Titel')).toHaveValue(`${title} neu`);

    // Saving one form keeps the changes of the other.
    await save.click();
    await expect(page.locator('#page-detail-title')).toHaveText(`${title} neu`);
    await expect(detail(page).locator('fb-form[action="page.update"]').first().getByRole('button', { name: 'Speichern' })).toHaveClass(/fb-button--tonal/);
    await expect(visibility).toHaveAttribute('dirty');
    await expect(visibility.getByRole('status')).toHaveText('Nicht gespeichert');
});

test('edits the items of a navigation', async ({ page }) => {
    await signIn(page, '/cms/navigations/footer');
    const items = page.locator('#navigation-tree .fb-tree__item');
    const count = await items.count();

    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click();
    const dialog = page.locator('#navigation-item');
    await dialog.getByLabel('Art').selectOption({ label: 'Telefonnummer' });
    await expect(dialog.getByLabel('Seite')).toBeHidden();
    await dialog.getByLabel('Telefonnummer').fill('abc');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog.getByLabel('Telefonnummer')).toHaveAccessibleDescription('muss eine Telefonnummer wie „+49 40 123456“ sein.');

    await dialog.getByLabel('Telefonnummer').fill('+49 40 987654');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).toBeHidden();
    await expect(items).toHaveCount(count + 1);
    await expect(items.last()).toHaveAttribute('data-title', '+49 40 987654');
    await expect(page.locator('#navigation-detail .fb-badge').first()).toHaveText('Geändert');

    // Up one place with the keyboard, then away again.
    await items.last().locator('.fb-tree__link').press('Alt+ArrowUp');
    await expect(page.locator('.fb-toast').last()).toHaveText(`„+49 40 987654“ steht jetzt an Stelle ${count} von ${count + 1}.`);

    await page.locator('#navigation-tree').getByRole('button', { name: /\+49 40 987654/ }).click();
    await dialog.getByRole('button', { name: 'Entfernen' }).click();
    await expect(page.locator('.fb-toast').last()).toHaveText('Der Punkt ist entfernt.');
    await expect(items).toHaveCount(count);

    await page.getByRole('button', { name: 'Entwurf verwerfen' }).click();
    await page.locator('#navigation-discard').getByRole('button', { name: 'Verwerfen' }).click();
    await expect(page.locator('#navigation-detail .fb-badge').first()).toHaveText('Veröffentlicht');
});

test('creates a redirect to a page', async ({ page }) => {
    const path = `/alt-${unique()}`;
    await signIn(page, '/cms/redirects');

    await page.getByRole('button', { name: 'Neue Weiterleitung' }).click();
    const dialog = page.locator('#redirect-new');
    await dialog.getByLabel('Alte Adresse').fill(path);
    await dialog.getByLabel('Seite', { exact: true }).selectOption({ label: '– Über uns' });
    await dialog.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.locator('.fb-toast').last()).toHaveText('Die Weiterleitung ist gespeichert.');
    await expect(page.locator('#redirects')).toContainText(path);
    const response = await page.request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe('/ueber-uns');
});
