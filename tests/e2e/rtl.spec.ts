/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Right to left (decisions 0133, 0158, 0159). The installation of the
// tests speaks Arabic without content of its own, so its pages show the
// German content as fallback. The page is unique, so retries find no
// leftovers; its address keeps the Arabic letters.

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test('runs Arabic from right to left and German fallback from left to right', async ({ page }) => {
    await page.goto('/ar');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('link', { name: 'انتقل إلى المحتوى' })).toBeAttached();

    // The navigation runs from right to left: its first point stands right of the second.
    const items = page.getByRole('navigation', { name: 'القائمة الرئيسية' }).getByRole('link');
    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    expect(first!.x).toBeGreaterThan(second!.x);

    // The German content keeps its language and direction, and the fonts of its script.
    const fallback = page.locator('main [lang="de"]').first();
    await expect(fallback).toHaveAttribute('dir', 'ltr');
    expect(await html.evaluate((element) => getComputedStyle(element).fontFamily)).toContain('Noto Naskh Arabic');
    expect(await fallback.evaluate((element) => getComputedStyle(element).fontFamily)).not.toContain('Noto Naskh Arabic');
    expect(await fallback.evaluate((element) => getComputedStyle(element).direction)).toBe('ltr');
});

test('gives an Arabic page an Arabic address and shows it in the right direction', async ({ page, browser }) => {
    const slug = `من-نحن-${unique()}`;

    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const text = (body: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] });
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        parentId: start,
        translations: {
            de: { title: 'Über uns', slug: `ueber-uns-${unique()}`, content: { fields: { title: 'Über uns' } } },
            ar: { title: 'من نحن', slug, content: {
                fields: { title: 'من نحن' },
                areas: { main: [{ block: 'frootbox/theme-bohnenglueck/Text', fields: { body: text('نحمص القهوة ببطء.') } }] },
            } },
        },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    // Visitors reach it under its Arabic address, percent-encoded on the wire.
    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    const response = await visitor.goto(`/ar/${slug}`);
    expect(response!.status()).toBe(200);
    expect(response!.url()).toContain(`/ar/${encodeURIComponent(slug)}`);
    await expect(visitor.locator('h1')).toHaveText('من نحن');
    await expect(visitor.locator('html')).toHaveAttribute('dir', 'rtl');
    await visitorContext.close();

    // The backend shows the title in its direction and the address readable.
    await page.goto(`/cms/pages/${id}?language=ar`);
    await expect(page.locator('#page-title')).toHaveValue('من نحن');
    await expect(page.locator('#page-title')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#page-title')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('#page-slug')).toHaveValue(slug);
    await expect(page.locator('#page-slug')).toHaveAttribute('dir', 'ltr');

    // In the mode the bar keeps the direction of the backend, and the buttons stand at the block.
    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await page.goto(`/ar/${slug}`);
    await expect(page.locator('h1[data-fb-field="title"]')).toHaveAttribute('contenteditable', 'plaintext-only');
    const bar = page.locator('fb-editor-bar');
    await expect(bar).toHaveAttribute('dir', 'ltr');
    await expect(bar).toHaveAttribute('lang', 'de');
    await expect(bar.getByRole('button', { name: 'Mehr' })).toBeVisible();

    const block = page.locator('[data-fb-name="frootbox/theme-bohnenglueck/Text"]');
    await block.hover();
    const tools = bar.getByRole('toolbar', { name: 'Block Text' });
    await expect(tools).toBeVisible();
    const blockBox = (await block.boundingBox())!;
    const toolsBox = (await tools.boundingBox())!;
    // At the end of the block in the direction of the backend, its right edge.
    expect(Math.abs(toolsBox.x + toolsBox.width - (blockBox.x + blockBox.width))).toBeLessThan(2);

    // The tab of a field stands at its start in its direction, the right edge for Arabic.
    const title = page.locator('h1[data-fb-field="title"]');
    await title.hover();
    const tab = bar.locator('.outline[data-kind="field"] .label').first();
    await expect(tab).toBeVisible();
    const titleBox = (await title.boundingBox())!;
    const tabBox = (await tab.boundingBox())!;
    expect(Math.abs(tabBox.x + tabBox.width - (titleBox.x + titleBox.width))).toBeLessThan(4);

    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
