/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test } from '@playwright/test';

// Redirects, missing pages and the page cache, as a browser or a search
// engine meets them.

const redirects: Record<string, string> = {
    // "Über uns" was published as /roesterei first.
    '/roesterei': '/ueber-uns',
    '/en/roastery': '/en/about-us',
    // A manual redirect.
    '/shop': '/sorten',
    // No slash at the end.
    '/kontakt/': '/kontakt',
};

for (const [from, to] of Object.entries(redirects)) {
    test(`redirects ${from} to ${to}`, async ({ request }) => {
        const response = await request.get(from, { maxRedirects: 0 });

        expect(response.status()).toBe(301);
        expect(new URL(response.headers()['location'] ?? '', 'http://127.0.0.1:8100').pathname).toBe(to);
    });
}

test('follows a former address in the browser', async ({ page }) => {
    await page.goto('/roesterei');

    await expect(page).toHaveURL('/ueber-uns');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sechs Leute, eine Trommel');
});

test('answers 404 for unknown pages', async ({ page }) => {
    const response = await page.goto('/gibt-es-nicht');

    expect(response?.status()).toBe(404);
});

test('caches pages for visitors', async ({ request }) => {
    // Any change clears the cache, and the other tests change pages at the
    // same time. So a pair of requests may start over, each time on a host
    // of its own: the cache keeps hosts apart, a new one starts empty.
    let headers = {};

    await expect(async () => {
        headers = { Host: `cache-${Date.now()}-${Math.floor(Math.random() * 1000)}.test:8100` };
        const first = await request.get('/kontakt', { headers });
        expect(first.status()).toBe(200);
        expect(first.headers()['x-frootbox-cache']).toBe('miss');

        const second = await request.get('/kontakt?utm_source=test', { headers });
        expect(second.headers()['x-frootbox-cache']).toBe('hit');
        expect(await second.text()).toBe(await first.text());
    }).toPass({ timeout: 15_000 });

    const signedIn = await request.get('/kontakt', { headers: { ...headers, Authorization: 'Bearer test' } });
    expect(signedIn.headers()['x-frootbox-cache']).toBeUndefined();
});
