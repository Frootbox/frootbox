/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { expect, type Page } from '@playwright/test';

// The superuser of the test installation. tools/e2e.php passes the
// password to the installer as FROOTBOX_ADMIN_PASSWORD.
export const ADMIN = { email: 'admin@example.test', password: 'e2e-kaffeebohne-42' };

export async function signIn(page: Page, next = '/cms'): Promise<void> {
    await page.goto(next);
    await page.getByLabel('E-Mail').fill(ADMIN.email);
    await page.getByLabel('Passwort').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page).toHaveURL(next);
}
