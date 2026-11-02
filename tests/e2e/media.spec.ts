/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The media library (decision 0126): upload, focus point and texts in the
// backend, choosing the image on the website, and what visitors get once
// the page is published. Names are unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/**
 * A JPEG drawn by the browser: brown with a light square at the right and
 * a corner of a random color, so each one differs (the library finds the
 * same file again, decision 0146).
 */
async function photo(page: Page, name: string): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
    const data = await page.evaluate((corner) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 1000;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#8a4b2a';
        context.fillRect(0, 0, 1600, 1000);
        context.fillStyle = '#f5efe6';
        context.fillRect(1000, 200, 300, 300);
        context.fillStyle = corner;
        context.fillRect(0, 0, 40, 40);

        return canvas.toDataURL('image/jpeg', 0.9);
    }, `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`);

    return { name, mimeType: 'image/jpeg', buffer: Buffer.from(data.split(',')[1], 'base64') };
}

/**
 * The clip of the sample website with an empty EBML element of random
 * bytes at the end, so each run uploads another file (decision 0146).
 */
function clip(name: string): { name: string; mimeType: string; buffer: Buffer } {
    const film = readFileSync('packages/themes/base/demo/media/roasting.webm');
    const filler = Buffer.from([0xec, 0x84, ...Array.from({ length: 4 }, () => Math.floor(Math.random() * 256))]);

    return { name, mimeType: 'video/webm', buffer: Buffer.concat([film, filler]) };
}

test('uploads a video in parts and asks for a file every browser plays', async ({ page }) => {
    const name = `roestung-${unique()}`;
    await signIn(page, '/cms/media');
    await page.waitForFunction(() => customElements.get('fb-upload') !== undefined);

    // Small parts, as on a server with a small post_max_size (decision 0177).
    await page.evaluate(() => document.querySelector('meta[name="fb-upload-part"]')?.setAttribute('content', '4096'));
    const parts: string[] = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname === '/cms/uploads') {
            parts.push(request.url());
        }
    });

    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Hochladen' }).click();
    await (await chooser).setFiles(clip(`${name}.webm`));
    await expect(page.getByText('Die Dateien sind hochgeladen.')).toBeVisible();
    expect(parts.length).toBeGreaterThanOrEqual(3);

    await page.getByRole('link', { name: `${name}.webm` }).click();
    await expect(page.getByRole('heading', { name: `${name}.webm` })).toBeVisible();
    await expect(page.getByText('WebM (vp9) · 640 × 360 px')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weitere Dateien' })).toBeVisible();
    await expect(page.getByText('Ergänz eine Datei als MP4 mit H.264 (avc1).')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Datei hinzufügen' })).toBeVisible();
    await expect(page.locator('fb-focus')).toHaveCount(0);
});

test('uploads an image, sets its focus and shows it on a published page', async ({ page, browser }) => {
    const name = `hafen-${unique()}`;
    await signIn(page, '/cms/media');
    await expect(page.getByRole('heading', { level: 1, name: 'Medien' })).toBeVisible();

    // Upload with the button and the file dialog of the browser, once the
    // script runs (before that the button does nothing).
    await page.waitForFunction(() => customElements.get('fb-upload') !== undefined);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Hochladen' }).click();
    const file = await photo(page, `${name}.jpg`);
    await (await chooser).setFiles(file);
    await expect(page.getByText('Die Dateien sind hochgeladen.')).toBeVisible();
    const tile = page.getByRole('link', { name: `${name}.jpg` });
    await expect(tile).toBeVisible();

    // The same file again under another name is not added a second time.
    const again = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Hochladen' }).click();
    await (await again).setFiles({ ...file, name: `${name}-kopie.jpg` });
    await expect(page.getByRole('status').filter({ hasText: `„${name}.jpg“ liegt schon in den Medien und wurde nicht noch einmal angelegt.` })).toBeVisible();
    await expect(page.getByRole('link', { name: `${name}-kopie.jpg` })).toHaveCount(0);

    // A file that is no image says so.
    const refused = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Hochladen' }).click();
    await (await refused).setFiles({ name: 'notiz.html', mimeType: 'text/html', buffer: Buffer.from('<p>Kaffee</p>') });
    await expect(page.getByRole('alert')).toContainText('notiz.html: Die Datei ist weder Bild (JPEG, PNG, WebP, GIF) noch Video (MP4, WebM) noch Dokument (PDF, Office, OpenDocument, Text, CSV, ZIP).');

    // Focus point by click, alternative text, tags.
    await tile.click();
    await expect(page.getByRole('heading', { name: `${name}.jpg` })).toBeVisible();
    const image = page.locator('fb-focus img');
    // The marker exists once the component runs, before that a click does nothing.
    await expect(page.getByRole('button', { name: /^Fokuspunkt: 50 % von links, 50 % von oben/ })).toBeVisible();
    const box = (await image.boundingBox())!;
    await image.click({ position: { x: box.width * 0.72, y: box.height * 0.35 } });
    const marker = page.getByRole('button', { name: /^Fokuspunkt: 72 % von links, 35 % von oben/ });
    await expect(marker).toBeFocused();
    await marker.press('ArrowDown');
    await expect(page.getByRole('button', { name: /^Fokuspunkt: 72 % von links, 40 % von oben/ })).toBeVisible();
    await page.getByRole('group', { name: 'Deutsch' }).getByLabel('Alternativtext').fill('Die Rösterei am Hafen');
    await page.getByLabel('Schlagwörter').fill('hafen\nröstung');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('Das Bild ist gespeichert.')).toBeVisible();
    await expect(image).toHaveAttribute('src', /\/2\/hafen-[0-9-]+-480x0-[0-9a-f]{16}\.(webp|jpg)$/);

    // On a new page: a section with the image widget, chosen in the editing mode.
    await page.goto('/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const slug = `bild-${unique()}`;
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-bohnenglueck/Page',
        parentId: start,
        translations: { de: { title: 'Bild', slug, content: { fields: { title: 'Bild' }, areas: { main: [
            { block: 'frootbox/theme-base/Section', areas: { first: [{ block: 'frootbox/theme-base/Image' }] } },
        ] } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;
    await page.goto(`/cms/pages/${id}`);
    await page.getByRole('button', { name: 'Auf der Website bearbeiten' }).click();
    await expect(page).toHaveURL(`/${slug}`);

    const field = page.locator('[data-fb-type="image"]');
    await field.click();
    const bar = page.locator('fb-editor-bar');
    const dialog = bar.getByRole('dialog', { name: 'Bild auswählen' });
    await dialog.getByLabel('Suchen').fill(name);
    await dialog.getByRole('button', { name: `${name}.jpg` }).click();
    await expect(dialog.getByRole('button', { name: `${name}.jpg` })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(field.locator('img')).toHaveAttribute('alt', 'Die Rösterei am Hafen');
    await expect(field).toBeFocused();

    // Not public before the page is published.
    const guest = await browser.newPage();
    const preview = await field.locator('img').getAttribute('src');
    expect((await guest.request.get(preview!)).status()).toBe(404);

    await page.goto(`/cms/pages/${id}`);
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);
    await guest.goto(`/${slug}`);
    const picture = guest.locator('.base-image picture');
    await expect(picture.locator('source').first()).toHaveAttribute('srcset', /\/media\/[0-9A-Z]{26}\/2\/hafen-[0-9-]+-160x0-[0-9a-f]{16}\.\w+ 160w/);
    const visible = picture.locator('img');
    await expect(visible).toHaveAttribute('alt', 'Die Rösterei am Hafen');
    await visible.scrollIntoViewIfNeeded();
    await expect.poll(() => visible.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    const fallback = await visible.getAttribute('src');
    const response = await guest.request.get(fallback!);
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('immutable');
    await guest.close();

    // Clean up: the page goes, the image stays in the library.
    expect((await action(page, 'page.unpublish', { id })).status).toBe(200);
    expect((await action(page, 'page.delete', { id })).status).toBe(200);
});
