/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { axeBuilder } from './axe';
import { signIn } from './admin';

// Google Fonts (decision 0252): the screen "Fonts" under the website.
// The test never searches, so the server does not ask Google.

test('an admin finds the screen for fonts next to the design', async ({ page }) => {
    await signIn(page, '/cms/google-fonts');
    await expect(page.getByRole('heading', { name: 'Schriften', level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Hauptmenü' }).getByRole('link', { name: 'Schriften' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('region', { name: 'Auf dieser Website' })).toContainText('Noch keine Schriften');
    await expect(page.getByRole('region', { name: 'Google Fonts' })).toContainText('Der Server fragt Google Fonts erst, wenn Du suchst');
    await expect(page.getByRole('searchbox', { name: 'Suchen' })).toBeVisible();

    const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`))).toEqual([]);
});
