/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Further fields of objects edited on the website (decisions 0240, 0241):
// the test design of the agency declares a subtitle and a plan at news
// articles and shows them on its journal. Typed on the page of an
// article they go into its draft; undo takes them back, the editor bar
// publishes the article. Each run makes an article of its own, so
// retries find no leftovers.

const AGENCY = process.env.PLAYWRIGHT_AGENCY_URL ?? 'http://127.0.0.1:8102';

test.use({ baseURL: AGENCY });

test('edits a further field of an article on its page', async ({ page, request }) => {
    const number = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const title = `Baustelle ${number}`;
    // The slug comes from the title.
    const address = `/journal/baustelle-${number}`;
    await signIn(page, '/cms/pages');
    const created = await action(page, 'frootbox/news/article.create', {
        date: new Date().toISOString(),
        translations: { de: { title, text: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Die Bodenplatte ist gegossen.' }] }] } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'frootbox/news/article.publish', { ids: [id] })).status).toBe(200);

    // Into the mode through the start page, then on to the article. By its
    // path, other tests may move pages before it.
    await page.locator('#page-tree .fb-tree__item[data-path="/"] a').first().click();
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL('/');
    await page.goto(address);

    const bar = page.locator('fb-editor-bar');
    const subtitle = page.locator(`.agency-article__subtitle[data-fb-object="frootbox/news/article:${id}"]`);
    await expect(subtitle).toHaveAttribute('contenteditable', 'plaintext-only');
    // Empty fields stay for editors to fill, guests do not get their element.
    await expect(page.locator('.agency-article__plan[data-fb-field="plan"]')).toBeAttached();
    const guest = await (await request.get(address)).text();
    expect(guest).not.toContain('agency-article__subtitle');
    expect(guest).not.toContain('agency-article__plan');

    const saved = () => page.waitForResponse((response) => response.url().endsWith('/object.update-field') && response.ok());
    let save = saved();
    await subtitle.click();
    await page.keyboard.type('Erster Versuch');
    await page.keyboard.press('Tab');
    await save;
    await expect(bar.locator('.state .visually-hidden')).toHaveText('Status: Änderungen offen');

    // Undo takes it back, a new text goes in.
    await bar.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(subtitle).toHaveText('');
    save = saved();
    await subtitle.click();
    await page.keyboard.type('Holzbau am Kanal');
    await page.keyboard.press('Tab');
    await save;

    // The draft comes back after loading again; guests still see nothing.
    await page.reload();
    await expect(subtitle).toHaveText('Holzbau am Kanal');
    expect(await (await request.get(address)).text()).not.toContain('Holzbau am Kanal');

    // The bar publishes the article; the page was published before, so it names the changes.
    const published = page.waitForResponse((response) => response.url().endsWith('/frootbox/news/article.publish') && response.ok());
    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await published;
    await expect(bar.getByRole('status')).toHaveText('Die Änderungen sind veröffentlicht.');
    const html = await (await request.get(address)).text();
    expect(html).toContain('<p class="agency-article__subtitle">Holzbau am Kanal</p>');
    expect(html).not.toContain('data-fb-');
    expect(await (await request.get('/journal')).text()).toContain('Holzbau am Kanal');

    await page.goto('/cms/pages');
    expect((await action(page, 'frootbox/news/article.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'frootbox/news/article.delete', { id })).status).toBe(200);
});
