/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';
import { LIBRARY } from './library';

// The dialog to insert a block groups many blocks (decision 0148). The
// number beside each group is plain muted text; the badge of the comments
// in the editor bar must not leak into it.

test.use({ baseURL: LIBRARY });

test('shows the blocks by group with their number as plain text', async ({ page }) => {
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const slug = `gruppen-${Date.now()}`;
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Gruppen', slug, content: { fields: { title: 'Gruppen' }, areas: { main: [
            { block: 'frootbox/theme-base/Table', fields: { title: 'Öffnungszeiten', table: { rows: [['Tag', 'Zeit'], ['Montag', '8–18 Uhr']] } } },
        ] } } } },
    });
    expect(created.status).toBe(200);

    await page.goto(`/cms/pages/${created.body.data.id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);

    await page.locator('[data-fb-block]').first().hover();
    await page.getByRole('button', { name: 'Block darunter einfügen' }).first().click();

    const groups = page.locator('fb-editor-bar').getByRole('list', { name: 'Gruppen' });
    await expect(groups.getByRole('button', { name: /Texte/ })).toBeVisible();
    const count = groups.locator('.count').first();
    await expect(count).toHaveText(/^\d+$/);
    await expect(count).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});
