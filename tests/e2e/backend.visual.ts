/*
 * SPDX-License-Identifier: MIT
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
    test.setTimeout(60_000);
    await signIn(page, '/cms/design');

    // Building blocks in both modes side by side, then all tokens. The page
    // is very long, so two equal pictures take longer than the usual 5 s.
    await expect(page).toHaveScreenshot('design.png', { fullPage: true, timeout: 30_000 });
});

test('form with errors', async ({ page }) => {
    await signIn(page, '/cms/users/new');
    await page.getByRole('button', { name: 'Benutzer anlegen' }).click();
    await expect(page.locator('.fb-form__summary')).toBeFocused();

    await expect(page).toHaveScreenshot('user-errors.png', { fullPage: true });
});

test('missing page', async ({ page }) => {
    // Decision 0132: an old link inside the backend, e.g. after a reset.
    await signIn(page);
    await page.goto('/cms/pages/01JZZZZZZZZZZZZZZZZZZZZZZZ');
    await expect(page.getByRole('heading', { name: 'Das gibt es hier nicht (mehr)' })).toBeVisible();

    await expect(page).toHaveScreenshot('error-missing.png', { fullPage: true });
});
