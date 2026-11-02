/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';
import { LIBRARY } from './library';

// The field type "file" with documents of the media library (decision 0179),
// uploaded and chosen in the editing mode, named in the settings of the block.

test.use({ baseURL: LIBRARY });

test('uploads a document on the website and links it with format and size', async ({ page }) => {
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const slug = `dateien-${Date.now()}`;
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Dateien', slug, content: { fields: { title: 'Dateien' }, areas: { main: [
            { block: 'frootbox/theme-base/Downloads', fields: { items: [{ text: 'Alle Preise' }] } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;

    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);

    const field = page.locator('[data-fb-type="file"]').first();
    await field.click();
    const bar = page.locator('fb-editor-bar');
    const dialog = bar.getByRole('dialog', { name: 'Dokument auswählen' });
    await expect(dialog).toBeVisible();

    // A new document from the computer, chosen once it is in the library.
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: 'Hochladen' }).click();
    const name = `preise-${Date.now()}.pdf`;
    await (await chooser).setFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(`%PDF-1.4\n% ${name}\n%%EOF\n`) });
    const tile = dialog.getByRole('button', { name });
    await expect(tile).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByLabel('Linktext').fill('Preisliste');
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(dialog).toHaveCount(0);

    const link = field.locator('a[type="application/pdf"]');
    await expect(link).toHaveText('Preisliste PDF, 1 KB');
    await expect(link).toHaveAttribute('href', /^\/media\/[0-9A-Z]{26}\/1\/preise-\d+-main-[0-9a-f]{16}\.pdf$/);
    expect(JSON.parse((await field.getAttribute('data-fb-value')) ?? '{}')).toMatchObject({ text: 'Preisliste' });
    const media: string = JSON.parse((await field.getAttribute('data-fb-value')) ?? '{}').media;

    // The settings of the block name the file by its link text.
    const block = page.locator('[data-fb-name="frootbox/theme-base/Downloads"]');
    await block.focus();
    await bar.getByRole('toolbar', { name: 'Block Downloads' }).getByRole('button', { name: 'Einstellungen des Blocks' }).click();
    const panel = bar.getByRole('region', { name: 'Einstellungen: Downloads' });
    await panel.getByRole('button', { name: 'Alle Preise', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Preisliste' })).toBeVisible();

    // Clean up.
    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
    expect((await action(page, 'media.delete', { id: media })).status).toBe(200);
});
