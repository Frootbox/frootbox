/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Preview links for customers without an account (decision 0152): the
// whole website in its draft, read only, with a note instead of the bar.
// The pages are unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test('shows guests with a link the draft and nothing else', async ({ page, browser, request }) => {
    const slug = `vorschau-${unique()}`;
    const published = `Veröffentlicht ${slug}`;
    const draft = `Entwurf ${slug}`;
    const hidden = `Nie veröffentlicht ${slug}`;

    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        translations: { de: { title: 'Vorschau', slug, content: { fields: { title: published } } } },
        parentId: start,
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);
    expect((await action(page, 'page.update', { id, translations: { de: { content: { fields: { title: draft } } } } })).status).toBe(200);
    const child = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        translations: { de: { title: 'Geheim', slug: 'geheim', content: { fields: { title: hidden } } } },
        parentId: id,
    });
    expect(child.status).toBe(200);

    const link = await action(page, 'preview.create', { note: `Test ${slug}`, pageId: id });
    expect(link.status).toBe(200);
    expect(link.body.data.path).toMatch(new RegExp(`^/${slug}\\?fb-preview=[A-Za-z0-9_-]{43}$`));

    // The screen lists it, not opened yet.
    await page.goto('/cms/access');
    const row = page.locator('.fb-list__item', { hasText: `Test ${slug}` });
    await expect(row).toContainText('noch nicht geöffnet');

    // The customer has no account: a context of its own.
    const guest = await browser.newContext();
    const customer = await guest.newPage();
    const opened = await customer.goto(link.body.data.path);
    expect(opened?.headers()['cache-control']).toContain('no-store');
    expect(opened?.headers()['x-robots-tag']).toBe('noindex, nofollow');
    await expect(customer).toHaveURL(`/${slug}`);
    await expect(customer.getByRole('heading', { level: 1 })).toHaveText(draft);
    await expect(customer.locator('fb-editor-bar')).toHaveCount(0);
    await expect(customer.locator('[data-fb-field], fb-field')).toHaveCount(0);
    const note = customer.locator('fb-preview-note');
    await expect(note.getByText('Vorschau, noch nicht veröffentlicht')).toBeVisible();

    await customer.goto(`/${slug}/geheim`);
    await expect(customer.getByRole('heading', { level: 1 })).toHaveText(hidden);

    // Everyone else gets the published page, the cache never the preview.
    expect((await request.get(`/${slug}/geheim`)).status()).toBe(404);
    await expect.poll(async () => {
        const response = await request.get(`/${slug}`);
        expect(await response.text()).toContain(published);

        return response.headers()['x-frootbox-cache'];
    }, { timeout: 15000 }).toBe('hit');
    const again = await customer.goto(`/${slug}`);
    expect(again?.headers()['x-frootbox-cache']).toBeUndefined();
    await expect(customer.getByRole('heading', { level: 1 })).toHaveText(draft);

    await page.reload();
    await expect(row).toContainText('geöffnet, zuletzt am');

    // Revoked, it stops at once.
    expect((await action(page, 'preview.revoke', { id: link.body.data.id })).status).toBe(200);
    const ended = await customer.goto(`/${slug}`);
    expect(ended?.status()).toBe(410);
    await expect(customer.getByRole('heading', { level: 1 })).toHaveText('Vorschaulink abgelaufen');

    await guest.close();
});

test('ends the preview with the note', async ({ page, browser }) => {
    await signIn(page, '/cms/access');
    const link = await action(page, 'preview.create', { note: `Beenden ${unique()}` });
    expect(link.status).toBe(200);

    const guest = await browser.newContext();
    const customer = await guest.newPage();
    await customer.goto(link.body.data.path);
    await expect(customer).toHaveURL('/');

    await customer.locator('fb-preview-note').getByRole('link', { name: 'Vorschau beenden' }).click();
    await expect(customer).toHaveURL('/');
    await expect(customer.locator('fb-preview-note')).toHaveCount(0);

    await guest.close();
});

test('shares a preview from the editor bar', async ({ page }) => {
    await signIn(page, '/cms/pages');
    await page.goto('/');

    const bar = page.locator('fb-editor-bar');
    await bar.getByRole('button', { name: 'Mehr' }).click();
    await bar.getByRole('menuitem', { name: 'Vorschau teilen …' }).click();

    const dialog = bar.getByRole('dialog', { name: 'Vorschau teilen' });
    await expect(dialog.getByLabel('Gültig für')).toHaveValue(/T/);
    await expect(dialog.getByLabel('Gültig für').locator('option:checked')).toHaveText('14 Tage');
    await dialog.getByLabel('Notiz (optional)').fill(`Leiste ${unique()}`);
    await dialog.getByRole('button', { name: 'Link anlegen' }).click();

    const ready = bar.getByRole('dialog', { name: 'Der Vorschaulink ist fertig' });
    await expect(ready.getByRole('textbox', { name: 'Vorschaulink' })).toHaveValue(/\/\?fb-preview=[A-Za-z0-9_-]{43}$/);
    await ready.getByRole('button', { name: 'Fertig' }).click();
    await expect(ready).toHaveCount(0);
});
