/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Headings get their level from where they stand (decision 0129): a hero
// further down is an h2, headings in rich text keep their rank and get
// the level below the block, the toolbar offers ranks instead of levels,
// and the panel "Gliederung" lists them and goes to them. The page is
// unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test('gives headings the level of their place and shows the outline', async ({ page, browser }) => {
    const slug = `gliederung-${unique()}`;

    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        parentId: start,
        translations: { de: { title: 'Gliederung', slug, content: {
            fields: { title: 'Unsere Rösterei' },
            areas: { main: [
                { block: 'frootbox/theme-bohnenglueck/Hero', fields: { title: 'Ein Hero weiter unten' } },
                { block: 'frootbox/theme-bohnenglueck/Text', fields: { title: 'Wie wir rösten', body: { type: 'doc', content: [
                    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Langsam' }] },
                    { type: 'paragraph', content: [{ type: 'text', text: 'Jede Sorte hat ihr Profil.' }] },
                ] } } },
            ] },
        } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    // Visitors: one h1, the hero as h2, rich text below the heading of its block.
    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    await visitor.goto(`/${slug}`);
    await expect(visitor.locator('main :is(h1, h2, h3, h4, h5, h6)')).toHaveText(['Unsere Rösterei', 'Ein Hero weiter unten', 'Wie wir rösten', 'Langsam']);
    await expect(visitor.locator('h1')).toHaveCount(1);
    await expect(visitor.locator('h2.hero__title')).toHaveText('Ein Hero weiter unten');
    await expect(visitor.locator('h3[data-rank="1"]')).toHaveText('Langsam');
    await visitorContext.close();

    // The editor in the mode.
    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);
    await expect(page.locator('h1[data-fb-field="title"]')).toHaveAttribute('contenteditable', 'plaintext-only');
    const bar = page.locator('fb-editor-bar');

    // The toolbar offers ranks; the editor shows the level the page gives,
    // without skipping one: a small heading after "Langsam" is an h4.
    const body = page.locator('[data-fb-field="body"]');
    await body.getByText('Jede Sorte hat ihr Profil.').click();
    const toolbar = bar.getByRole('toolbar', { name: 'Formatierung' });
    const style = toolbar.getByRole('combobox', { name: 'Textart' });
    await expect(style).toHaveValue('0');
    const saved = page.waitForResponse((response) => response.url().endsWith('/page.update-field') && response.ok());
    await style.selectOption({ label: 'Unterüberschrift' });
    await expect(body.locator('h4[data-rank="2"]')).toHaveText('Jede Sorte hat ihr Profil.');
    await page.keyboard.press('ControlOrMeta+Alt+0');
    await expect(body.locator('p')).toHaveText('Jede Sorte hat ihr Profil.');
    await page.keyboard.press('ControlOrMeta+Alt+3');
    await expect(body.locator('h4[data-rank="3"]')).toHaveText('Jede Sorte hat ihr Profil.');
    await expect(style).toHaveValue('3');
    // Without "Langsam" before it, it keeps the level after the block title.
    await page.keyboard.press('ArrowUp');
    await expect(style).toHaveValue('1');
    await page.keyboard.press('ControlOrMeta+Alt+0');
    await expect(body.locator('p')).toHaveText('Langsam');
    await expect(body.locator('h3[data-rank="3"]')).toHaveText('Jede Sorte hat ihr Profil.');
    await page.keyboard.press('ControlOrMeta+Alt+1');
    await expect(body.locator('h3[data-rank="1"]')).toHaveText('Langsam');
    await expect(body.locator('h4[data-rank="3"]')).toHaveText('Jede Sorte hat ihr Profil.');
    await page.locator('h1[data-fb-field="title"]').click();
    await saved;

    // The page gives the same levels.
    await page.reload();
    await expect(page.locator('h1[data-fb-field="title"]')).toHaveAttribute('contenteditable', 'plaintext-only');
    await expect(body.locator('h4[data-rank="3"]')).toHaveText('Jede Sorte hat ihr Profil.');

    // The panel "Gliederung" from the menu "More", section "This page".
    await bar.getByRole('button', { name: 'Mehr' }).click();
    await bar.getByRole('menu', { name: 'Mehr' }).getByRole('group', { name: 'Diese Seite' }).getByRole('menuitem', { name: 'Gliederung' }).click();
    const panel = bar.getByRole('region', { name: 'Gliederung' });
    const items = panel.locator('.outline-list button');
    await expect(items).toHaveText([/H1\s*Unsere Rösterei/, /H2\s*Ein Hero weiter unten/, /H2\s*Wie wir rösten/, /H3\s*Langsam/, /H4\s*Jede Sorte hat ihr Profil\./]);
    await expect(panel.locator('.outline-list li').last()).toContainText('Die Ebene ist angepasst');

    // A click goes to the heading.
    await page.evaluate(() => scrollTo(0, 0));
    await items.filter({ hasText: 'Langsam' }).click();
    await expect(body.locator('h3', { hasText: 'Langsam' })).toBeInViewport();
    await expect(body).toBeFocused();

    // "Show all places" names the level of each heading.
    await page.keyboard.press('Escape');
    await bar.getByRole('button', { name: 'Mehr' }).click();
    await bar.getByRole('menuitemcheckbox', { name: 'Alle Stellen zeigen' }).click();
    await expect(bar.locator('.level-badge')).toHaveText(['H1', 'H2', 'H2', 'H3', 'H4']);

    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
