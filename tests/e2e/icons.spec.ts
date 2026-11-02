/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';
import { LIBRARY } from './library';

// The field type "icon" with the symbols of the base theme (decision 0179)
// and own SVG graphics (decision 0182), chosen in the editing mode and in
// the settings of the block.

test.use({ baseURL: LIBRARY });

test('chooses a symbol of the theme on the website and in the settings', async ({ page }) => {
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const slug = `symbole-${Date.now()}`;
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Symbole', slug, content: { fields: { title: 'Symbole' }, areas: { main: [
            { block: 'frootbox/theme-base/Features', fields: { items: [{ icon: 'truck', title: 'Versand' }, { title: 'Ohne Symbol' }] } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;

    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);

    const field = page.locator('[data-fb-type="icon"]').first();
    await expect(field.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await field.click();
    const bar = page.locator('fb-editor-bar');
    const dialog = bar.getByRole('dialog', { name: 'Symbol auswählen' });
    await expect(dialog.getByRole('button', { name: 'Lieferwagen' })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByLabel('Suchen').fill('her');
    await expect(dialog.getByRole('button', { name: 'Lieferwagen' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Herz' }).click();
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(field).toHaveAttribute('data-fb-value', '"heart"');
    await expect(field.locator('svg path')).toHaveCount(1);
    await expect(field).toBeFocused();

    // The settings of the block open the same dialog.
    const block = page.locator('[data-fb-name="frootbox/theme-base/Features"]');
    await block.focus();
    await bar.getByRole('toolbar', { name: 'Block Vorteile' }).getByRole('button', { name: 'Einstellungen des Blocks' }).click();
    const panel = bar.getByRole('region', { name: 'Einstellungen: Vorteile' });
    await panel.getByRole('button', { name: 'Ohne Symbol', exact: true }).click();
    await panel.getByRole('button', { name: 'Kein Symbol' }).click();
    await expect(dialog.getByRole('list', { name: 'Symbole' }).getByRole('button')).toHaveCount(16);
    await dialog.getByRole('button', { name: 'Stern' }).dblclick();
    await expect(page.locator('[data-fb-type="icon"]').nth(1)).toHaveAttribute('data-fb-value', '"star"');
    // The panel loads again with the entries closed; the button shows the choice.
    await panel.getByRole('button', { name: 'Ohne Symbol', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Stern' }).locator('svg')).toHaveAttribute('aria-hidden', 'true');

    // An own SVG goes into the media library and shows in the color of the text.
    await panel.getByRole('button', { name: 'Stern' }).click();
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: 'SVG hochladen' }).click();
    const radius = 2 + (Date.now() % 9);
    await (await chooser).setFiles({
        name: `bohne-${radius}.svg`,
        mimeType: 'image/svg+xml',
        buffer: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)"><circle cx="12" cy="12" r="${radius}"/></svg>`),
    });
    await expect(dialog.getByLabel('Satz')).toHaveValue('media');
    await expect(dialog.getByRole('button', { name: `bohne-${radius}` })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    const own = page.locator('[data-fb-type="icon"]').nth(1);
    await expect(own).toHaveAttribute('data-fb-value', /^"media:[0-9A-Z]{26}"$/);
    await expect(own.locator('svg circle')).toHaveAttribute('r', String(radius));
    await expect(own.locator('svg')).toHaveAttribute('fill', 'currentColor');
    await expect(own.locator('svg')).not.toHaveAttribute('onload', /./);

    // Clean up.
    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
