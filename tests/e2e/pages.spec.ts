/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';

// The demo website of Bohnenglück from demo/site.yaml, in German and English.

test('shows the start page in German', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Bohnenglück');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kaffee, der nach Hamburg schmeckt.');
    const main = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(main.getByRole('link')).toHaveText(['Unsere Sorten', 'Über uns', 'Kontakt']);
});

test('shows the start page in English', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coffee that tastes of Hamburg.');
    const main = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(main.getByRole('link')).toHaveText(['Our coffees', 'About us', 'Contact']);
});

test('links to subpages in the language of the visitor', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('link', { name: 'Our coffees' }).first().click();

    await expect(page).toHaveURL('/en/coffees');
    await expect(page).toHaveTitle('Our coffees – Bohnenglück');
    await expect(page.getByRole('heading', { level: 2, name: 'Always on the shelf' })).toBeVisible();
});

test('switches the language on the same page', async ({ page }) => {
    await page.goto('/sorten');
    await page.getByRole('banner').getByRole('link', { name: 'English', exact: true }).click();

    await expect(page).toHaveURL('/en/coffees');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Our coffees');

    // The languages are also in the footer (decision 0195).
    await page.getByRole('contentinfo').getByRole('link', { name: 'Deutsch', exact: true }).click();
    await expect(page).toHaveURL('/sorten');
});

test('marks the current page in the navigation', async ({ page }) => {
    await page.goto('/ueber-uns');

    const main = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(main.getByRole('link', { name: 'Über uns' })).toHaveAttribute('aria-current', 'page');
    await expect(main.getByRole('link', { name: 'Unsere Sorten' })).not.toHaveAttribute('aria-current');
});

test('shows the way to the page as breadcrumb', async ({ page }) => {
    await page.goto('/en/coffees');

    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb.getByRole('listitem')).toHaveText(['Home', 'Our coffees']);
    await breadcrumb.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('/en');
});

test('shows the German text where a translation is missing', async ({ page }) => {
    await page.goto('/en/impressum');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'de');
    await expect(page.getByText('Bohnenglück Kaffeerösterei GmbH')).toBeVisible();
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'http://127.0.0.1:8100/impressum');
    // The English frame stays.
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
});

test('names the other languages for search engines', async ({ page }) => {
    await page.goto('/sorten');

    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'http://127.0.0.1:8100/sorten');
    const alternates = page.locator('link[rel=alternate]');
    await expect(alternates).toHaveCount(3);
    await expect(page.locator('link[rel=alternate][hreflang=de]')).toHaveAttribute('href', 'http://127.0.0.1:8100/sorten');
    await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute('href', 'http://127.0.0.1:8100/en/coffees');
    await expect(page.locator('link[rel=alternate][hreflang=x-default]')).toHaveAttribute('href', 'http://127.0.0.1:8100/sorten');
});

test('shows a missing page in the frame of the website', async ({ page }) => {
    const response = await page.goto('/gibt-es-nicht');

    // The status stays, search engines leave it out (decision 0189).
    expect(response?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seite nicht gefunden');
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Unsere Sorten' })).toBeVisible();

    await page.getByRole('link', { name: 'Zur Startseite' }).click();
    await expect(page).toHaveURL('/');
});

test('shows a missing page in the language of its address', async ({ page }) => {
    expect((await page.goto('/en/no-such-page'))?.status()).toBe(404);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    await page.getByRole('link', { name: 'To the start page' }).click();
    await expect(page).toHaveURL('/en');
});
