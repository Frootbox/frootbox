/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// The history of a page and of a block (decision 0174): who changed what,
// with the old and the new text, in the backend and at the block.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function text(body: string) {
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] };
}

test('shows who changed a block, in the edit mode and in the backend', async ({ page }) => {
    const slug = `verlauf-${unique()}`;
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Verlauf', slug, content: { fields: { title: 'Verlauf' }, areas: { main: [
            { block: 'frootbox/theme-base/TextWithHeading', fields: { title: 'Rösten', body: text('Wir rösten langsam.') } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    const block: string = await page.evaluate(async (id) => {
        const response = await fetch(`/cms/queries/page.show?id=${id}`, { headers: { Accept: 'application/json' } });

        return (await response.json()).data.published.translations.de.content.areas.main[0].id;
    }, id);
    expect((await action(page, 'page.update-field', { id, language: 'de', block, path: 'title', value: 'Langsam rösten', previous: 'Rösten' })).status).toBe(200);

    // At the block in the edit mode.
    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);
    await expect(page.locator('h1[data-fb-field="title"]')).toHaveAttribute('contenteditable', 'plaintext-only');
    const bar = page.locator('fb-editor-bar');
    const textBlock = page.locator('[data-fb-name="frootbox/theme-base/TextWithHeading"]');
    await textBlock.focus();
    await bar.getByRole('button', { name: 'Verlauf des Blocks' }).click();
    const panel = bar.getByRole('region', { name: /^Verlauf:/ });
    await expect(panel.getByText('Text geändert')).toBeVisible();
    await expect(panel.locator('.old')).toContainText('Rösten');
    await expect(panel.locator('.new')).toContainText('Langsam rösten');
    await expect(panel.getByRole('link', { name: 'Ganzer Verlauf im Backend' })).toHaveAttribute('href', `/cms/pages/${id}/history?block=${block}`);

    // On the page in the backend.
    await page.goto(`/cms/pages/${id}`);
    await expect(page.locator('#page-history-title')).toHaveText('Verlauf');
    await page.getByRole('link', { name: 'Ganzer Verlauf' }).click();
    await expect(page.getByRole('heading', { name: 'Verlauf von Verlauf' })).toBeVisible();
    await expect(page.locator('.fb-change__new').first()).toContainText('Langsam rösten');

    // Clean up.
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
