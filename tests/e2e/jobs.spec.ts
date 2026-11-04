/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { axeBuilder } from './axe';
import { action, signIn } from './admin';

// The jobs (decision 0231): the demo of Bohnenglück below "Jobs" with
// three jobs, filters without a script, a job with its structured data,
// an application with a CV through the form "Bewerbung", and a new job in
// the backend. A person needs at least 3 seconds for a form.

const human = 3_200;

const violations = async (page: Page) => {
    const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();

    return results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`));
};

test('visitors filter the jobs and apply with a CV', async ({ page }) => {
    await page.goto('/jobs');
    const items = page.locator('.jobs-item');
    for (const title of ['Barista (m/w/d)', 'Röster (m/w/d)', 'Ausbildung zur Fachkraft für Gastronomie (m/w/d)']) {
        await expect(items.getByRole('link', { name: title })).toBeVisible();
    }
    expect(await violations(page)).toEqual([]);

    await page.getByRole('navigation', { name: 'Art der Stelle' }).getByRole('link', { name: 'Ausbildung' }).click();
    await expect(page).toHaveURL(/\/jobs\?type=apprenticeship$/);
    await expect(items).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Ausbildung', exact: true })).toHaveAttribute('aria-current', 'page');

    await page.goto('/jobs');
    await page.getByRole('link', { name: 'Barista (m/w/d)' }).click();
    await expect(page).toHaveURL(/\/jobs\/barista-m-w-d$/);
    await expect(page.locator('.jobs-job .jobs-facts')).toContainText('Vollzeit, Teilzeit');
    const scripts = await page.locator('script[type="application/ld+json"]').evaluateAll((elements) => elements.map((element) => element.textContent ?? ''));
    const data = JSON.parse(scripts.find((script) => script.includes('"JobPosting"'))!);
    expect(data.title).toBe('Barista (m/w/d)');
    expect(data.employmentType).toEqual(['FULL_TIME', 'PART_TIME']);
    expect(data.baseSalary.value.unitText).toBe('MONTH');
    expect(await violations(page)).toEqual([]);

    const form = page.locator('form.forms__form');
    await form.getByLabel('Name').fill('Ada Lovelace');
    await form.getByLabel('E-Mail').fill('ada@example.org');
    await form.getByLabel('Lebenslauf und Zeugnisse').setInputFiles({ name: 'Lebenslauf.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%Lebenslauf\n') });
    await form.getByLabel('Ich bin einverstanden').check();
    await page.waitForTimeout(human);
    await form.getByRole('button', { name: 'Bewerbung senden' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Danke für Deine Bewerbung!' })).toBeFocused();

    // The entry names the job.
    await signIn(page, '/cms/forms');
    await page.getByRole('link', { name: 'Bewerbung', exact: true }).click();
    await page.getByRole('tab', { name: /^Einsendungen/ }).click();
    const entry = page.locator('details').first();
    await expect(entry).toContainText('Betrifft');
    await expect(entry).toContainText('Barista (m/w/d)');
    await expect(entry.getByRole('link', { name: 'Lebenslauf.pdf' })).toBeVisible();
});

test('an editor creates and publishes a job', async ({ page }) => {
    const title = `Küchenhilfe ${Date.now()}`;
    await signIn(page, '/cms/vacancies');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stellenangebote');

    await page.getByRole('link', { name: 'Neue Stelle' }).first().click();
    await page.getByLabel('Titel').fill(title);
    await page.getByLabel('Minijob').check();
    await page.getByLabel('Standort').selectOption({ label: 'Café am Hafen' });
    await page.getByRole('button', { name: 'Als Entwurf speichern' }).click();
    await expect(page).toHaveURL(/\/cms\/vacancies\/[0-9A-Z]{26}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    const id = page.url().split('/').pop()!;
    expect(await violations(page)).toEqual([]);

    await page.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-page-header')).toContainText('Veröffentlicht');

    await page.goto('/jobs?type=mini-job');
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    await page.goto('/cms/vacancies');
    expect((await action(page, 'frootbox/jobs/job.delete', { id })).status).toBe(200);
});
