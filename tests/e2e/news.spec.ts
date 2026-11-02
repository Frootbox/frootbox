/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { ready, signIn } from './admin';

// The news (decisions 0219, 0220): the demo articles below "Aktuelles",
// an article with its own address and heading, the feed, and writing,
// publishing and deleting an article in the backend with the rich text
// and the languages. Titles are unique, so retries find no leftovers.

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test('visitors read the news and open an article', async ({ page }) => {
    await page.goto('/aktuelles');
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveCount(1);
    const article = page.getByRole('link', { name: 'Neue Ernte aus Peru' });
    await expect(article).toBeVisible();

    await article.click();
    await expect(page).toHaveURL(/\/aktuelles\/neue-ernte-aus-peru$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Neue Ernte aus Peru');
    await expect(page.locator('.base-breadcrumb [aria-current="page"]')).toHaveText('Neue Ernte aus Peru');

    const feed = await page.request.get(await page.locator('link[rel="alternate"][type="application/rss+xml"]').getAttribute('href') ?? '');
    expect(feed.status()).toBe(200);
    expect(await feed.text()).toContain('<title>Neue Ernte aus Peru</title>');
});

test('an editor writes, publishes and deletes an article', async ({ page }) => {
    const title = `Neue Sorte ${unique()}`;
    await signIn(page, '/cms/news');
    await expect(page.getByRole('link', { name: 'News' }).first()).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Neuer Artikel' }).first().click();
    await expect(page).toHaveURL(/\/cms\/news\/new$/);
    await ready(page, 'fb-rich-text');
    await page.getByLabel('Titel').fill(title);
    await page.getByLabel('Anriss').fill('Fruchtig und hell.');

    // The rich text: type, mark a word bold with the toolbar.
    const text = page.getByRole('textbox', { name: 'Text' });
    await text.click();
    await text.pressSequentially('Aus Kenia, ');
    await page.getByRole('button', { name: 'Fett' }).click();
    await text.pressSequentially('nur kurz');
    await expect(page.getByRole('button', { name: 'Fett' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Rösterei').check();

    await page.getByRole('button', { name: 'Als Entwurf speichern' }).click();
    await expect(page).toHaveURL(/\/cms\/news\/[0-9A-Z]{26}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator('.fb-page-header')).toContainText('Entwurf');
    await expect(page.locator('fb-rich-text strong')).toHaveText('nur kurz');
    await expect(page.getByLabel('Rösterei')).toBeChecked();

    await page.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-page-header')).toContainText('Veröffentlicht');

    const visitor = await page.context().browser()!.newPage();
    const slug = title.toLowerCase().replace(/ /g, '-');
    await visitor.goto(`/aktuelles/${slug}`);
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(visitor.locator('strong', { hasText: 'nur kurz' })).toBeVisible();

    await page.getByRole('button', { name: 'Artikel löschen' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page).toHaveURL(/\/cms\/news$/);
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);

    expect((await visitor.goto(`/aktuelles/${slug}`))!.status()).toBe(410);
    await visitor.close();
});

test('an article in Arabic is written from right to left', async ({ page }) => {
    const title = `Arabic ${unique()}`;
    await signIn(page, '/cms/news/new');
    await page.getByLabel('Titel').fill(title);
    await page.getByRole('button', { name: 'Als Entwurf speichern' }).click();
    await expect(page).toHaveURL(/\/cms\/news\/[0-9A-Z]{26}$/);

    await page.getByRole('tab', { name: 'العربية' }).or(page.getByRole('link', { name: 'العربية' })).first().click();
    await expect(page).toHaveURL(/language=ar$/);
    await page.getByRole('button', { name: 'Fassung in العربية anlegen' }).click();
    await expect(page.locator('#article-title')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#article-title')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('fb-rich-text')).toHaveAttribute('dir', 'rtl');

    // Throw the draft away again, it was never published.
    await page.getByRole('button', { name: 'Entwurf verwerfen' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Verwerfen' }).click();
    await expect(page).toHaveURL(/\/cms\/news$/);
});
