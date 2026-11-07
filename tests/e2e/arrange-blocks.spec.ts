/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// Blocks arranged on the website (decision 0123): buttons at the block, the
// dialog to pick a block, the side panel with variant, options and list
// entries. Each change loads the page again with the focus on the block.
// The page is unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/** Creates and publishes a page with these blocks in "main" and opens it in the mode. */
async function openPage(page: Page, slug: string, main: object[]): Promise<string> {
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Anordnen', slug, content: { fields: { title: 'Anordnen' }, areas: { main } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);
    await ready(page);

    return id;
}

/** The script of the mode is loaded once the fields are editable. */
async function ready(page: Page): Promise<void> {
    await expect(page.locator('h1[data-fb-field="title"]')).toHaveAttribute('contenteditable', 'plaintext-only');
}

async function removePage(page: Page, id: string): Promise<void> {
    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
}

function text(body: string) {
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] };
}

test('adds, moves and sets up blocks on the website', async ({ page, browser }, info) => {
    const slug = `anordnen-${unique()}`;
    const id = await openPage(page, slug, [
        { block: 'frootbox/theme-base/TextWithHeading', fields: { title: 'Rösten', body: text('Wir rösten langsam.') } },
    ]);
    const bar = page.locator('fb-editor-bar');
    const textBlock = page.locator('[data-fb-name="frootbox/theme-base/TextWithHeading"]');
    const section = page.locator('[data-fb-name="frootbox/theme-base/Section"]');
    const picker = bar.getByRole('dialog', { name: 'Block einfügen' });

    // A section below the text, from the dialog.
    await textBlock.hover();
    await bar.getByRole('toolbar', { name: 'Block Text mit Überschrift' }).getByRole('button', { name: 'Block darunter einfügen' }).click();
    // The library is large, the picker shows it in groups.
    await picker.getByRole('button', { name: /^Struktur/ }).click();
    await expect(picker.getByRole('button', { name: /^Abschnitt/ })).toBeVisible();
    await expect(picker.getByRole('button', { name: /^Überschrift Eine/ })).toHaveCount(0);

    // Each card shows the preview from the block folder in the colours of the theme (decision 0148).
    const preview = picker.getByRole('button', { name: /^Abschnitt/ }).locator('.preview use');
    const href = await preview.getAttribute('href');
    expect(href).toMatch(/^\/previews\/frootbox\/theme-base\/blocks\/Section\/preview\.svg\?v=\d+#preview$/);
    const file = await page.request.get(href!.replace('#preview', ''));
    expect(file.status()).toBe(200);
    expect(file.headers()['content-type']).toBe('image/svg+xml');
    await expect.poll(() => preview.evaluate((use: SVGUseElement) => use.getBBox().width)).toBeGreaterThan(0);
    await picker.getByLabel('Suchen').fill('kundenstimme');
    await expect(picker.getByRole('button', { name: /^Zitat/ })).toBeVisible();
    await expect(picker.getByRole('button', { name: /^Abschnitt/ })).toHaveCount(0);
    await picker.getByLabel('Suchen').fill('');

    // The page is swapped, not loaded again: what the window holds stays.
    await page.evaluate(() => { (window as unknown as { kept: boolean }).kept = true; });
    await picker.getByRole('button', { name: /^Abschnitt/ }).click();
    await expect(section).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { kept?: boolean }).kept)).toBe(true);
    await expect(bar.locator('.state .visually-hidden')).toHaveText('Status: Änderungen offen');

    // Two columns from the panel, which stays open after loading again.
    await bar.getByRole('toolbar', { name: 'Block Abschnitt' }).getByRole('button', { name: 'Einstellungen des Blocks' }).click();
    const panel = bar.getByRole('region', { name: 'Einstellungen: Abschnitt' });
    await panel.getByRole('radio', { name: /^Zwei Spalten/ }).check();
    await expect(section.locator('.base-section__grid--two')).toHaveCount(1);
    await expect(panel.getByRole('radio', { name: /^Zwei Spalten/ })).toBeChecked();
    await panel.getByRole('button', { name: 'Schließen' }).click();
    await expect(panel).toHaveCount(0);

    // One heading in each empty column, typed in place.
    for (const [area, heading] of [['first', 'Links'], ['second', 'Rechts']]) {
        await section.locator(`fb-area[data-fb-area="${area}"]`).click();
        await expect(picker.getByRole('button', { name: /^Überschrift Eine/ })).toBeVisible();
        await expect(picker.getByRole('button', { name: /^Abschnitt/ })).toHaveCount(0);
        await picker.getByRole('button', { name: /^Überschrift Eine/ }).click();
        await ready(page);
        const field = section.locator(`[data-fb-area="${area}"][data-fb-name="frootbox/theme-base/Heading"]`)
            .locator(':scope[data-fb-field], [data-fb-field]').first();
        await expect(field).toHaveAttribute('contenteditable', 'plaintext-only');
        await field.click();
        const save = page.waitForResponse((response) => response.url().endsWith('/page.update-field') && response.ok());
        await page.keyboard.type(heading);
        await page.keyboard.press('Enter');
        await save;
    }

    // The section up, over the text.
    await section.focus();
    await bar.getByRole('toolbar', { name: 'Block Abschnitt' }).getByRole('button', { name: 'Nach oben' }).click();
    await expect(page.locator('[data-fb-block][data-fb-area="main"]').first()).toHaveAttribute('data-fb-name', 'frootbox/theme-base/Section');
    await expect(section).toBeFocused();

    // Alt+F10 reaches the buttons, Escape goes back to the block.
    await textBlock.focus();
    await page.keyboard.press('Alt+F10');
    const tools = bar.getByRole('toolbar', { name: 'Block Text mit Überschrift' });
    await expect(tools.getByRole('button', { name: 'Nach oben' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tools.getByRole('button', { name: 'Block kopieren' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(textBlock).toBeFocused();

    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(bar.getByRole('status')).toHaveText('Die Seite ist veröffentlicht.');

    // Guests get the columns side by side, on a phone one below the other.
    const baseURL = info.project.use.baseURL;
    for (const [width, stacked] of [[1280, false], [375, true]] as const) {
        const guest = await browser.newPage({ baseURL, viewport: { width, height: 900 } });
        await guest.goto(`/${slug}`);
        const left = await guest.getByRole('heading', { name: 'Links' }).boundingBox();
        const right = await guest.getByRole('heading', { name: 'Rechts' }).boundingBox();
        expect(left && right).toBeTruthy();
        expect(right!.y > left!.y + left!.height - 1).toBe(stacked);
        expect(await guest.locator('[data-fb-block]').count()).toBe(0);
        await guest.close();
    }

    await removePage(page, id);
});

test('inserts a block at the very top of a filled area', async ({ page }) => {
    const id = await openPage(page, `oben-${unique()}`, [
        { block: 'frootbox/theme-base/TextWithHeading', fields: { title: 'Erster', body: text('Bisher oben.') } },
        { block: 'frootbox/theme-base/TextWithHeading', fields: { title: 'Zweiter', body: text('Darunter.') } },
    ]);
    const bar = page.locator('fb-editor-bar');
    const blocks = page.locator('[data-fb-block][data-fb-area="main"]');
    const picker = bar.getByRole('dialog', { name: 'Block einfügen' });

    // Only the first block of an area offers the top; below the others is enough.
    await blocks.nth(1).focus();
    await expect(bar.getByRole('toolbar', { name: 'Block Text mit Überschrift' }).getByRole('button', { name: 'Block darunter einfügen' })).toBeVisible();
    await expect(bar.getByRole('button', { name: 'Block ganz oben einfügen' })).toHaveCount(0);

    await blocks.first().focus();
    await bar.getByRole('toolbar', { name: 'Block Text mit Überschrift' }).getByRole('button', { name: 'Block ganz oben einfügen' }).click();
    await picker.getByLabel('Suchen').fill('Hero');
    await picker.getByRole('button', { name: /^Hero/ }).click();
    await expect(blocks).toHaveCount(3);
    await expect(blocks.first()).toHaveAttribute('data-fb-name', 'frootbox/theme-base/Hero');
    await expect(blocks.first()).toBeFocused();
    await expect(blocks.nth(1)).toContainText('Erster');

    await removePage(page, id);
});

test('holds the place of an empty list and adds its first entry', async ({ page }) => {
    const slug = `leer-${unique()}`;
    const id = await openPage(page, slug, [
        { block: 'frootbox/theme-base/Features', fields: { title: 'Warum wir', items: [{ title: 'Frisch' }] } },
    ]);
    const features = page.locator('[data-fb-name="frootbox/theme-base/Features"]');
    // A draft may be unfinished: the last entry gone, e.g. through the API.
    const block = await features.getAttribute('data-fb-block');
    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.remove-list-entry', { id, language: 'de', block, path: 'items/0' })).status).toBe(200);
    await page.goto(`/${slug}`);
    await ready(page);
    const holder = features.getByRole('button', { name: 'Vorteile: Eintrag hinzufügen' });

    await expect(holder).toBeVisible();
    await holder.click();
    await expect(features.locator('.base-features__item')).toHaveCount(1);
    await expect(holder).toHaveCount(0);
    // The focus on the first field of the new entry, its symbol.
    await expect(features.locator('[data-fb-field^="items/0/"]').first()).toBeFocused();

    await removePage(page, id);
});

test('copies and deletes blocks and edits list entries', async ({ page }) => {
    const slug = `liste-${unique()}`;
    const id = await openPage(page, slug, [
        { block: 'frootbox/theme-base/Accordion', variant: 'Faq', fields: { title: 'Fragen', items: [{ title: 'Eins?', body: text('Ja.') }] } },
    ]);
    const bar = page.locator('fb-editor-bar');
    const faq = page.locator('[data-fb-name="frootbox/theme-base/Accordion"]');
    const tools = bar.getByRole('toolbar', { name: 'Block Akkordeon' });

    // A copy goes right below and gets the focus.
    await faq.hover();
    await tools.getByRole('button', { name: 'Block kopieren' }).click();
    await expect(faq).toHaveCount(2);
    await expect(faq.nth(1)).toBeFocused();

    // Deleting asks first.
    await tools.getByRole('button', { name: 'Block löschen' }).click();
    await expect(tools).toContainText('„Akkordeon“ löschen?');
    await tools.getByRole('button', { name: 'Löschen', exact: true }).click();
    await expect(faq).toHaveCount(1);

    // List entries in the panel: add one, fill it, move it up, remove the other.
    await faq.focus();
    await tools.getByRole('button', { name: 'Einstellungen des Blocks' }).click();
    const panel = bar.getByRole('region', { name: 'Einstellungen: Akkordeon' });
    await panel.getByRole('button', { name: 'Eintrag hinzufügen' }).click();
    await expect(faq.locator('details')).toHaveCount(2);
    await panel.getByRole('button', { name: 'Eintrag 2', exact: true }).click();
    await panel.getByPlaceholder('Eine Frage oder ein Thema').fill('Zwei?');
    await panel.getByPlaceholder('Eine Frage oder ein Thema').press('Enter');
    await expect(faq.locator('summary').nth(1)).toHaveText('Zwei?');

    await panel.getByRole('button', { name: 'Nach oben: Zwei?' }).click();
    await expect(faq.locator('summary').first()).toHaveText('Zwei?');
    await panel.getByRole('button', { name: 'Eintrag entfernen: Eins?' }).click();
    await expect(faq.locator('summary')).toHaveText(['Zwei?']);

    // An option, then undo takes it back.
    await panel.getByRole('checkbox', { name: 'Ersten Eintrag öffnen' }).check();
    await expect(faq.locator('details').first()).toHaveAttribute('open', '');
    await panel.getByRole('button', { name: 'Schließen' }).click();
    await bar.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(faq.locator('details').first()).not.toHaveAttribute('open', '');
    await expect(faq.locator('summary')).toHaveText(['Zwei?']);

    await removePage(page, id);
});

test('gives a new block its start entries with placeholders', async ({ page, browser }) => {
    const slug = `start-${unique()}`;
    const id = await openPage(page, slug, [
        { block: 'frootbox/theme-base/TextWithHeading', fields: { title: 'Rösten', body: text('Wir rösten langsam.') } },
    ]);
    const bar = page.locator('fb-editor-bar');
    const textBlock = page.locator('[data-fb-name="frootbox/theme-base/TextWithHeading"]');
    const features = page.locator('[data-fb-name="frootbox/theme-base/Features"]');
    const picker = bar.getByRole('dialog', { name: 'Block einfügen' });

    // Right after inserting, the block looks like itself (decision 0142).
    await textBlock.hover();
    await bar.getByRole('toolbar', { name: 'Block Text mit Überschrift' }).getByRole('button', { name: 'Block darunter einfügen' }).click();
    await picker.getByRole('button', { name: /^Listen/ }).click();
    await picker.getByRole('button', { name: /^Vorteile/ }).click();
    await expect(features.locator('.base-features__item')).toHaveCount(3);
    // After loading again the new block has the focus; only then click into it.
    await expect(features).toBeFocused();
    const title = features.locator('[data-fb-field="items/0/title"]');
    await expect(title).toHaveAttribute('data-fb-placeholder', 'Was dafür spricht');
    await expect(title).toBeEmpty();

    // Typed right into the placeholder.
    const save = page.waitForResponse((response) => response.url().endsWith('/page.update-field') && response.ok());
    await title.click();
    await page.keyboard.type('Frisch geröstet');
    await page.keyboard.press('Enter');
    await save;
    await expect(title).toHaveText('Frisch geröstet');

    // The second entry gets a text, but no heading yet.
    const typed = page.waitForResponse((response) => response.url().endsWith('/page.update-field') && response.ok());
    await features.locator('[data-fb-field="items/1/text"]').click();
    await page.keyboard.type('Jeden Morgen');
    await page.keyboard.press('Tab');
    await typed;

    // Empty required fields keep the page from going live and are marked (decision 0143);
    // entries nobody touched and optional fields do not (decision 0144).
    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(bar.getByRole('region', { name: 'Redaktionsleiste' }).getByRole('status')).toHaveText('Prüf die markierten Felder. Bei einem Feld fehlt noch etwas.');
    await expect(bar.locator('.outline[data-kind="problem"]')).toHaveCount(1);

    // The way to the first one; with a value its mark goes.
    const heading = features.locator('[data-fb-field="items/1/title"]');
    await bar.getByRole('button', { name: 'Zum ersten Feld' }).click();
    await expect(heading).toBeFocused();
    const saved = page.waitForResponse((response) => response.url().endsWith('/page.update-field') && response.ok());
    await page.keyboard.type('Morgens frisch');
    await page.keyboard.press('Enter');
    await saved;
    await expect(bar.locator('.outline[data-kind="problem"]')).toHaveCount(0);
    await expect(bar.locator('.state .visually-hidden')).toHaveText('Status: Änderungen offen');

    // Emptied by hand, a field shows its placeholder again.
    const second = features.locator('[data-fb-field="items/2/title"]');
    await second.click();
    await page.keyboard.type('x');
    await page.keyboard.press('Backspace');
    await expect(second).toBeEmpty();

    // Buttons at the entry add, move and remove entries (decision 0145).
    await title.hover();
    const tools = bar.getByRole('toolbar', { name: 'Eintrag 1 von „Vorteile“' });
    await tools.getByRole('button', { name: 'Eintrag danach einfügen' }).click();
    await expect(features.locator('.base-features__item')).toHaveCount(4);
    await expect(features.locator('[data-fb-field="items/1/title"]')).toBeFocused();
    await bar.getByRole('toolbar', { name: 'Eintrag 2 von „Vorteile“' }).getByRole('button', { name: 'Nach vorne' }).click();
    await expect(features.locator('[data-fb-field="items/1/title"]')).toHaveText('Frisch geröstet');
    await expect(features.locator('[data-fb-field="items/0/title"]')).toBeFocused();
    const first = bar.getByRole('toolbar', { name: 'Eintrag 1 von „Vorteile“' });
    await expect(first.getByRole('button', { name: 'Nach vorne' })).toBeDisabled();
    await first.getByRole('button', { name: 'Eintrag entfernen' }).click();
    await expect(features.locator('.base-features__item')).toHaveCount(3);
    await expect(features.locator('[data-fb-field="items/0/title"]')).toBeFocused();
    await expect(features.locator('[data-fb-field="items/0/title"]')).toHaveText('Frisch geröstet');

    // Visitors get the entries with a value only, without empty elements.
    const published = page.waitForResponse((response) => response.url().endsWith('/page.publish') && response.ok());
    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await published;
    const guest = await browser.newPage();
    await guest.goto(`/${slug}`);
    await expect(guest.locator('.base-features__item')).toHaveCount(2);
    await expect(guest.locator('.base-features__heading')).toHaveText(['Frisch geröstet', 'Morgens frisch']);
    expect(await guest.locator('.base-features').innerHTML()).not.toMatch(/<(p|span)[^>]*><\/\1>|fb:empty/);
    await guest.close();

    await removePage(page, id);
});
