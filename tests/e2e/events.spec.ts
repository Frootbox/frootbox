/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { axeBuilder } from './axe';
import { signIn } from './admin';

// The events (decision 0227): the demo of Bohnenglück below "Termine"
// with three upcoming events and one past, an event with its place, map
// after consent and calendar file, and creating, publishing and deleting
// an event in the backend. Titles are unique, so retries find no leftovers.

// The website keeps its times in Europe/Berlin (app.timezone in the
// skeleton); the browser enters them in the same zone, also in CI.
test.use({ timezoneId: 'Europe/Berlin' });

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test('visitors see the upcoming events and open one', async ({ page }) => {
    await page.route(/openstreetmap\.org/, (route) => route.fulfill({ contentType: 'text/html', body: '<p>Karte</p>' }));
    await page.goto('/termine');

    const titles = page.locator('.events-item__title');
    await expect(titles).toHaveText(['Röstkurs', 'Verkostung neuer Sorten', 'Tage der offenen Rösterei']);

    const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);

    await page.getByRole('link', { name: 'Vergangene Termine' }).click();
    await expect(page).toHaveURL(/\/termine\?past=1$/);
    await expect(titles).toHaveText(['Latte-Art-Workshop']);

    await page.goto('/termine');
    await page.getByRole('link', { name: 'Röstkurs' }).click();
    await expect(page).toHaveURL(/\/termine\/roestkurs$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Röstkurs');
    await expect(page.locator('.events-event__place')).toContainText('Bahrenfelder Straße 80');
    expect(JSON.parse((await page.locator('.events-event script[type="application/ld+json"]').textContent()) ?? '{}')).toMatchObject({ '@type': 'Event', name: 'Röstkurs', location: { name: 'Rösterei' } });

    const calendar = await page.request.get(await page.getByRole('link', { name: 'In den Kalender eintragen' }).getAttribute('href') ?? '');
    expect(calendar.headers()['content-type']).toBe('text/calendar; charset=utf-8');
    expect(await calendar.text()).toContain('SUMMARY:Röstkurs');

    await expect(page.locator('fb-external iframe')).toHaveCount(0);
    await page.getByRole('button', { name: 'Inhalt laden' }).click();
    await expect(page.locator('fb-external[service="openstreetmap"] iframe')).toHaveAttribute('title', 'Karte: Rösterei');
});

test('an editor creates, publishes and deletes an event', async ({ page }) => {
    const title = `Konzert ${unique()}`;
    const day = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    const start = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}T19:30`;

    await signIn(page, '/cms/events');
    await expect(page.getByRole('link', { name: 'Termine' }).first()).toHaveAttribute('aria-current', 'page');
    await page.getByRole('link', { name: 'Neuer Termin' }).first().click();
    await expect(page).toHaveURL(/\/cms\/events\/new$/);

    await page.getByLabel('Titel').fill(title);
    await page.getByLabel('Veranstaltungsort').fill('Café am Hafen');
    await page.getByLabel('Beginn').fill(start);
    await page.getByLabel('Anschrift').fill('Hafenstraße 12, 20457 Hamburg');
    await page.getByRole('button', { name: 'Als Entwurf speichern' }).click();
    await expect(page).toHaveURL(/\/cms\/events\/[0-9A-Z]{26}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByLabel('Beginn')).toHaveValue(start);

    await page.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-page-header')).toContainText('Veröffentlicht');

    const visitor = await page.context().browser()!.newPage();
    const slug = title.toLowerCase().replace(/ /g, '-');
    await visitor.goto(`/termine/${slug}`);
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(visitor.locator('.events-event__when')).toContainText('19:30');
    await expect(visitor.locator('.events-event__place')).toContainText('Café am Hafen');

    await page.getByRole('button', { name: 'Termin löschen' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page).toHaveURL(/\/cms\/events$/);
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);

    expect((await visitor.goto(`/termine/${slug}`))!.status()).toBe(410);
    await visitor.close();
});
