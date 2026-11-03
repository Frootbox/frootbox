/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Pages that show a space of a plugin (decision 0232): an admin chooses
// it in the settings of a page, also a new space; the objects of that
// space get their addresses below the page, and the screen of the module
// shows a tab for each space. With the switch for categories each
// category gets a page of its own below it (decision 0243). An entry
// moves to another space in its form, with publishing (decision 0244).

test('an admin lets a new page show a new space of the jobs', async ({ page }) => {
    const unique = `${Date.now()}`;
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const slug = `ausbildung-${unique}`;
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Ausbildung', slug, content: { fields: { title: 'Ausbildung' } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;

    await page.goto(`/cms/pages/${id}`);
    const section = page.locator('section[aria-labelledby="page-plugin-title"]');
    // The fields of a plugin show once it is chosen.
    const jobs = section.locator('[data-fb-when="type=frootbox/jobs/job"]');
    const spaces = jobs.getByLabel('Verwaltung', { exact: true });
    await expect(spaces).toBeHidden();
    await section.getByLabel('Inhalt aus einem Modul').selectOption({ label: 'Stellenangebote' });
    await expect(spaces).toBeVisible();
    await jobs.getByLabel('Oder eine neue Verwaltung').fill(`Azubis ${unique}`);
    await section.getByRole('button', { name: 'Speichern' }).click();
    await expect(spaces.locator('option:checked')).toHaveText(`Azubis ${unique}`);
    const space = await spaces.inputValue();
    expect(space).toMatch(/^[0-9A-Z]{26}$/);
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    const job = await action(page, 'frootbox/jobs/job.create', { translations: { de: { title: `Azubi ${unique}` } }, space });
    expect(job.status).toBe(200);
    expect((await action(page, 'frootbox/jobs/job.publish', { ids: [job.body.data.id] })).status).toBe(200);

    const visitor = await page.context().browser()!.newPage();
    await visitor.goto(`/${slug}`);
    await visitor.getByRole('link', { name: `Azubi ${unique}` }).click();
    await expect(visitor).toHaveURL(`/${slug}/azubi-${unique}`);
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(`Azubi ${unique}`);
    await visitor.close();

    await page.goto('/cms/vacancies');
    await expect(page.locator('.fb-tabs').getByRole('link', { name: 'Stellenangebote' })).toHaveAttribute('aria-current', 'page');
    await page.locator('.fb-tabs').getByRole('link', { name: `Azubis ${unique}` }).click();
    await expect(page.getByRole('link', { name: `Azubi ${unique}` })).toBeVisible();
});

test('the categories of a space get pages of their own with the switch', async ({ page, browser }) => {
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    const slug = `berufe-${unique}`;
    const created = await action(page, 'page.create', {
        layout: 'frootbox/theme-base/Page',
        parentId: start,
        translations: { de: { title: 'Berufe', slug, content: { fields: { title: 'Berufe' } } } },
    });
    expect(created.status).toBe(200);
    const id: string = created.body.data.id;

    await page.goto(`/cms/pages/${id}`);
    const section = page.locator('section[aria-labelledby="page-plugin-title"]');
    await section.getByLabel('Inhalt aus einem Modul').selectOption({ label: 'Stellenangebote' });
    const jobs = section.locator('[data-fb-when="type=frootbox/jobs/job"]');
    await jobs.getByLabel('Oder eine neue Verwaltung').fill(`Berufe ${unique}`);
    const switcher = jobs.getByLabel('Eigene Seiten für die Kategorien');
    await expect(switcher).not.toBeChecked();
    await switcher.check();
    await section.getByRole('button', { name: 'Speichern' }).click();
    const spaces = jobs.getByLabel('Verwaltung', { exact: true });
    await expect(spaces.locator('option:checked')).toHaveText(`Berufe ${unique}`);
    await expect(switcher).toBeChecked();
    const space = await spaces.inputValue();
    expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);

    // Two categories with jobs, so the list has a filter.
    const kitchen = await action(page, 'category.create', { group: 'frootbox/jobs/categories', translations: { de: { title: `Küche ${unique}`, description: 'Kochen und backen.' } } });
    const service = await action(page, 'category.create', { group: 'frootbox/jobs/categories', translations: { de: { title: `Service ${unique}` } } });
    expect(kitchen.status).toBe(200);
    expect(service.status).toBe(200);
    const ids: string[] = [];

    for (const [title, category] of [[`Koch ${unique}`, kitchen.body.data.id], [`Kellner ${unique}`, service.body.data.id]]) {
        const job = await action(page, 'frootbox/jobs/job.create', { translations: { de: { title } }, space, categories: [category] });
        expect(job.status).toBe(200);
        ids.push(job.body.data.id);
    }

    expect((await action(page, 'frootbox/jobs/job.publish', { ids })).status).toBe(200);

    // A context of its own, for axe.
    const context = await browser.newContext();
    const visitor = await context.newPage();
    await visitor.goto(`/${slug}`);
    await visitor.locator('.jobs-filter').getByRole('link', { name: `Küche ${unique}` }).click();
    await expect(visitor).toHaveURL(`/${slug}/kueche-${unique}`);
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(`Küche ${unique}`);
    await expect(visitor.locator('.jobs-list__intro')).toHaveText('Kochen und backen.');
    await expect(visitor.getByRole('link', { name: `Koch ${unique}` })).toBeVisible();
    await expect(visitor.getByRole('link', { name: `Kellner ${unique}` })).toHaveCount(0);
    await expect(visitor.locator('.jobs-filter').getByRole('link', { name: `Küche ${unique}` })).toHaveAttribute('aria-current', 'page');
    await expect(visitor.getByRole('navigation', { name: 'Brotkrumen' }).getByRole('link', { name: 'Berufe' })).toBeVisible();
    // The click only waits for the address; axe needs the styles.
    await visitor.waitForLoadState('load');
    const results = await new AxeBuilder({ page: visitor }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);
    await context.close();
});

test('a job moves to another space and its old address leads there', async ({ page }) => {
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await signIn(page, '/cms/pages');
    const start = await page.locator('#page-tree .fb-tree__item').first().getAttribute('data-id');
    // Two new pages with a new space each, so the jobs of the demo stay as they are.
    const pages: Record<string, { slug: string; space: string }> = {};

    for (const name of ['Praktikum', 'Lehre']) {
        const slug = `${name.toLowerCase()}-${unique}`;
        const created = await action(page, 'page.create', {
            layout: 'frootbox/theme-base/Page',
            parentId: start,
            translations: { de: { title: name, slug, content: { fields: { title: name } } } },
        });
        expect(created.status).toBe(200);
        const id: string = created.body.data.id;
        const assigned = await action(page, 'plugin.assign', { id, type: 'frootbox/jobs/job', newSpace: `${name} ${unique}` });
        expect(assigned.status).toBe(200);
        expect((await action(page, 'page.publish', { ids: [id] })).status).toBe(200);
        pages[name] = { slug, space: assigned.body.data.draft.plugin.space };
    }

    const job = await action(page, 'frootbox/jobs/job.create', { translations: { de: { title: `Röster ${unique}` } }, space: pages.Praktikum.space });
    expect(job.status).toBe(200);
    const jobId: string = job.body.data.id;
    expect((await action(page, 'frootbox/jobs/job.publish', { ids: [jobId] })).status).toBe(200);

    await page.goto(`/cms/vacancies/${jobId}`);
    const space = page.getByRole('combobox', { name: 'Verwaltung', exact: true });
    await expect(space.locator('option:checked')).toHaveText(`Praktikum ${unique}`);
    await space.selectOption({ label: `Lehre ${unique}` });
    const saved = page.waitForResponse((response) => response.url().endsWith('/frootbox/jobs/job.update') && response.ok());
    await space.locator('xpath=ancestor::form').getByRole('button', { name: 'Speichern' }).click();
    await saved;
    expect((await action(page, 'frootbox/jobs/job.publish', { ids: [jobId] })).status).toBe(200);

    const visitor = await page.context().browser()!.newPage();
    await visitor.goto(`/${pages.Praktikum.slug}/roester-${unique}`);
    await expect(visitor).toHaveURL(`/${pages.Lehre.slug}/roester-${unique}`);
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(`Röster ${unique}`);
    await visitor.close();
});
