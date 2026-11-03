/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signIn } from './admin';

// Tags (decisions 0233, 0239): an editor types new words in the form of
// an article, visitors follow a tag to the filtered list, and the
// screen "Schlagwörter" merges and deletes them. Words are unique, so
// retries find no leftovers; the test deletes what it creates.

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test('an editor tags an article, visitors filter by it and the stock stays tidy', async ({ page }) => {
    const id = unique();
    const title = `Bohnen ${id}`;
    const beans = `Bohnenkunde ${id}`;
    const roast = `Röstgrad ${id}`;
    await signIn(page, '/cms/news/new');
    await page.getByLabel('Titel').fill(title);
    // The field is called "Schlagwörter" until there are tags to tick.
    await page.locator('#article-tags-new').fill(`${beans}, ${roast}`);
    await page.getByRole('button', { name: 'Als Entwurf speichern' }).click();
    await expect(page).toHaveURL(/\/cms\/news\/[0-9A-Z]{26}$/);
    const tags = page.getByRole('group', { name: /Schlagwörter/ });
    await expect(tags.getByRole('checkbox', { name: beans })).toBeChecked();
    await expect(tags.getByRole('checkbox', { name: roast })).toBeChecked();
    await expect(tags.getByLabel('Schlagwörter hinzufügen')).toHaveValue('');
    const article = page.url();

    await page.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-page-header')).toContainText('Veröffentlicht');

    const visitor = await page.context().browser()!.newPage();
    await visitor.goto(`/aktuelles/bohnen-${id}`);
    await visitor.getByRole('list', { name: 'Schlagwörter' }).getByRole('link', { name: beans }).click();
    await expect(visitor).toHaveURL(new RegExp(`/aktuelles\\?tag=bohnenkunde-${id}$`));
    await expect(visitor.getByText(`Artikel mit dem Schlagwort „${beans}“`)).toBeVisible();
    await expect(visitor.getByRole('link', { name: title })).toBeVisible();
    await expect(visitor.getByRole('link', { name: 'Neue Ernte aus Peru' })).toHaveCount(0);

    // Merge one word into the other, then the article has one tag.
    await page.goto(`/cms/tags?q=${id}`);
    const row = (label: string) => page.locator('.fb-list__item', { has: page.locator('.fb-list__title', { hasText: label }) });
    await expect(row(beans)).toContainText('1-mal verwendet');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);

    await row(roast).getByRole('button', { name: `„${roast}“ mit einem anderen Schlagwort zusammenführen` }).click();
    const merge = page.getByRole('dialog', { name: 'Mit einem anderen Schlagwort zusammenführen' });
    await merge.getByLabel('In').selectOption({ label: beans });
    await merge.getByRole('button', { name: 'Zusammenführen' }).click();
    await expect(row(roast)).toHaveCount(0);

    await page.goto(article);
    await expect(tags.getByRole('checkbox', { name: roast })).toHaveCount(0);
    await expect(tags.getByRole('checkbox', { name: beans })).toBeChecked();

    // Clean up: the article and the tag.
    await page.getByRole('button', { name: 'Artikel löschen' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page).toHaveURL(/\/cms\/news$/);
    await page.goto(`/cms/tags?q=${id}`);
    await row(beans).getByRole('button', { name: `„${beans}“ löschen` }).click();
    await page.getByRole('dialog', { name: 'Schlagwort löschen?' }).getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(row(beans)).toHaveCount(0);
    await visitor.close();
});
