/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test } from '@playwright/test';
import { LIBRARY, PAGES } from './library';

// Head, foot and layouts of the base theme (decision 0162), on its sample
// website. Its look is checked by library.visual.ts.

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

    await expect(navigation.getByRole('link', { name: 'Überschrift' })).toBeHidden();
    await navigation.getByText('Widgets').click();
    await navigation.getByRole('link', { name: 'Überschrift' }).click();

    await expect(page).toHaveURL(/\/heading$/);
    await expect(page.getByRole('navigation', { name: 'Brotkrumen' }).getByRole('link', { name: 'Startseite' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Überschrift');
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
    await expect(page.getByRole('list', { name: 'Sprache' })).toBeVisible();

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
    await page.goto(PAGES.text);

    await expect.poll(() => page.evaluate(async () => {
        await document.fonts.ready;

        return document.fonts.check('16px "Noto Sans"');
    })).toBe(true);
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)).toMatch(/^"Noto Sans", "Noto Sans Fallback"/);
});
