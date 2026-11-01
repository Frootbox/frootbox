/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Comments in the preview (decision 0156): a customer with a preview link
// comments on a block, the editor finds it in the editing mode at the same
// place, answers and marks it done, and the customer sees that. Guests
// without the link see nothing of it. The pages are unique, so retries
// find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test('a customer comments in the preview and the editor answers in the mode', async ({ page, browser, request }) => {
    const slug = `kommentar-${unique()}`;
    const quote = `Der beste Kaffee am Hafen ${slug}`;

    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        parentId: start,
        translations: { de: { title: 'Kommentare', slug, content: { fields: { title: 'Kommentare' }, areas: { main: [
            { block: 'frootbox/theme-bohnenglueck/Quote', fields: { quote, author: 'Frau Müller' } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);
    const link = await action(page, 'preview.create', { note: `Kommentare ${slug}`, pageId: id });
    expect(link.status).toBe(200);

    // The customer picks the quote, writes and sends.
    const customerContext = await browser.newContext();
    const customer = await customerContext.newPage();
    await customer.goto(link.body.data.path);
    await expect(customer).toHaveURL(`/${slug}`);
    const note = customer.locator('fb-preview-note');
    await note.getByRole('button', { name: 'Kommentieren' }).click();
    await expect(note.getByRole('status')).toContainText('Klicke auf die Stelle');
    await customer.getByText(quote).click();
    const compose = note.getByRole('region', { name: 'Neuer Kommentar' });
    await expect(compose).toContainText('Zu: Zitat');
    await compose.getByLabel('Dein Kommentar').fill('Bitte ohne „am Hafen“.');
    await compose.getByLabel('Dein Name').fill('Frau Müller');
    await compose.getByRole('button', { name: 'Senden' }).click();

    const list = note.getByRole('region', { name: 'Kommentare' });
    await expect(list.locator('[data-thread]')).toHaveCount(1);
    await expect(list).toContainText('Bitte ohne „am Hafen“.');
    await expect(list).toContainText('Offen');
    await expect(note.getByRole('button', { name: /^Kommentar 1:/ })).toBeVisible();

    // The editor sees it in the mode, with a pin at the quote.
    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);
    const bar = page.locator('fb-editor-bar');
    const quoteField = page.locator('[data-fb-name="frootbox/theme-bohnenglueck/Quote"] [data-fb-field="quote"]');
    const pin = bar.getByRole('button', { name: /^Kommentar 1: Bitte ohne/ });
    await expect(pin).toBeVisible();
    const [pinBox, fieldBox] = [await pin.boundingBox(), await quoteField.boundingBox()];
    expect(pinBox && fieldBox).toBeTruthy();
    expect(Math.abs(pinBox!.y + 10 - fieldBox!.y)).toBeLessThan(4);
    expect(Math.abs(pinBox!.x + 10 - (fieldBox!.x + fieldBox!.width))).toBeLessThan(4);

    await bar.getByRole('button', { name: 'Kommentare, 1 offen' }).click();
    const panel = bar.getByRole('region', { name: 'Kommentare' });
    const thread = panel.locator('[data-thread]');
    await expect(thread).toContainText('Frau Müller');
    const threadId = await thread.getAttribute('data-thread');
    await expect(thread).toContainText('Vorschaulink');
    await thread.getByLabel('Antworten').fill('Ist geändert.');
    await thread.getByRole('button', { name: 'Antwort senden' }).click();
    await expect(thread).toContainText('Ist geändert.');
    await thread.getByRole('button', { name: 'Erledigen' }).click();
    await expect(thread).toContainText('Erledigt von');
    await expect(bar.getByRole('button', { name: 'Kommentare', exact: true })).toBeVisible();

    // The customer sees the answer and the status.
    await customer.reload();
    await note.getByRole('button', { name: 'Kommentare' }).click();
    await expect(list).toContainText('Ist geändert.');
    await expect(list).toContainText('Erledigt');
    await customerContext.close();

    // Without the link: the published page as it is, and no comments.
    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    await visitor.goto(`/${slug}`);
    await expect(visitor.getByText(quote)).toBeVisible();
    await expect(visitor.locator('fb-preview-note')).toHaveCount(0);
    await expect(visitor.locator('[data-fb-field], [data-fb-block]')).toHaveCount(0);
    await visitorContext.close();
    const denied = await request.get('/cms/preview/queries/comment.list', { headers: { 'X-Frootbox-Preview': '1' } });
    expect(denied.status()).toBe(403);

    // The screen lists it among the done ones; clean up.
    await page.goto('/cms/comments?status=done');
    await expect(page.locator('article.fb-card', { hasText: slug })).toContainText('Ist geändert.');
    expect((await action(page, 'comment.delete', { id: threadId })).status).toBe(200);
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
