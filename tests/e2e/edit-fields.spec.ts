/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// Fields edited on the website (decision 0122): headline, rich text and
// link save themselves into the draft, undo reverts the last change and
// guests see nothing until it is published. The page is unique, so
// retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/** Creates and publishes a page with a text and a call to action, and opens it in the mode. */
async function openPage(page: Page, slug: string, heading: string): Promise<string> {
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Rösterei', slug, content: {
            fields: { title: heading, intro: 'Klein und langsam.' },
            areas: { main: [
                { block: 'frootbox/theme-base/TextWithHeading', fields: { title: 'Rösten', body: { type: 'doc', content: [
                    { type: 'paragraph', content: [{ type: 'text', text: 'Wir rösten langsam.' }] },
                ] } } },
                { block: 'frootbox/theme-base/CallToAction', fields: { title: 'Fragen?', link: { url: 'mailto:hallo@example.test', text: 'Schreib uns' } } },
            ] },
        } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);

    // The script of the mode is loaded once the fields are editable.
    await expect(page.locator('h1[data-fb-field="title"]')).toHaveAttribute('contenteditable', 'plaintext-only');

    return id;
}

async function removePage(page: Page, id: string): Promise<void> {
    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
}

/** Waits for the next saved field. */
function saved(page: Page) {
    return page.waitForResponse((response) => response.url().endsWith('/page.update-field') && response.ok());
}

test('edits fields on the website', async ({ page, request }) => {
    const slug = `roesterei-${unique()}`;
    // Short, so it stays on one line and End reaches its end.
    const heading = `Rösterei ${Math.floor(Math.random() * 1000)}`;
    const id = await openPage(page, slug, heading);
    const bar = page.locator('fb-editor-bar');

    // A headline: typed in place, Enter ends it, it saves itself.
    const title = page.locator('h1[data-fb-field="title"]');
    await title.click();
    await page.keyboard.press('End');
    let save = saved(page);
    await page.keyboard.type(' am Hafen');
    await page.keyboard.press('Enter');
    await save;
    await expect(title).toHaveText(`${heading} am Hafen`);
    await expect(bar.getByRole('status')).toHaveText('Gespeichert');
    await expect(bar.locator('.state .visually-hidden')).toHaveText('Status: Änderungen offen');
    expect(await (await request.get(`/${slug}`)).text()).not.toContain('am Hafen');

    // Escape takes back what is not saved yet.
    const intro = page.locator('[data-fb-field="intro"]');
    await intro.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' Nein');
    await page.keyboard.press('Escape');
    await expect(intro).toHaveText('Klein und langsam.');

    // Rich text with the toolbar at the selection.
    const body = page.locator('[data-fb-field="body"]');
    await body.click();
    const toolbar = bar.getByRole('toolbar', { name: 'Formatierung' });
    await expect(toolbar).toBeVisible();
    // On a Mac, End scrolls the page; Cmd+Right goes to the end of the line.
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End');
    await page.keyboard.press('Shift+ArrowLeft', { delay: 10 });
    for (let i = 0; i < 7; i++) {
        await page.keyboard.press('Shift+ArrowLeft');
    }
    save = saved(page);
    await toolbar.getByRole('button', { name: 'Fett' }).click();
    await save;
    await expect(body.locator('strong')).toHaveText('langsam.');

    await toolbar.getByRole('button', { name: 'Link' }).click();
    const dialog = bar.getByRole('dialog', { name: 'Link' });
    await dialog.getByLabel('Adresse oder Seite').fill('example.com');
    save = saved(page);
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await save;
    await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com');

    // A link field with its dialog.
    const button = page.locator('[data-fb-field="link"]');
    await button.click();
    await dialog.getByLabel('Text').fill('Mail an uns');
    save = saved(page);
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await save;
    await expect(button).toHaveText('Mail an uns');

    // Undo takes back the last change.
    await bar.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(button).toHaveText('Schreib uns');
    await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com');

    // Published, guests see it.
    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(bar.getByRole('status')).toHaveText('Die Seite ist veröffentlicht.');
    const html = await (await request.get(`/${slug}`)).text();
    expect(html).toContain(`${heading} am Hafen`);
    expect(html).toContain('<strong>langsam.</strong>');
    expect(html).toContain('Schreib uns');
    expect(html).not.toContain('data-fb-');

    await removePage(page, id);
});

test('tells when someone else changed the field', async ({ page }) => {
    const slug = `konflikt-${unique()}`;
    const heading = `Konflikt ${Math.floor(Math.random() * 1000)}`;
    const id = await openPage(page, slug, heading);
    const bar = page.locator('fb-editor-bar');

    // Meanwhile someone else changes the headline.
    const other = await page.evaluate(async ([id, heading]) => {
        const bar = document.querySelector('fb-editor-bar') as any;
        const response = await bar.action('page.update-field', { id, language: 'de', path: 'title', value: 'Von jemand anderem', previous: heading });

        return response.status;
    }, [id, heading] as const);
    expect(other).toBe(200);

    const title = page.locator('h1[data-fb-field="title"]');
    await title.click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await page.keyboard.press('Enter');
    await expect(bar.getByRole('status')).toContainText('Jemand hat das Feld inzwischen geändert.');

    // The status only says "Error"; its button shows what went wrong (decision 0140).
    const error = bar.getByRole('button', { name: 'Status: Fehler' });
    await expect(error).toHaveAttribute('aria-expanded', 'false');
    await error.click();
    await expect(error).toHaveAttribute('aria-expanded', 'true');
    await expect(bar.locator('#fb-state-details')).toContainText('Jemand hat das Feld inzwischen geändert.');
    await bar.getByRole('button', { name: 'Neu laden' }).click();
    await expect(title).toHaveText('Von jemand anderem');

    await removePage(page, id);
});

test('offers the buttons of a field on its label', async ({ page, context }) => {
    const slug = `knoepfe-${unique()}`;
    const id = await openPage(page, slug, `Knöpfe ${Math.floor(Math.random() * 1000)}`);
    const bar = page.locator('fb-editor-bar');

    // The button of the call to action leads to the start page.
    const button = page.locator('[data-fb-field="link"]');
    await button.click();
    const dialog = bar.getByRole('dialog', { name: 'Link' });
    await dialog.getByLabel('Adresse oder Seite').fill('/');
    let save = saved(page);
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await save;
    await expect(button.locator('a')).toHaveAttribute('href', '/');

    // On hover its label carries the buttons; it is required, so no remove.
    await button.hover();
    const tools = bar.getByRole('toolbar', { name: 'Feld Button' });
    await expect(tools.getByRole('button')).toHaveCount(2);
    await expect(tools.getByRole('button', { name: 'Link bearbeiten' })).toBeVisible();
    await expect(tools.getByRole('button', { name: 'Link öffnen' })).toHaveAttribute('title', /Strg- oder Cmd-Klick/);

    // The keyboard reaches them from the field, Escape goes back.
    await button.focus();
    await page.keyboard.press('Alt+F10');
    await expect(tools.getByRole('button', { name: 'Link bearbeiten' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tools.getByRole('button', { name: 'Link öffnen' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();

    // Ctrl-click follows the link in a new tab instead of editing it.
    const opened = context.waitForEvent('page');
    await button.click({ modifiers: ['ControlOrMeta'] });
    const tab = await opened;
    await tab.waitForLoadState();
    expect(new URL(tab.url()).pathname).toBe('/');
    await tab.close();
    await expect(dialog).toBeHidden();

    // "Open the link" follows a page of the website in this tab, still in the mode.
    await button.hover();
    await tools.getByRole('button', { name: 'Link öffnen' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('fb-editor-bar')).toBeAttached();
    await expect(page.locator('[data-fb-field]').first()).toBeAttached();

    await removePage(page, id);
});

test('shows the lines of a text with several lines once', async ({ page }) => {
    const slug = `zeilen-${unique()}`;
    const id = await openPage(page, slug, `Zeilen ${Math.floor(Math.random() * 1000)}`);

    // In the mode a line break next to the <br> would count twice.
    const address = page.locator('[data-fb-site][data-fb-field="address"]');
    await expect(address).toHaveAttribute('contenteditable', 'plaintext-only');
    expect(await address.evaluate((element: HTMLElement) => element.innerText)).toBe('Bohnenglück Kaffeerösterei\nHafenstraße 12\n20457 Hamburg');

    await removePage(page, id);
});
