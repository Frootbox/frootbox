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

    const bar = page.locator('fb-edit-bar');
    await expect(bar.getByRole('switch', { name: 'Bearbeiten' })).toHaveAttribute('aria-checked', 'true');
    await expect(bar.locator('.badge[data-status]')).toHaveText('Status: Entwurf');

    const title = page.locator('h1[data-fb-field="title"]');
    await expect(title).toHaveText(heading);
    await title.hover();
    await expect(bar.locator('.outline .label')).toHaveText('Überschrift');
    await title.focus();
    await expect(bar.locator('.outline')).toHaveCount(1);

    await bar.getByRole('button', { name: 'Alle Stellen zeigen' }).click();
    expect(await bar.locator('.outline').count()).toBeGreaterThan(1);

    // Publish from the bar.
    await bar.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(bar.getByRole('status')).toHaveText('Die Seite ist veröffentlicht.');
    await expect(bar.locator('.badge[data-status]')).toHaveText('Status: Veröffentlicht');
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
