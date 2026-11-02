/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { signIn } from './admin';

// Account, users and roles (decision 0115): forms run actions through
// <fb-form>, errors appear at their field, the sign-in waits after too
// many failures. Names are unique, so retries find no leftovers.

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

async function createUser(page: Page, email: string, password?: string): Promise<void> {
    await page.goto('/cms/users/new');
    await page.getByLabel('Name').fill('Erika Muster');
    await page.getByLabel('E-Mail').fill(email);

    if (password) {
        await page.getByLabel('Passwort').fill(password);
    } else {
        await page.getByRole('button', { name: 'Passwort erzeugen' }).click();
    }

    await page.getByRole('checkbox', { name: /Editor/ }).check();
    await page.getByRole('button', { name: 'Benutzer anlegen' }).click();
    await expect(page).toHaveURL(/\/cms\/users\/\d+$/);
}

test('shows errors at the field and creates a user', async ({ page }) => {
    await signIn(page, '/cms/users/new');

    await page.getByRole('button', { name: 'Benutzer anlegen' }).click();

    const summary = page.locator('.fb-form__summary');
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('Prüf die markierten Felder.');
    await expect(summary.getByRole('listitem').first()).toHaveText('Name: ist ein Pflichtfeld.');
    await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Name')).toHaveAccessibleDescription('ist ein Pflichtfeld.');

    await page.getByLabel('Name').fill('Erika Muster');
    await page.getByLabel('E-Mail').fill(`erika-${unique()}@example.test`);
    await page.getByRole('button', { name: 'Passwort erzeugen' }).click();
    await expect(page.getByLabel('Passwort')).toHaveValue(/^[A-Za-z0-9]{16}$/);
    await page.getByRole('checkbox', { name: /Editor/ }).check();
    await page.getByRole('button', { name: 'Benutzer anlegen' }).click();

    await expect(page).toHaveURL(/\/cms\/users\/\d+$/);
    await expect(page.locator('.fb-toast')).toHaveText('Der Benutzer ist angelegt.');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Erika Muster');
    await expect(page.getByRole('checkbox', { name: /Editor/ })).toBeChecked();
});

test('deletes a user after asking', async ({ page }) => {
    await signIn(page, '/cms/users');
    await createUser(page, `delete-${unique()}@example.test`);

    await page.getByRole('button', { name: 'Benutzer löschen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Erika Muster löschen?' });
    await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeFocused();

    await dialog.getByRole('button', { name: 'Endgültig löschen' }).click();

    await expect(page).toHaveURL('/cms/users');
    await expect(page.locator('.fb-toast')).toHaveText('Der Benutzer ist gelöscht.');
});

test('says when the current password is wrong', async ({ page }) => {
    await signIn(page, '/cms/account');

    await page.getByLabel('Aktuelles Passwort').fill('falsch');
    await page.getByLabel('Neues Passwort').fill('ein langes neues Passwort');
    await page.getByRole('button', { name: 'Passwort ändern' }).click();

    await expect(page.getByLabel('Aktuelles Passwort')).toHaveAccessibleDescription('stimmt nicht.');
});

test('shows a new API token once and revokes it', async ({ page }) => {
    const name = `E2E ${unique()}`;
    await signIn(page, '/cms/account');

    await page.getByLabel('Neues Token für').fill(name);
    await page.getByRole('button', { name: 'Token erstellen' }).click();

    await expect(page.locator('.fb-secret')).toHaveText(/^fbx_/);
    await page.getByRole('link', { name: 'Fertig' }).click();

    await page.getByRole('button', { name: `${name} widerrufen` }).click();
    await expect(page.locator('.fb-toast')).toHaveText('Das Token ist widerrufen.');
    await expect(page.getByText(name)).toHaveCount(0);
});

test('checks the rules of a role', async ({ page }) => {
    const name = `e2e-${unique()}`;
    await signIn(page, '/cms/roles/new');

    await page.getByLabel('Kurzname').fill(name);
    await page.getByLabel('Titel').fill('E2E');
    await page.getByLabel('Rechte').fill('page.*\nPage.Create');
    await page.getByRole('button', { name: 'Rolle anlegen' }).click();
    await expect(page.getByLabel('Rechte')).toHaveAccessibleDescription(/„Page\.Create“ ist keine Regel/);

    await page.getByLabel('Rechte').fill('page.*\n-page.delete');
    await page.getByRole('button', { name: 'Rolle anlegen' }).click();
    await expect(page).toHaveURL(`/cms/roles/${name}`);
    await expect(page.getByLabel('Rechte')).toHaveValue('page.*\n-page.delete');

    await page.getByRole('button', { name: 'Rolle löschen' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page).toHaveURL('/cms/roles');
});

test('waits after too many failed sign-ins', async ({ page, browser }) => {
    const email = `throttle-${unique()}@example.test`;
    const password = 'ein-langes-passwort';
    await signIn(page, '/cms/users');
    await createUser(page, email, password);

    const guest = await browser.newPage();
    const attempt = async (secret: string) => {
        await guest.goto('/cms/login');
        await guest.getByLabel('E-Mail').fill(email);
        await guest.getByLabel('Passwort').fill(secret);
        await guest.getByRole('button', { name: 'Anmelden' }).click();
    };

    for (let i = 0; i < 5; i++) {
        await attempt('falsch');
        await expect(guest.getByRole('alert')).toHaveText('E-Mail oder Passwort ist falsch.');
    }

    // Now even the right password waits.
    await attempt(password);
    await expect(guest.getByRole('alert')).toHaveText('Zu viele Fehlversuche. Versuch es in einer Minute noch einmal.');
    await expect(guest).toHaveURL('/cms/login');
    await guest.close();
});
