/*
 * SPDX-License-Identifier: MIT
 */

import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { action, signIn } from './admin';

// The forms (decision 0222): the demo form below "Schreib uns" sent with
// and without JavaScript, errors at the fields, building and publishing a
// form in the backend, and reading its entries. A person needs at least 3
// seconds for a form, so the tests wait before sending. New forms have
// unique titles, so retries find no leftovers. Forms ask for a proof of
// work by standard (decision 0261), so a test that posts by itself solves
// one as the browser would.

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const human = 3_200;

async function proof(page: Page, id: string): Promise<Record<string, string>> {
    const { data } = await (await page.request.get(`/_forms/proof/${id}`)).json();

    for (let number = 0; number <= data.max; number++) {
        if (createHash('sha256').update(data.salt + number).digest('hex') === data.challenge) {
            return { 'captcha[task]': data.task, 'captcha[number]': String(number) };
        }
    }

    throw new Error('The task has no solution.');
}

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

    // After the failed try a fresh proof of work goes with the form (decision 0261).
    await page.getByLabel('E-Mail').fill('ada@example.org');
    const request = page.waitForRequest((sent) => sent.url().endsWith('/_forms/submit'));
    await page.getByRole('button', { name: 'Nachricht senden' }).click();
    expect((await request).postData()).toMatch(/name="captcha\[number\]"\r\n\r\n\d+\r\n/);
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

    // The fields are a tab of their own (decision 0235); it stays open while they change.
    await page.getByRole('tab', { name: /^Felder/ }).click();
    await expect(page).toHaveURL(new RegExp(`/cms/forms/${id}#fields$`));

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
    await expect(page.getByRole('tab', { name: /^Felder/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: /^Felder/ })).toHaveAccessibleName('Felder 2');

    await page.getByRole('button', { name: 'Veröffentlichen' }).click();
    await expect(page.locator('.fb-page-header')).toContainText('Veröffentlicht');

    // A visitor sends it, as the website would.
    const token = (await (await page.request.get(`/_forms/token/${id}`)).json()).data.token;
    await page.waitForTimeout(human);
    const sent = await page.request.post('/_forms/submit', {
        headers: { Accept: 'application/json' },
        form: { _form: id, _language: 'de', _token: token, 'values[telefonnummer]': '040 1234567', 'values[name]': 'Ada', ...(await proof(page, id)) },
    });
    expect(sent.status()).toBe(200);

    await page.reload();
    await page.getByRole('tab', { name: 'Einsendungen 1' }).click();
    await expect(page).toHaveURL(new RegExp(`/cms/forms/${id}/entries\\?language=de$`));
    await expect(page.locator('details').first()).toContainText('040 1234567');
    const csv = await page.request.get(`/cms/forms/${id}/entries.csv`);
    expect(csv.headers()['content-type']).toBe('text/csv; charset=utf-8');
    expect(await csv.text()).toContain('"Telefonnummer","Name"');

    expect((await action(page, 'frootbox/forms/form.delete', { id })).status).toBe(200);
});

test('the parts of a form are tabs that keep their place, unsaved changes and errors', async ({ page }) => {
    await signIn(page, '/cms/forms');
    const created = await action(page, 'frootbox/forms/form.create', { translations: { de: { title: `Reiter ${unique()}` } }, recipients: [] });
    expect(created.status).toBe(200);
    const id = created.body.data.id;
    await page.goto(`/cms/forms/${id}`);

    const bar = page.getByRole('tablist', { name: 'Teile des Formulars' });
    await expect(bar.getByRole('tab')).toHaveCount(6);
    const entries = bar.getByRole('tab', { name: /^Einsendungen/ });
    const texts = bar.getByRole('tab', { name: /^Texte/ });
    const fields = bar.getByRole('tab', { name: /^Felder/ });
    const recipients = bar.getByRole('tab', { name: /^Empfänger/ });
    const more = bar.getByRole('tab', { name: /^Weiteres/ });
    await expect(texts).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: /^Texte/ })).toBeVisible();
    await expect(page.getByLabel('E-Mail-Adressen')).toBeHidden();
    await expect(fields).toHaveAccessibleName('Felder 0');

    // Arrow keys switch, the address follows without an entry in the history.
    await texts.focus();
    await page.keyboard.press('ArrowRight');
    await expect(fields).toBeFocused();
    await expect(fields).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(new RegExp(`/cms/forms/${id}#fields$`));
    await page.keyboard.press('End');
    await expect(more).toBeFocused();
    await expect(page.getByRole('button', { name: 'Formular löschen' })).toBeVisible();
    // The entries are a tab to their own screen (decision 0237): the arrows only reach it.
    await page.keyboard.press('ArrowRight');
    await expect(entries).toBeFocused();
    await expect(entries).toHaveAttribute('aria-selected', 'false');
    await expect(more).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(new RegExp(`/cms/forms/${id}#more$`));
    await page.keyboard.press('ArrowRight');
    await expect(texts).toBeFocused();

    // A reload and the languages in the header keep the tab.
    await recipients.click();
    await page.reload();
    await expect(recipients).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('E-Mail-Adressen')).toBeVisible();
    const languages = page.getByRole('navigation', { name: 'Sprachen' });
    await expect(languages.getByRole('link', { name: 'Deutsch' })).toHaveAttribute('aria-current', 'page');
    await expect(languages.getByRole('link', { name: 'English' })).toHaveAttribute('href', new RegExp(`/cms/forms/${id}\\?language=en#recipients$`));

    // A changed field puts a dot on its tab, which another tab shows too.
    await page.getByLabel('E-Mail-Adressen').fill('kein-mail');
    await texts.click();
    await expect(recipients).toHaveAccessibleDescription('Nicht gespeichert');
    await expect(recipients.locator('.fb-tabs__dot')).toBeVisible();

    // An error replaces the dot with the number of fields to check.
    await recipients.click();
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('„kein-mail“ ist keine E-Mail-Adresse.').first()).toBeVisible();
    await expect(recipients).toHaveAccessibleDescription('Fehler: 1');
    await expect(recipients.locator('.fb-tabs__dot')).toBeHidden();

    // Saved, the tab is calm again and stays open after the part is loaded again.
    await page.getByLabel('E-Mail-Adressen').fill('team@example.org');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.locator('.fb-toast')).toHaveText('Gespeichert');
    await expect(recipients).toHaveAttribute('aria-selected', 'true');
    await expect(recipients).toHaveAccessibleDescription('');
    await expect(page.getByLabel('E-Mail-Adressen')).toHaveValue('team@example.org');

    // The entries share the header and the bar; their tabs lead back to the parts of the form.
    await expect(entries).toHaveAccessibleName('Einsendungen 0');
    await entries.click();
    await expect(page).toHaveURL(new RegExp(`/cms/forms/${id}/entries\\?language=de$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Reiter /);
    await expect(entries).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: /^Einsendungen/ })).toContainText('Noch keine Einsendungen');
    await bar.getByRole('tab', { name: 'Felder 0' }).click();
    await expect(page).toHaveURL(new RegExp(`/cms/forms/${id}\\?language=de#fields$`));
    await expect(fields).toHaveAttribute('aria-selected', 'true');

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
    for (const [key, value] of Object.entries({ _form: id, _language: 'de', _token: token, 'values[name]': 'Ada', ...(await proof(page, id)) })) {
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

test('an entry without a proof of work waits in the spam folder until it is no spam', async ({ page }) => {
    await signIn(page, '/cms/forms');
    const created = await action(page, 'frootbox/forms/form.create', { translations: { de: { title: `Spam ${unique()}` } }, recipients: ['team@example.org'] });
    expect(created.status).toBe(200);
    const id = created.body.data.id;
    expect((await action(page, 'frootbox/forms/form.field-add', { id, type: 'text', translations: { de: { label: 'Name' } }, required: true })).status).toBe(200);
    expect((await action(page, 'frootbox/forms/form.publish', { id })).status).toBe(200);

    // A script without a browser solves no proof of work, but sees the thanks.
    const token = (await (await page.request.get(`/_forms/token/${id}`)).json()).data.token;
    await page.waitForTimeout(human);
    const sent = await page.request.post('/_forms/submit', { headers: { Accept: 'application/json' }, form: { _form: id, _language: 'de', _token: token, 'values[name]': 'Bot' } });
    expect(sent.status()).toBe(200);

    await page.goto(`/cms/forms/${id}/entries`);
    const folders = page.getByRole('navigation', { name: 'Ordner' });
    await expect(folders.getByRole('link', { name: 'Eingang (0)' })).toHaveAttribute('aria-current', 'page');
    await folders.getByRole('link', { name: 'Spam (1)' }).click();
    await expect(page.locator('details').first()).toContainText('Der Rechenbeweis fehlt.');
    await page.getByRole('button', { name: 'Kein Spam' }).click();
    await page.getByRole('dialog', { name: 'Kein Spam?' }).getByRole('button', { name: 'In den Eingang' }).click();
    await expect(page.locator('.fb-toast')).toHaveText('Die Einsendung ist im Eingang.');
    await expect(folders.getByRole('link', { name: 'Eingang (1)' })).toBeVisible();

    // The form chooses another captcha in its own tab.
    await page.goto(`/cms/forms/${id}#spam`);
    await expect(page.getByRole('radio', { name: /^Standard der Website/ })).toBeChecked();
    await page.getByRole('radio', { name: /^Rechenaufgabe/ }).check();
    await page.getByRole('tabpanel', { name: /^Spam-Schutz/ }).getByRole('button', { name: 'Speichern' }).click();
    await expect(page.locator('.fb-toast')).toHaveText('Gespeichert');
    await page.reload();
    await expect(page.getByRole('radio', { name: /^Rechenaufgabe/ })).toBeChecked();

    expect((await action(page, 'frootbox/forms/form.delete', { id })).status).toBe(200);
});
