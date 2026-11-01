/*
 * SPDX-License-Identifier: LGPL-3.0-only
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
        layout: 'frootbox/theme-bohnenglueck/Page',
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
        { block: 'frootbox/theme-bohnenglueck/Text', fields: { body: text('Wir rösten langsam.') } },
    ]);
    const bar = page.locator('fb-editor-bar');
    const textBlock = page.locator('[data-fb-name="frootbox/theme-bohnenglueck/Text"]');
    const section = page.locator('[data-fb-name="frootbox/theme-base/Section"]');
    const picker = bar.getByRole('dialog', { name: 'Block einfügen' });

    // A section below the text, from the dialog.
    await textBlock.hover();
    await bar.getByRole('toolbar', { name: 'Block Text' }).getByRole('button', { name: 'Block darunter einfügen' }).click();
    await expect(picker.getByRole('button', { name: /^Abschnitt/ })).toBeVisible();
    await expect(picker.getByRole('button', { name: /^Überschrift/ })).toHaveCount(0);
    await picker.getByRole('button', { name: /^Abschnitt/ }).click();
    await expect(section).toBeFocused();
    await expect(bar.locator('.badge[data-status]')).toHaveText('Status: Geändert');

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
        await expect(picker.getByRole('button', { name: /^Überschrift/ })).toBeVisible();
        await expect(picker.getByRole('button', { name: /^Abschnitt/ })).toHaveCount(0);
        await picker.getByRole('button', { name: /^Überschrift/ }).click();
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
    const tools = bar.getByRole('toolbar', { name: 'Block Text' });
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

test('copies and deletes blocks and edits list entries', async ({ page }) => {
    const slug = `liste-${unique()}`;
    const id = await openPage(page, slug, [
        { block: 'frootbox/theme-bohnenglueck/Faq', fields: { title: 'Fragen', items: [{ question: 'Eins?', answer: text('Ja.') }] } },
    ]);
    const bar = page.locator('fb-editor-bar');
    const faq = page.locator('[data-fb-name="frootbox/theme-bohnenglueck/Faq"]');
    const tools = bar.getByRole('toolbar', { name: 'Block FAQ' });

    // A copy goes right below and gets the focus.
    await faq.hover();
    await tools.getByRole('button', { name: 'Block kopieren' }).click();
    await expect(faq).toHaveCount(2);
    await expect(faq.nth(1)).toBeFocused();

    // Deleting asks first.
    await tools.getByRole('button', { name: 'Block löschen' }).click();
    await expect(tools).toContainText('„FAQ“ löschen?');
    await tools.getByRole('button', { name: 'Löschen', exact: true }).click();
    await expect(faq).toHaveCount(1);

    // List entries in the panel: add one, fill it, move it up, remove the other.
    await faq.focus();
    await tools.getByRole('button', { name: 'Einstellungen des Blocks' }).click();
    const panel = bar.getByRole('region', { name: 'Einstellungen: FAQ' });
    await panel.getByRole('button', { name: 'Eintrag hinzufügen' }).click();
    await expect(faq.locator('details')).toHaveCount(2);
    await panel.getByRole('button', { name: 'Eintrag 2', exact: true }).click();
    await panel.getByLabel('Frage').fill('Zwei?');
    await panel.getByLabel('Frage').press('Enter');
    await expect(faq.locator('summary').nth(1)).toHaveText('Zwei?');

    await panel.getByRole('button', { name: 'Nach oben: Zwei?' }).click();
    await expect(faq.locator('summary').first()).toHaveText('Zwei?');
    await panel.getByRole('button', { name: 'Eintrag entfernen: Eins?' }).click();
    await expect(faq.locator('summary')).toHaveText(['Zwei?']);

    // An option, then undo takes it back.
    await panel.getByRole('checkbox', { name: 'Erste Antwort geöffnet' }).check();
    await expect(faq.locator('details').first()).toHaveAttribute('open', '');
    await panel.getByRole('button', { name: 'Schließen' }).click();
    await bar.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(faq.locator('details').first()).not.toHaveAttribute('open', '');
    await expect(faq.locator('summary')).toHaveText(['Zwei?']);

    await removePage(page, id);
});
