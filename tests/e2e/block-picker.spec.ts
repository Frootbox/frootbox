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

    // The library has only the base theme, so nothing is made for this
    // website; "Show all" lists every block (decision 0202).
    await expect(groups.getByRole('button', { name: /Für diese Website/ })).toHaveCount(0);
    await expect(groups.getByRole('button', { name: /Kopfbereiche/ })).toHaveAttribute('aria-pressed', 'true');
    const all = groups.getByRole('button', { name: /Alle anzeigen/ });
    await all.click();
    await expect(all).toHaveAttribute('aria-pressed', 'true');
    const cards = page.locator('fb-editor-bar').getByRole('list', { name: 'Alle anzeigen' }).getByRole('listitem');
    await expect(cards).toHaveCount(Number(await all.locator('.count').textContent()));
    const sum = (await groups.locator('li:not(.lead) .count').allTextContents()).reduce((total, number) => total + Number(number), 0);
    await expect(cards).toHaveCount(sum);
});
