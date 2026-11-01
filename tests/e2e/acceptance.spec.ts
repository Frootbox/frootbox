/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The goal of M3: an editor without training changes a page on the
// website and publishes it. An editor signs in, changes a text, adds a
// section with an image, changes the footer of the website, publishes
// everything with one button and checks the result as a guest. The page
// and the editor are unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/** A JPEG drawn by the browser. */
async function photo(page: Page, name: string): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
    const data = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#e8b04b';
        context.fillRect(0, 0, 1200, 800);

        return canvas.toDataURL('image/jpeg', 0.9);
    });

    return { name, mimeType: 'image/jpeg', buffer: Buffer.from(data.split(',')[1], 'base64') };
}

test('an editor changes a page on the website and publishes it', async ({ page, browser }) => {
    const id = unique();
    const slug = `abnahme-${id}`;
    const editor = { email: `redaktion-${id}@example.test`, password: 'e2e-redaktion-42' };

    // Prepared by the admin: an editor and a published page.
    await signIn(page, '/cms/pages');
    expect((await action(page, 'user.create', { email: editor.email, name: 'Redaktion', password: editor.password, roles: ['editor'] })).status).toBe(200);
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        parentId: start,
        translations: { de: { title: 'Abnahme', slug, content: { fields: { title: 'Abnahme' }, areas: { main: [
            { block: 'frootbox/theme-bohnenglueck/Text', fields: { body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Wir rösten langsam.' }] }] } } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const pageId: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [pageId] })).status).toBe(200);
    const note: string = await page.evaluate(async () => (await (await fetch('/cms/queries/site.show', { headers: { Accept: 'application/json' } })).json()).data.values.de.note);
    expect(note).toBeTruthy();
    await page.context().clearCookies();

    // The editor signs in and goes from the backend to the page.
    await signIn(page, '/cms', editor);
    await page.getByRole('link', { name: 'Seiten' }).click();
    await page.locator(`#page-tree .fb-tree__item[data-id="${pageId}"] a`).first().click();
    await expect(page).toHaveURL(`/cms/pages/${pageId}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Abnahme' })).toBeVisible();
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);
    const bar = page.locator('fb-editor-bar');
    const heading = page.locator('h1[data-fb-field="title"]');
    await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only');

    // A text, typed in place.
    await heading.click();
    await page.keyboard.press('End');
    let saved = page.waitForResponse((response) => response.url().endsWith('/page.update-field') && response.ok());
    await page.keyboard.type(' bestanden');
    await page.keyboard.press('Tab');
    await saved;
    await expect(bar.locator('.badge[data-status]')).toHaveText('Status: Geändert');

    // A section below the text, with an image in its column.
    const textBlock = page.locator('[data-fb-name="frootbox/theme-bohnenglueck/Text"]');
    const picker = bar.getByRole('dialog', { name: 'Block einfügen' });
    await textBlock.hover();
    await bar.getByRole('toolbar', { name: 'Block Text' }).getByRole('button', { name: 'Block darunter einfügen' }).click();
    await picker.getByRole('button', { name: /^Abschnitt/ }).click();
    const section = page.locator('[data-fb-name="frootbox/theme-base/Section"]');
    await expect(section).toBeFocused();
    await section.locator('fb-area[data-fb-area="first"]').click();
    await picker.getByRole('button', { name: /^Bild/ }).click();
    const image = section.locator('[data-fb-type="image"]');
    await expect(image).toBeVisible();
    await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only');

    await image.click();
    const dialog = bar.getByRole('dialog', { name: 'Bild auswählen' });
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: 'Hochladen' }).click();
    await (await chooser).setFiles(await photo(page, `abnahme-${id}.jpg`));
    await expect(dialog.getByRole('button', { name: `abnahme-${id}.jpg` })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByLabel('Alternativtext für diese Stelle').fill('Gelbe Fläche');
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(image.locator('img')).toHaveAttribute('alt', 'Gelbe Fläche');

    // The footer is the same on every page.
    const footer = page.locator('[data-fb-site][data-fb-field="note"]');
    await footer.scrollIntoViewIfNeeded();
    await footer.click();
    await page.keyboard.press('ControlOrMeta+A');
    saved = page.waitForResponse((response) => response.url().endsWith('/site.update-field') && response.ok());
    await page.keyboard.type(`Abnahme ${id}`);
    await page.keyboard.press('Tab');
    await saved;

    // One button publishes the page and the footer.
    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(bar.getByRole('status')).toHaveText('Die Seite ist veröffentlicht.');
    await expect(bar.locator('.badge[data-status]')).toHaveText('Status: Veröffentlicht');

    // A guest sees all of it, without anything of the mode.
    const guest = await browser.newPage();
    await guest.goto(`/${slug}`);
    await expect(guest.getByRole('heading', { level: 1 })).toHaveText('Abnahme bestanden');
    const picture = guest.locator('.base-image picture img');
    await expect(picture).toHaveAttribute('alt', 'Gelbe Fläche');
    await picture.scrollIntoViewIfNeeded();
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await guest.goto('/');
    await expect(guest.locator('.site-footer')).toContainText(`Abnahme ${id}`);
    expect(await guest.locator('[data-fb-field], [data-fb-block], fb-editor-bar').count()).toBe(0);
    await guest.close();

    // Back to the footer as before, without the page.
    await page.context().clearCookies();
    await signIn(page, `/cms/pages/${pageId}`);
    expect((await action(page, 'site.update', { language: 'de', fields: { note } })).status).toBe(200);
    expect((await action(page, 'site.publish', {})).status).toBe(200);
    expect((await action(page, 'page.unpublish', { id: pageId })).status).toBe(200);
    expect((await action(page, 'page.delete', { id: pageId })).status).toBe(200);
});
