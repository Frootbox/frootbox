/*
 * SPDX-License-Identifier: MIT
 */

import { expect, type Page } from '@playwright/test';

// The superuser of the test installation. tools/e2e.php passes the
// password to the installer as FROOTBOX_ADMIN_PASSWORD.
export const ADMIN = { email: 'admin@example.test', password: 'e2e-kaffeebohne-42' };

export async function signIn(page: Page, next = '/cms', account = ADMIN): Promise<void> {
    await page.goto(next);
    await page.getByLabel('E-Mail').fill(account.email);
    await page.getByLabel('Passwort').fill(account.password);
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page).toHaveURL(next);
}

/** Runs an action with the session of a page of the backend or the editing mode. */
export async function action(page: Page, name: string, input: object): Promise<{ status: number; body: any }> {
    return page.evaluate(async ([name, input]) => {
        const meta = (key: string) => document.querySelector(`meta[name="${key}"]`)?.getAttribute('content') ?? '';
        const response = await fetch(meta('fb-actions') + name, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': meta('fb-csrf') },
            body: JSON.stringify(input),
        });

        return { status: response.status, body: await response.json() };
    }, [name, input] as const);
}
