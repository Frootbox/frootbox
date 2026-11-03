/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// Pages that show a space of a plugin (decision 0232): an admin chooses
// it in the settings of a page, also a new space; the objects of that
// space get their addresses below the page, and the screen of the module
// shows a tab for each space.

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
