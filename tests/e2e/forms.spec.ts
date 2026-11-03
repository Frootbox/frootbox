/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from '@playwright/test';
import { action, signIn } from './admin';

// The forms (decision 0222): the demo form below "Schreib uns" sent with
// and without JavaScript, errors at the fields, building and publishing a
// form in the backend, and reading its entries. A person needs at least 3
// seconds for a form, so the tests wait before sending. New forms have
// unique titles, so retries find no leftovers.

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const human = 3_200;

test('a visitor sends the contact form with JavaScript', async ({ page }) => {
    await page.goto('/schreib-uns');
    const form = page.locator('form.forms__form');
    await expect(page.getByText('Mit * markierte Felder sind Pflicht.')).toBeVisible();

    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('E-Mail').fill('ada@b');
    await page.getByLabel('Worum geht es?').selectOption('Röstkurs');
    await page.getByLabel('Nachricht').fill('Gibt es im Dezember noch Plätze?');
    await page.getByLabel('Ich bin einverstanden').check();
    await page.waitForTimeout(human);

    // The browser accepts this address, the server does not: the error stands at the field.
    await page.getByRole('button', { name: 'Nachricht senden' }).click();
    await expect(page.getByText('Bitte gib eine E-Mail-Adresse ein, z. B. name@example.com.')).toBeVisible();
    await expect(page.getByLabel('E-Mail')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('E-Mail')).toBeFocused();

    await page.getByLabel('E-Mail').fill('ada@example.org');
    await page.getByRole('button', { name: 'Nachricht senden' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Danke! Wir antworten innerhalb eines Werktags.' })).toBeFocused();
    await expect(form).toHaveCount(0);
});

test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('a visitor sends the contact form and comes back to the page', async ({ page }) => {
        await page.goto('/schreib-uns');
        await page.getByLabel('Name').fill('Grace Hopper');
        await page.getByLabel('E-Mail').fill('grace@example.org');
        await page.getByLabel('Nachricht').fill('Ohne JavaScript.');
        await page.getByLabel('Ich bin einverstanden').check();
        await page.waitForTimeout(human);

        await page.getByRole('button', { name: 'Nachricht senden' }).click();
        await expect(page).toHaveURL(/\/schreib-uns\?fbForm=[0-9A-Z]{26}#form-[0-9A-Z]{26}$/);
        await expect(page.getByRole('status')).toHaveText('Danke! Wir antworten innerhalb eines Werktags.');
        await expect(page.locator('form.forms__form')).toHaveCount(0);
    });
});

test('the form keeps its language and direction on an Arabic page', async ({ page }) => {
    await page.goto('/ar/schreib-uns');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const section = page.locator('section.forms');
    expect(await section.evaluate((element) => getComputedStyle(element).direction)).toBe('ltr');
    await expect(section.getByRole('button', { name: 'Nachricht senden' })).toBeVisible();
});

test('an editor builds and publishes a form, an admin reads its entries', async ({ page }) => {
    const title = `Rückruf ${unique()}`;
    await signIn(page, '/cms/forms');
    await expect(page.getByRole('link', { name: 'Formulare' }).first()).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Neues Formular' }).first().click();
    await page.getByLabel('Titel').fill(title);
    await page.getByLabel('Empfänger').fill('team@example.org');
    await page.getByRole('button', { name: 'Als Entwurf speichern' }).click();
    await expect(page).toHaveURL(/\/cms\/forms\/[0-9A-Z]{26}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    const id = page.url().split('/').pop()!;

    for (const [type, label] of [['Text', 'Name'], ['Telefon', 'Telefonnummer']]) {
        await page.getByRole('button', { name: 'Feld hinzufügen' }).click();
        const dialog = page.getByRole('dialog', { name: 'Feld hinzufügen' });
        await dialog.getByLabel('Typ').selectOption({ label: type });
        await dialog.getByLabel('Beschriftung').fill(label);
        await dialog.getByLabel('Pflicht').check();
        await dialog.getByRole('button', { name: 'Hinzufügen' }).click();
        await expect(page.locator('#form-detail ol')).toContainText(label);
    }

    await page.getByRole('button', { name: 'Telefonnummer nach oben' }).click();
    await expect(page.locator('#form-detail ol li').first()).toContainText('Telefonnummer');

    await page.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-page-header')).toContainText('Veröffentlicht');

    // A visitor sends it, as the website would.
    const token = (await (await page.request.get(`/_forms/token/${id}`)).json()).data.token;
    await page.waitForTimeout(human);
    const sent = await page.request.post('/_forms/submit', {
        headers: { Accept: 'application/json' },
        form: { _form: id, _language: 'de', _token: token, 'values[telefonnummer]': '040 1234567', 'values[name]': 'Ada' },
    });
    expect(sent.status()).toBe(200);

    await page.reload();
    await page.getByRole('link', { name: '1 Einsendung' }).click();
    await expect(page).toHaveURL(new RegExp(`/cms/forms/${id}/entries$`));
    await expect(page.locator('details').first()).toContainText('040 1234567');
    const csv = await page.request.get(`/cms/forms/${id}/entries.csv`);
    expect(csv.headers()['content-type']).toBe('text/csv; charset=utf-8');
    expect(await csv.text()).toContain('"Telefonnummer","Name"');

    expect((await action(page, 'frootbox/forms/form.delete', { id })).status).toBe(200);
});

test('a visitor sends files with a form, only the backend hands them out', async ({ page }) => {
    await signIn(page, '/cms/forms');
    const created = await action(page, 'frootbox/forms/form.create', { translations: { de: { title: `Bewerbung ${unique()}` } }, recipients: ['team@example.org'] });
    expect(created.status).toBe(200);
    const id = created.body.data.id;
    for (const [type, label] of [['text', 'Name'], ['files', 'Lebenslauf']]) {
        expect((await action(page, 'frootbox/forms/form.field-add', { id, type, translations: { de: { label } }, required: true })).status).toBe(200);
    }
    expect((await action(page, 'frootbox/forms/form.publish', { id })).status).toBe(200);

    // A visitor sends it, as the website would without JavaScript.
    const token = (await (await page.request.get(`/_forms/token/${id}`)).json()).data.token;
    await page.waitForTimeout(human);
    const data = new FormData();
    for (const [key, value] of Object.entries({ _form: id, _language: 'de', _token: token, 'values[name]': 'Ada' })) {
        data.append(key, value);
    }
    data.append('files[lebenslauf][]', new Blob(['%PDF-1.4\n%Lebenslauf\n'], { type: 'application/pdf' }), 'Lebenslauf Ada.pdf');
    const sent = await page.request.post('/_forms/submit', { headers: { Accept: 'application/json' }, multipart: data });
    expect(sent.status()).toBe(200);

    await page.goto(`/cms/forms/${id}/entries`);
    const link = page.getByRole('link', { name: 'Lebenslauf Ada.pdf' });
    await expect(link).toBeVisible();
    const file = await page.request.get((await link.getAttribute('href'))!);
    expect(file.status()).toBe(200);
    expect(file.headers()['content-disposition']).toContain('attachment');
    expect(await file.text()).toContain('%Lebenslauf');

    // Without a session the file stays private.
    const guest = await page.context().browser()!.newContext();
    expect((await guest.request.get(`${new URL(page.url()).origin}${await link.getAttribute('href')}`, { maxRedirects: 0 })).status()).not.toBe(200);
    await guest.close();

    expect((await action(page, 'frootbox/forms/form.delete', { id })).status).toBe(200);
});
