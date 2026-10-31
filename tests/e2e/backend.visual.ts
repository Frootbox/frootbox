/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, test } from '@playwright/test';
import { signIn } from './admin';

// Screenshots of the backend, compared with the approved images in
// __screenshots__/ (decision 0113). Only valid in the Playwright container;
// new images come from `npm run test:visual -- --update-snapshots` or the
// workflow "Update screenshots".

for (const scheme of ['light', 'dark'] as const) {
    test(`sign-in, ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto('/cms/login');
        await page.getByLabel('E-Mail').blur();

        await expect(page).toHaveScreenshot(`login-${scheme}.png`);
    });

    test(`dashboard, ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await signIn(page);

        await expect(page).toHaveScreenshot(`dashboard-${scheme}.png`, { fullPage: true });
    });
}

test('design page', async ({ page }) => {
    await signIn(page, '/cms/design');

    // Building blocks in both modes side by side, then all tokens.
    await expect(page).toHaveScreenshot('design.png', { fullPage: true });
});

test('form with errors', async ({ page }) => {
    await signIn(page, '/cms/users/new');
    await page.getByRole('button', { name: 'Benutzer anlegen' }).click();
    await expect(page.locator('.fb-form__summary')).toBeFocused();

    await expect(page).toHaveScreenshot('user-errors.png', { fullPage: true });
});
