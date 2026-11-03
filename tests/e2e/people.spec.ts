/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

// People and locations (decision 0226) on the page "Team" of the demo of
// Bohnenglück: the team, two locations whose maps wait for consent
// (decisions 0224, 0225), all without violations of WCAG 2.2 AA. The page
// shows the people as a plugin with a profile for each (decision 0242).

const axe = async (page: Page) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);
};

test('shows the team and the locations with their maps after consent', async ({ page }) => {
    // Nothing reaches the provider in the test.
    await page.route(/openstreetmap\.org/, (route) => route.fulfill({ contentType: 'text/html', body: '<p>Karte</p>' }));
    await page.goto('/team');

    const team = page.locator('.people');
    await expect(team.getByRole('heading', { name: 'Wer wir sind' })).toBeVisible();
    await expect(team.locator('.people-card__name')).toHaveText(['Maria Rossi', 'Jonas Berger', 'Aylin Demir', 'Lukas Hansen']);
    await expect(team.getByRole('link', { name: 'maria@bohnenglueck.example' })).toHaveAttribute('href', 'mailto:maria@bohnenglueck.example');

    const harbour = page.locator('.people-location').filter({ hasText: 'Café am Hafen' });
    await expect(harbour.getByText('Hafenstraße 12')).toBeVisible();
    await expect(harbour.getByRole('heading', { name: 'Öffnungszeiten' })).toBeVisible();
    expect(JSON.parse((await harbour.locator('script[type="application/ld+json"]').textContent()) ?? '{}')).toMatchObject({ '@type': 'Place', name: 'Café am Hafen', geo: { latitude: 53.5444 } });

    await axe(page);

    // One consent for OpenStreetMap loads both maps.
    await expect(page.locator('fb-external iframe')).toHaveCount(0);
    await harbour.getByRole('checkbox', { name: 'OpenStreetMap immer laden' }).check();
    await harbour.getByRole('button', { name: 'Inhalt laden' }).click();
    await expect(page.locator('fb-external[service="openstreetmap"] iframe')).toHaveCount(2);
    await expect(harbour.locator('iframe')).toHaveAttribute('title', 'Karte: Café am Hafen');
});

test('links each person to a profile', async ({ page }) => {
    await page.goto('/team');
    await page.locator('.people').getByRole('link', { name: 'Maria Rossi' }).click();
    await expect(page).toHaveURL('/team/maria-rossi');
    await expect(page).toHaveTitle(/^Maria Rossi/);

    const profile = page.locator('.people-profile');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Maria Rossi');
    await expect(profile.getByText('Gründerin und Röstmeisterin')).toBeVisible();
    await expect(profile.getByText('Rösterei, Café am Hafen')).toBeVisible();
    expect(JSON.parse((await profile.locator('script[type="application/ld+json"]').textContent()) ?? '{}')).toMatchObject({ '@type': 'Person', name: 'Maria Rossi', jobTitle: 'Gründerin und Röstmeisterin' });
    await expect(page.locator('.people-location')).toHaveCount(0);
    await axe(page);

    await profile.getByRole('link', { name: 'Zum ganzen Team' }).click();
    await expect(page).toHaveURL('/team');
});
