/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { DESIGN, LIBRARY, PAGES, designTest } from './library';

// Head, foot and layouts of the base theme (decision 0162), on its small
// sample website, and the blocks with a script on the design page
// (decision 0209). Their look is checked by library.visual.ts.

test.use({ baseURL: LIBRARY });

test('leads the keyboard to the content first', async ({ page }) => {
    await page.goto(PAGES.start);
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: 'Zum Inhalt springen' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#content$/);
});

test('opens the second level of the navigation without a script', async ({ page }) => {
    await page.goto(PAGES.start);
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });

    await expect(navigation.getByRole('link', { name: 'Unser Kaffee' })).toBeHidden();
    await navigation.getByText('Rösterei').click();
    await navigation.getByRole('link', { name: 'Unser Kaffee' }).click();

    await expect(page).toHaveURL(/\/kaffee$/);
    await expect(page.getByRole('navigation', { name: 'Brotkrumen' }).getByRole('link', { name: 'Startseite' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unser Kaffee');
});

test('shows the menu in the head on wide screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGES.start);

    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menü', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Menü schließen' })).toBeHidden();
});

test('opens the menu on small screens as a popover', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGES.start);
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const toggle = page.getByRole('button', { name: 'Menü', exact: true });

    await expect(navigation).toBeHidden();
    await toggle.click();
    await expect(navigation).toBeVisible();
    await expect(page.getByRole('banner').getByRole('list', { name: 'Sprache' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(navigation).toBeHidden();

    await toggle.click();
    await page.getByRole('button', { name: 'Menü schließen' }).click();
    await expect(navigation).toBeHidden();
});

test('keeps only the brand and the foot on a landing page', async ({ page }) => {
    await page.goto(PAGES.landing);

    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Menü', exact: true })).toHaveCount(0);
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Impressum' })).toBeVisible();
});

test('mirrors head and foot from right to left', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const brand = await page.locator('.base-header__brand').boundingBox();
    const menu = await page.locator('.base-header__menu').boundingBox();
    expect(brand!.x).toBeGreaterThan(menu!.x);
    await expect(page.getByRole('link', { name: 'انتقل إلى المحتوى' })).toBeAttached();

    // Latin letters among Arabic ones, like the brand, keep Noto Sans.
    expect(await page.locator('.base-header__brand').evaluate((element) => getComputedStyle(element).fontFamily)).toMatch(/^"Noto Sans Arabic", "Noto Sans"/);
});

test('loads Noto Sans from the theme', async ({ page }) => {
    await page.goto(PAGES.about);

    await expect.poll(() => page.evaluate(async () => {
        await document.fonts.ready;

        return document.fonts.check('16px "Noto Sans"');
    })).toBe(true);
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)).toMatch(/^"Noto Sans", "Noto Sans Fallback"/);
});

test('opens the hero image at once, as the heading of the start page', async ({ page }) => {
    await page.goto(PAGES.start);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Frisch geröstet am Hafen');
    const image = page.locator('.base-hero img');
    await expect(image).toHaveAttribute('loading', 'eager');
    await expect(image).toHaveAttribute('fetchpriority', 'high');
});

designTest('shows an image of the gallery large and browses with the keyboard', async ({ page }) => {
    await page.goto(DESIGN);
    const gallery = page.locator('base-gallery').first();
    const dialog = gallery.getByRole('dialog', { name: 'Bilder' });
    const opener = gallery.getByRole('button', { name: 'Goldenes Licht auf dunklem Rotbraun: Größer zeigen' });

    await opener.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('2 / 6')).toBeVisible();
    await expect(dialog.getByRole('img', { name: 'Goldenes Licht auf dunklem Rotbraun' })).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText('3 / 6')).toBeVisible();
    await dialog.getByRole('button', { name: 'Vorheriges Bild' }).click();
    await dialog.getByRole('button', { name: 'Vorheriges Bild' }).click();
    await expect(dialog.getByText('1 / 6')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
});

designTest('moves the image slider only with its buttons', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(DESIGN);
    const slider = page.locator('base-carousel').first();
    const track = slider.getByRole('list', { name: 'Bilder' });
    const previous = slider.getByRole('button', { name: 'Vorheriges Bild' });
    const next = slider.getByRole('button', { name: 'Nächstes Bild' });

    await expect(previous).toBeDisabled();
    await page.waitForTimeout(500);
    expect(await track.evaluate((element) => element.scrollLeft)).toBe(0);

    await next.click();
    await expect(previous).toBeEnabled();
    await expect.poll(() => track.evaluate((element) => Math.round(element.scrollLeft / element.clientWidth))).toBe(1);

    const images = await track.getByRole('listitem').count();
    expect(images).toBeGreaterThan(2);

    for (let i = 2; i < images; i++) {
        await expect(next).toBeEnabled();
        await next.click();
    }
    await expect(next).toBeDisabled();
});

designTest('shows a video with poster that starts only on request', async ({ page }) => {
    await page.goto(DESIGN);
    const video = page.locator('.base-video video').first();

    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('aria-label', 'Film: Lichtkreise ziehen über dunkles Braun');
    await expect(video).toHaveAttribute('poster', /\.(webp|jpg)$/);
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video.locator('source')).toHaveAttribute('type', /^video\/webm/);

    // The browser gets the film, with jumps, and nothing plays by itself.
    await video.evaluate((element: HTMLVideoElement) => element.load());
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);
    expect(await video.evaluate((element: HTMLVideoElement) => [element.paused, Math.round(element.duration)])).toEqual([true, 4]);
});

test('jumps to a section and keeps the jump bar in view', async ({ page }) => {
    await page.goto(PAGES.coffee);
    const bar = page.getByRole('navigation', { name: 'Auf dieser Seite' });
    await bar.getByRole('link', { name: 'Für Firmen' }).click();

    await expect(page).toHaveURL(/#fuer-firmen$/);
    const heading = page.getByRole('heading', { name: 'Kaffee fürs Büro' });
    await expect(heading).toBeInViewport();

    // The bar stays at the top and does not cover the heading (decision 0196).
    const barBox = (await bar.boundingBox())!;
    const headingBox = (await heading.boundingBox())!;
    expect(barBox.y).toBeLessThanOrEqual(1);
    expect(headingBox.y).toBeGreaterThanOrEqual(barBox.y + barBox.height);

    // The bar marks the section in view, and none above the first (decision 0200).
    await expect(bar.getByRole('link', { name: 'Für Firmen' })).toHaveAttribute('aria-current', 'true');
    await bar.getByRole('link', { name: 'Sorten und Abos' }).click();
    await expect(bar.getByRole('link', { name: 'Sorten und Abos' })).toHaveAttribute('aria-current', 'true');
    await expect(bar.locator('[aria-current]')).toHaveCount(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar.locator('[aria-current]')).toHaveCount(0);
});
