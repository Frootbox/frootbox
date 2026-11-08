/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The panel "Page" of the editor bar (decision 0347): title, address and
// texts for search engines into the draft, a new address loads the page
// there, a new version in another language, the exclusions from searches,
// and the account at the end of "More".

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

async function openPage(page: Page, slug: string): Promise<string> {
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Rösterei', slug, content: { fields: { title: 'Rösterei' } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);
    await expect(page.locator('h1[data-fb-field="title"]')).toHaveAttribute('contenteditable', 'plaintext-only');

    return id;
}

function updated(page: Page) {
    return page.waitForResponse((response) => response.url().endsWith('/page.update') && response.request().method() === 'POST');
}

test('changes title, address, versions and visibility in the panel "Page"', async ({ page }) => {
    const slug = `roesterei-${unique()}`;
    const number = Math.floor(Math.random() * 1000000);
    const id = await openPage(page, slug);
    const bar = page.locator('fb-editor-bar');
    const panel = bar.getByRole('region', { name: 'Einstellungen der Seite' });

    await bar.getByRole('button', { name: 'Seite', exact: true }).click();
    await expect(panel).toBeVisible();
    const title = panel.getByLabel('Titel', { exact: true });
    await expect(title).toHaveValue('Rösterei');
    await expect(title).toBeFocused();
    await expect(panel.getByLabel('Titel für Suchmaschinen')).toHaveAttribute('placeholder', /^Rösterei – /);

    // Title and description go into the draft; the page is swapped and the panel stays open.
    await title.fill(`Rösterei ${number}`);
    await panel.getByLabel('Beschreibung für Suchmaschinen').fill('Kaffee, langsam geröstet.');
    let saving = updated(page);
    await panel.getByRole('button', { name: 'Speichern' }).click();
    expect((await saving).ok()).toBe(true);
    await expect(panel.getByLabel('Titel', { exact: true })).toHaveValue(`Rösterei ${number}`);
    await expect(panel.getByLabel('Beschreibung für Suchmaschinen')).toHaveValue('Kaffee, langsam geröstet.');
    await expect(bar.locator('.state')).toHaveAttribute('data-state', 'changed');

    // A reserved address stays in the field with its error.
    await panel.getByLabel('Adresse').fill('cms');
    saving = updated(page);
    await panel.getByRole('button', { name: 'Speichern' }).click();
    expect((await saving).status()).toBe(422);
    await expect(panel.getByLabel('Adresse')).toHaveAttribute('aria-invalid', 'true');
    await expect(panel.getByLabel('Adresse')).toHaveValue('cms');
    await expect(panel.getByLabel('Adresse')).toBeFocused();

    // A new address loads the page there, with the panel open again.
    await panel.getByLabel('Adresse').fill(`${slug}-hafen`);
    await panel.getByRole('button', { name: 'Speichern' }).click();
    await expect(page).toHaveURL(`/${slug}-hafen`);
    await expect(panel.getByLabel('Adresse')).toHaveValue(`${slug}-hafen`);

    // The version in English starts with the title and gets its address from it, in English.
    const english = panel.locator('li[data-language="en"]');
    await expect(english).toContainText('Noch keine Fassung');
    await english.getByRole('button', { name: /^Fassung in .+ anlegen$/ }).click();
    await expect(page).toHaveURL(`/en/rosterei-${number}`);
    await expect(panel).toBeVisible();
    await expect(panel.locator('li[data-language="en"]')).toContainText('Diese Sprache');
    await expect(panel.locator('li[data-language="de"]').getByRole('link')).toHaveAttribute('href', `/${slug}-hafen#fb-page`);

    // Searches leave the page out from the select on.
    saving = updated(page);
    await panel.getByLabel('Suchmaschinen', { exact: true }).selectOption('page');
    expect((await saving).ok()).toBe(true);
    await expect(panel.getByLabel('Suchmaschinen', { exact: true })).toHaveValue('page');

    // The account and signing out at the end of "More".
    await panel.getByRole('button', { name: 'Schließen' }).click();
    await expect(panel).toHaveCount(0);
    await expect(bar.getByRole('button', { name: 'Seite', exact: true })).toBeFocused();
    await bar.getByRole('button', { name: 'Mehr' }).click();
    await expect(bar.getByRole('group', { name: 'Du' }).getByRole('menuitem', { name: 'Dein Konto' })).toHaveAttribute('href', '/cms/account');
    await expect(bar.getByRole('group', { name: 'Du' }).getByRole('menuitem', { name: 'Abmelden' })).toBeVisible();
    await page.keyboard.press('Escape');

    // On a phone the bar stays one line, the panel is in "More".
    await page.setViewportSize({ width: 375, height: 760 });
    await expect(bar.getByRole('button', { name: 'Seite', exact: true })).toBeHidden();
    await bar.getByRole('button', { name: 'Mehr' }).click();
    await bar.getByRole('menuitem', { name: 'Einstellungen der Seite' }).click();
    await expect(panel.getByLabel('Titel', { exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(bar.getByRole('button', { name: 'Mehr' })).toBeFocused();

    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
