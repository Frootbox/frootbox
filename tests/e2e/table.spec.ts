/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';
import { LIBRARY } from './library';

// The field type "table" (decision 0187): edited right on the website,
// with rows, columns and heads from the toolbar and cells pasted from a
// spreadsheet.

test.use({ baseURL: LIBRARY });

test('edits a table on the website and takes cells from a spreadsheet', async ({ page }) => {
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const slug = `tabelle-${Date.now()}`;
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Tabelle', slug, content: { fields: { title: 'Tabelle' }, areas: { main: [
            { block: 'frootbox/theme-base/Table', fields: { title: 'Öffnungszeiten', table: { rows: [['Tag', 'Zeit'], ['Montag', '8–18 Uhr']] } } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;

    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);

    const field = page.locator('[data-fb-type="table"]');
    const bar = page.locator('fb-editor-bar');
    const value = async () => JSON.parse((await field.getAttribute('data-fb-value')) ?? 'null');

    // Typing in a cell, Tab to the next one; at the end Tab adds a row.
    await field.getByRole('cell', { name: 'Montag' }).click();
    await expect(field).toHaveClass(/ProseMirror-focused/);
    await page.keyboard.press('End');
    await page.keyboard.type(' bis Freitag');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Samstag');
    await expect(field.locator('tr')).toHaveCount(3);

    // Rows and columns from the toolbar, next to the cell of the cursor.
    const toolbar = bar.getByRole('toolbar', { name: 'Formatierung' });
    await toolbar.getByRole('combobox', { name: 'Zeilen und Spalten' }).selectOption({ label: 'Spalte danach einfügen' });
    await expect(field.locator('tr').first().locator('th')).toHaveCount(3);
    await toolbar.getByRole('button', { name: 'Kopfspalte' }).click();
    await expect(toolbar.getByRole('button', { name: 'Kopfspalte' })).toHaveAttribute('aria-pressed', 'true');

    await expect.poll(value).toEqual({
        rows: [['Tag', '', 'Zeit'], ['Montag bis Freitag', '', '8–18 Uhr'], ['Samstag', '', '']],
        headerRow: true,
        headerColumn: true,
    });

    // Cells copied from a spreadsheet fill the table from the cursor on.
    await field.locator('th', { hasText: 'Samstag' }).click();
    await page.evaluate(() => {
        const data = new DataTransfer();
        data.setData('text/plain', 'Samstag\t9–14 Uhr\tCafé\nSonntag\tgeschlossen\t10–16 Uhr\n');
        document.querySelector('[data-fb-type="table"]')?.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await expect.poll(value).toEqual({
        rows: [['Tag', '', 'Zeit'], ['Montag bis Freitag', '', '8–18 Uhr'], ['Samstag', '9–14 Uhr', 'Café'], ['Sonntag', 'geschlossen', '10–16 Uhr']],
        headerRow: true,
        headerColumn: true,
    });

    // Excel puts a table as HTML on the clipboard.
    // After a paste the pasted cells are selected; a click makes it the cursor again.
    await field.locator('th', { hasText: 'Sonntag' }).click();
    await page.evaluate(() => {
        const data = new DataTransfer();
        data.setData('text/html', '<html><body><table border=0><col width=80><tr height=20><td height=20 class=xl65>Feiertag</td><td class=xl65><b>zu</b></td></tr></table></body></html>');
        data.setData('text/plain', 'Feiertag\tzu\n');
        document.querySelector('[data-fb-type="table"]')?.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await expect.poll(async () => (await value()).rows[3]).toEqual(['Feiertag', [{ type: 'text', text: 'zu', marks: [{ type: 'bold' }] }], '10–16 Uhr']);

    // Visitors get the table with heads of columns and rows.
    await page.reload();
    await expect(page.locator('.base-table thead th')).toHaveText(['Tag', '', 'Zeit']);
    await expect(page.locator('.base-table tbody th')).toHaveText(['Montag bis Freitag', 'Samstag', 'Feiertag']);

    // Clean up.
    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
