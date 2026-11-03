/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, ready, signIn } from './admin';

// SEO (decision 0223): the description of a page in its head, Open Graph,
// sitemap.xml and robots.txt for the demo of Bohnenglück, and the screen
// "SEO" that leads to the settings of a page without a description.

test('search engines and networks get what they need', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Kleine Kaffeerösterei am Hafen/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Bohnenglück');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

    await page.goto('/en/coffees');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Four coffees always on the shelf/);
    expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain('"@type":"BreadcrumbList"');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.headers()['content-type']).toBe('application/xml; charset=utf-8');
    const xml = await sitemap.text();
    expect(xml).toMatch(/<loc>http:\/\/127\.0\.0\.1:\d+\/sorten<\/loc>/);
    expect(xml).toContain('hreflang="en"');
    expect(xml).not.toMatch(/<loc>[^<]+\/en\/impressum<\/loc>/);

    expect(await (await request.get('/robots.txt')).text()).toMatch(/^User-agent: \*\nAllow: \/\n\nSitemap: http:\/\/127\.0\.0\.1:\d+\/sitemap\.xml\n$/);
});

test('an editor finds a page without a description and writes one', async ({ page }) => {
    await signIn(page, '/cms/seo');
    await expect(page.getByRole('heading', { name: 'SEO', level: 1 })).toBeVisible();
    const deutsch = page.getByRole('region', { name: 'Deutsch' });
    const impressum = deutsch.getByRole('listitem').filter({ hasText: 'Impressum' });
    await expect(impressum).toContainText('Keine Beschreibung.');

    await impressum.getByRole('link', { name: 'Impressum' }).click();
    await ready(page, 'fb-form');
    const id = new URL(page.url()).pathname.split('/').pop() ?? '';
    await page.getByLabel('Beschreibung für Suchmaschinen').fill('Wer hinter Bohnenglück steht: Anschrift, Kontakt und Verantwortliche für die Inhalte dieser Website.');
    await page.getByLabel('Beschreibung für Suchmaschinen').press('Tab');
    const saved = page.waitForResponse((response) => response.url().endsWith('/cms/actions/page.update') && response.ok());
    await page.locator('#page-description').locator('xpath=ancestor::form').getByRole('button', { name: 'Speichern' }).click();
    await saved;

    await page.goto('/cms/seo');
    await expect(page.getByRole('region', { name: 'Deutsch' }).getByRole('listitem').filter({ hasText: 'Keine Beschreibung.' }).filter({ hasText: 'Impressum' })).toHaveCount(0);

    // Leave the demo as it was for the other tests.
    expect((await action(page, 'page.discard', { id })).status).toBe(200);
});
