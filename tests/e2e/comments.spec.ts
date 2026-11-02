/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Comments in the preview (decision 0156): a customer with a preview link
// comments on a block, the editor finds it in the editing mode at the same
// place, answers and marks it done, and the customer sees that. Guests
// without the link see nothing of it. The pages are unique, so retries
// find no leftovers. An agency comments on the design page with a link
// from the screen "Design" (decision 0210).

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test('a customer comments in the preview and the editor answers in the mode', async ({ page, browser, request }) => {
    const slug = `kommentar-${unique()}`;
    const quote = `Der beste Kaffee am Hafen ${slug}`;

    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Kommentare', slug, content: { fields: { title: 'Kommentare' }, areas: { main: [
            { block: 'frootbox/theme-base/Quote', fields: { quote, author: 'Frau Müller' } },
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
    const quoteField = page.locator('[data-fb-name="frootbox/theme-base/Quote"] [data-fb-field="quote"]');
    const pin = bar.getByRole('button', { name: /^Kommentar 1: Bitte ohne/ });
    await expect(pin).toBeVisible();
    // The customer clicked the middle of the quote; the pin points there (decision 0211).
    const [pinBox, fieldBox] = [await pin.boundingBox(), await quoteField.boundingBox()];
    expect(pinBox && fieldBox).toBeTruthy();
    expect(Math.abs(pinBox!.y + pinBox!.height - (fieldBox!.y + fieldBox!.height / 2))).toBeLessThan(4);
    expect(Math.abs(pinBox!.x - (fieldBox!.x + fieldBox!.width / 2))).toBeLessThan(4);

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

test('an agency comments on the design page with a link from the screen Design', async ({ page, browser }) => {
    const note = `Agentur ${unique()}`;
    const remark = `Das Blau ist zu hell, ${note}.`;

    // The link opens the design page and is listed for copying.
    await signIn(page, '/cms/theme');
    await page.getByRole('button', { name: 'Link für die Agentur' }).click();
    const dialog = page.getByRole('dialog', { name: 'Link für die Agentur' });
    await dialog.getByLabel('Notiz').fill(note);
    await dialog.getByRole('button', { name: 'Link anlegen' }).click();
    const card = page.getByRole('region', { name: 'Abnahme durch die Agentur' });
    const copy = card.getByRole('button', { name: `Link ${note} kopieren` });
    await expect(copy).toBeVisible();
    const link = new URL((await copy.getAttribute('data-fb-copy'))!);
    expect(link.pathname).toBe('/_design');

    // The agency picks the tokens, writes and sends.
    const agencyContext = await browser.newContext();
    const agency = await agencyContext.newPage();
    await agency.goto(link.pathname + link.search);
    await expect(agency).toHaveURL('/_design');
    const preview = agency.locator('fb-preview-note');
    await preview.getByRole('button', { name: 'Kommentieren' }).click();
    await agency.getByRole('heading', { name: 'Tokens', exact: true }).click();
    const compose = preview.getByRole('region', { name: 'Neuer Kommentar' });
    await expect(compose).toContainText('Zu: Tokens');
    await compose.getByLabel('Dein Kommentar').fill(remark);
    await compose.getByLabel('Dein Name').fill('Agentur Pixel');
    await compose.getByRole('button', { name: 'Senden' }).click();
    const list = preview.getByRole('region', { name: 'Kommentare' });
    await expect(list.getByRole('heading', { name: 'Auf dieser Seite' })).toBeVisible();
    await expect(list.locator('[data-thread]', { hasText: remark }).getByRole('button', { name: 'Zeigen' })).toBeVisible();
    await expect(preview.getByRole('button', { name: /^Kommentar 1: Das Blau/ })).toBeVisible();
    await agencyContext.close();

    // The editor finds it in the bar on the design page.
    await page.goto('/_design');
    const bar = page.locator('fb-editor-bar');
    await bar.getByRole('button', { name: /^Kommentare, \d+ offen$/ }).click();
    const thread = bar.getByRole('region', { name: 'Kommentare' }).locator('[data-thread]', { hasText: remark });
    await expect(thread).toContainText('Agentur Pixel');
    await expect(thread.getByRole('button', { name: 'Zeigen' })).toBeVisible();
    const threadId = await thread.getAttribute('data-thread');

    // Clean up from the backend: the thread and the link.
    await page.goto('/cms');
    expect((await action(page, 'comment.delete', { id: threadId })).status).toBe(200);
    const links = await page.evaluate(async () => (await (await fetch('/cms/queries/preview.list', { headers: { Accept: 'application/json' } })).json()).data);
    const created = links.find((entry: { note: string }) => entry.note === note);
    expect((await action(page, 'preview.revoke', { id: created.id })).status).toBe(200);
});

test('a customer comments at a point of a block and on the footer navigation', async ({ page, browser }) => {
    const slug = `punkt-${unique()}`;
    const quote = `Frisch vom Hafen ${slug}`;

    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Punkte', slug, content: { fields: { title: 'Punkte' }, areas: { main: [
            { block: 'frootbox/theme-base/Quote', fields: { quote, author: 'Frau Müller' } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);
    const link = await action(page, 'preview.create', { note: `Punkte ${slug}`, pageId: id });

    const customerContext = await browser.newContext();
    const customer = await customerContext.newPage();
    await customer.goto(link.body.data.path);
    const note = customer.locator('fb-preview-note');
    const compose = note.getByRole('region', { name: 'Neuer Kommentar' });

    /** Picks a place, writes and sends; the point clicked, from the top left of the viewport. */
    const comment = async (target: import('@playwright/test').Locator, position: { x: number; y: number }, text: string, about: string) => {
        await note.getByRole('button', { name: 'Kommentieren' }).click();
        await target.click({ position });
        await expect(compose).toContainText(`Zu: ${about}`);
        // A pin shows ahead where the comment goes.
        await expect(note.locator('.pin.draft')).toBeVisible();
        await compose.getByLabel('Dein Kommentar').fill(text);
        const name = compose.getByLabel('Dein Name');
        if (await name.count()) {
            await name.fill('Frau Müller');
        }
        await compose.getByRole('button', { name: 'Senden' }).click();
        await expect(note.locator('.pin.draft')).toHaveCount(0);
        const box = (await target.boundingBox())!;

        return { x: box.x + position.x, y: box.y + position.y };
    };

    /** The lower start corner of a pin, where it points. */
    const tip = async (pin: import('@playwright/test').Locator) => {
        const box = (await pin.boundingBox())!;

        return { x: box.x, y: box.y + box.height };
    };

    // A point in the quote: the pin points there, not at the corner.
    const quoteText = customer.getByText(quote, { exact: true });
    const quoteBox = (await quoteText.boundingBox())!;
    const atQuote = await comment(quoteText, { x: Math.round(quoteBox.width / 4), y: Math.round(quoteBox.height / 2) }, 'Etwas größer, bitte.', 'Zitat');
    const quotePin = note.getByRole('button', { name: /^Kommentar \d+: Etwas größer/ });
    await expect(quotePin).toBeVisible();
    let at = await tip(quotePin);
    expect(Math.abs(at.x - atQuote.x)).toBeLessThan(3);
    expect(Math.abs(at.y - atQuote.y)).toBeLessThan(3);

    // No block in the footer: its navigation is the place, with the link as the excerpt.
    const footerLink = customer.getByRole('navigation', { name: 'Fußnavigation' }).getByRole('link').first();
    const linkText = (await footerLink.innerText()).trim();
    const atFooter = await comment(footerLink, { x: 4, y: 4 }, 'Hier fehlt die Adresse.', 'Navigation: Fußnavigation');
    const footerThread = note.getByRole('region', { name: 'Kommentare' }).locator('[data-thread]', { hasText: 'Hier fehlt die Adresse.' });
    // The list names the landmark, then the excerpt.
    await expect(footerThread).toContainText(`Navigation: Fußnavigation · „${linkText}“`);
    const footerPin = note.getByRole('button', { name: /^Kommentar \d+: Hier fehlt/ });
    at = await tip(footerPin);
    expect(Math.abs(at.x - atFooter.x)).toBeLessThan(3);
    expect(Math.abs(at.y - atFooter.y)).toBeLessThan(3);
    await customerContext.close();

    // The editor finds both pins at the same places in the editing mode.
    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);
    const bar = page.locator('fb-editor-bar');
    const quoteField = page.locator('[data-fb-name="frootbox/theme-base/Quote"] [data-fb-field="quote"]');
    const editorQuotePin = bar.getByRole('button', { name: /^Kommentar \d+: Etwas größer/ });
    await expect(editorQuotePin).toBeVisible();
    const fieldBox = (await quoteField.boundingBox())!;
    at = await tip(editorQuotePin);
    expect(at.x).toBeGreaterThan(fieldBox.x);
    expect(at.y).toBeGreaterThan(fieldBox.y);
    expect(at.y).toBeLessThan(fieldBox.y + fieldBox.height);

    const editorLink = page.getByRole('navigation', { name: 'Fußnavigation' }).getByRole('link').first();
    await editorLink.scrollIntoViewIfNeeded();
    const editorFooterPin = bar.getByRole('button', { name: /^Kommentar \d+: Hier fehlt/ });
    await expect(editorFooterPin).toBeVisible();
    const linkBox = (await editorLink.boundingBox())!;
    at = await tip(editorFooterPin);
    expect(Math.abs(at.x - (linkBox.x + 4))).toBeLessThan(3);
    expect(Math.abs(at.y - (linkBox.y + 4))).toBeLessThan(3);
    await bar.getByRole('button', { name: /^Kommentare, \d+ offen/ }).click();
    await expect(bar.getByRole('region', { name: 'Kommentare' }).locator('[data-thread]', { hasText: 'Hier fehlt die Adresse.' })).toContainText('Navigation: Fußnavigation · „');

    // Clean up.
    await page.goto('/cms');
    const threads = await page.evaluate(async (id) => (await (await fetch(`/cms/queries/comment.list?pageId=${id}`, { headers: { Accept: 'application/json' } })).json()).data, id);
    expect(threads).toHaveLength(2);
    for (const thread of threads) {
        expect((await action(page, 'comment.delete', { id: thread.id })).status).toBe(200);
    }
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
