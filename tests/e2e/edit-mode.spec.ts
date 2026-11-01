/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test, type Page } from '@playwright/test';
import { signIn } from './admin';

// The editing mode on the website (decision 0119): guests get nothing of
// it, editors see the draft with the bar, publish from it and switch it
// off. The page is unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/** Runs an action with the session of a backend page. */
async function action(page: Page, name: string, input: object): Promise<{ status: number; body: any }> {
    return page.evaluate(async ([name, input]) => {
        const meta = (key: string) => document.querySelector(`meta[name="${key}"]`)?.getAttribute('content') ?? '';
        const response = await fetch(meta('fb-actions') + name, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': meta('fb-csrf') },
            body: JSON.stringify(input),
        });

        return { status: response.status, body: await response.json() };
    }, [name, input] as const);
}

test('leaves guests alone', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).not.toContain('fb-edit');
    expect(html).not.toContain('data-fb-');

    // Other tests may clear the cache meanwhile, so ask until it hits.
    await expect.poll(async () => (await request.get('/')).headers()['x-frootbox-cache'], { timeout: 15000 }).toBe('hit');
});

test('edits the website from the draft', async ({ page, request }) => {
    const slug = `roesttag-${unique()}`;
    const heading = `Rösttag ${slug}`;

    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        translations: { de: { title: 'Rösttag', slug, content: { fields: { title: heading } } } },
        parentId: start,
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    expect((await request.get(`/${slug}`)).status()).toBe(404);

    // From the details of the page into the mode, at its future address.
    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);

    const bar = page.locator('fb-editor-bar');
    await expect(bar.getByRole('switch', { name: 'Bearbeiten' })).toHaveAttribute('aria-checked', 'true');
    await expect(bar.locator('.state .visually-hidden')).toHaveText('Status: Entwurf');
    const width = (await bar.locator('.state').boundingBox())?.width;

    const title = page.locator('h1[data-fb-field="title"]');
    await expect(title).toHaveText(heading);
    await title.hover();
    await expect(bar.locator('.outline .label')).toHaveText('Überschrift');
    await title.focus();
    await expect(bar.locator('.outline')).toHaveCount(1);

    // Less frequent commands are in the menu "More" (decision 0139).
    const more = bar.getByRole('button', { name: 'Mehr' });
    await more.click();
    const menu = bar.getByRole('menu', { name: 'Mehr' });
    await expect(menu.getByRole('group', { name: 'Diese Seite' })).toBeVisible();
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Alle Stellen zeigen' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(menu.getByRole('menuitem', { name: 'Design' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(more).toBeFocused();

    // Like Safari, pressing the mouse moves the focus away unless prevented;
    // the menu must stay open until the click lands.
    await page.evaluate(() => addEventListener('mousedown', (event) => {
        if (!event.defaultPrevented) {
            (document.querySelector('fb-editor-bar')?.shadowRoot?.activeElement as HTMLElement | null)?.blur();
        }
    }));
    await more.click();
    await menu.getByRole('menuitemcheckbox', { name: 'Alle Stellen zeigen' }).click();
    expect(await bar.locator('.outline').count()).toBeGreaterThan(1);

    // Publish from the bar.
    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(bar.getByRole('status')).toHaveText('Die Seite ist veröffentlicht.');
    await expect(bar.locator('.state .visually-hidden')).toHaveText('Status: Veröffentlicht');

    // The bar keeps its width: the status only changes text and colour, and
    // "Publish" stays in place, muted (decision 0140).
    expect((await bar.locator('.state').boundingBox())?.width).toBe(width);
    const publish = bar.getByRole('button', { name: 'Veröffentlichen' });
    await expect(publish).toHaveAttribute('aria-disabled', 'true');
    await expect(publish).toHaveAttribute('title', 'Alles ist veröffentlicht');

    // A click on the status says what it means (decision 0141).
    const state = bar.getByRole('button', { name: 'Status: Veröffentlicht' });
    await state.click();
    await expect(state).toHaveAttribute('aria-expanded', 'true');
    await expect(bar.locator('#fb-state-details')).toHaveText('Besucher sehen genau diese Fassung.');
    await page.keyboard.press('Escape');
    await expect(bar.locator('#fb-state-details')).toHaveCount(0);
    await expect(state).toBeFocused();
    expect(await (await request.get(`/${slug}`)).text()).toContain(heading);

    // Switched off, the page is as visitors see it, with the bar to switch back.
    await bar.getByRole('switch', { name: 'Bearbeiten' }).click();
    await expect(bar.getByRole('switch', { name: 'Bearbeiten' })).toHaveAttribute('aria-checked', 'false');
    await expect(page).toHaveURL(`/${slug}`);
    await expect(page.locator('h1')).toHaveText(heading);
    await expect(page.locator('[data-fb-field]')).toHaveCount(0);

    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
