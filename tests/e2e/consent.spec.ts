/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';

// The banner, the privacy settings and consent tools in the browser
// (decision 0264). The installation of the tests has no service on every
// page, so the page here is the markup the core writes for one, with the
// script of the core from the server.

const PAGE = '/_e2e/consent';
const SERVICE = 'acme/stats/counter';

function markup({ tool = false, proof = false } = {}): string {
    const version = 'data-consent-version="a1b2c3d4e5f6"' + (proof ? ' data-consent-proof' : '');
    const banner = tool
        ? `<fb-consent-banner class="consent-banner" tool="acme/consent/tool" ${version} hidden></fb-consent-banner>`
        : `<fb-consent-banner class="consent-banner" ${version} hidden><section class="consent-banner__inner" aria-labelledby="consent-banner-title"><p class="consent-banner__title" id="consent-banner-title">Dienste anderer Anbieter</p><ul class="consent-banner__services"><li data-consent-service="${SERVICE}" hidden>Counter (Acme Ltd, Statistik)</li><li data-consent-service="acme/chat/widget" hidden>Chat</li></ul><div class="consent-banner__actions"><button type="button" class="consent-banner__button" data-consent-reject>Alle ablehnen</button><button type="button" class="consent-banner__button" data-consent-settings>Einstellungen</button><button type="button" class="consent-banner__button" data-consent-accept>Alle annehmen</button></div></section></fb-consent-banner>`;
    const settings = `<fb-privacy-settings class="privacy-settings privacy-settings--floating" ${version}><button type="button" class="privacy-settings__button" hidden>Datenschutz-Einstellungen</button><dialog class="privacy-settings__dialog" aria-labelledby="privacy-settings-title"><form method="dialog"><p class="privacy-settings__title" id="privacy-settings-title">Datenschutz-Einstellungen</p><fieldset class="privacy-settings__group" data-consent-group="media"><legend>Medien</legend><ul><li data-consent-reach="content"><label><input type="checkbox" value="vimeo"> Vimeo</label></li></ul></fieldset><fieldset class="privacy-settings__group" data-consent-group="statistics"><legend>Statistik</legend><ul><li data-consent-reach="site"><label><input type="checkbox" value="${SERVICE}"> Counter</label></li></ul></fieldset>${proof ? '<p class="privacy-settings__id" data-consent-id hidden>Deine Einwilligungs-ID: <code></code></p>' : ''}<button type="submit" class="privacy-settings__done">Fertig</button></form></dialog></fb-privacy-settings>`;

    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Einwilligung</title>
<template data-fb-consent="${SERVICE}"><script>window.counted = (window.counted ?? 0) + 1;</script></template>
${tool ? '<script>window.frootboxConsentTool = { choices: {}, allowed(name) { return this.choices[name]; }, set(choices) { Object.assign(this.choices, choices); } };</script>' : ''}
<script type="module" src="/assets/frootbox/core/assets/external.js"></script></head>
<body>${banner}${settings}<main><h1>Einwilligung</h1><fb-external class="external" service="vimeo"><template><p class="loaded">Video</p></template><div class="external__notice"><div class="external__actions" hidden><button type="button" class="external__button" data-external-load>Inhalt laden</button><label class="external__always"><input type="checkbox" data-external-always> Vimeo immer laden</label></div></div></fb-external></main></body></html>`;
}

async function open(page: Page, options: { tool?: boolean; proof?: boolean } = {}): Promise<void> {
    await page.route(`**${PAGE}`, (route) => route.fulfill({ contentType: 'text/html', body: markup(options) }));
    await page.goto(PAGE);
}

const counted = (page: Page) => page.evaluate(() => (window as unknown as { counted?: number }).counted ?? 0);

test('asks once for a service on every page and loads it after consent', async ({ page }) => {
    await open(page);
    const banner = page.getByRole('region', { name: 'Dienste anderer Anbieter' });

    await expect(banner).toBeVisible();
    await expect(banner.getByText('Counter (Acme Ltd, Statistik)')).toBeVisible();
    await expect(banner.getByText('Chat')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Datenschutz-Einstellungen' })).toBeHidden();
    expect(await counted(page)).toBe(0);

    await banner.getByRole('button', { name: 'Alle annehmen' }).click();
    await expect(banner).toBeHidden();
    expect(await counted(page)).toBe(1);

    // The next page loads it without asking, and the floating button takes it back.
    await page.reload();
    await expect(banner).toBeHidden();
    expect(await counted(page)).toBe(1);
    await page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Datenschutz-Einstellungen' });
    await expect(dialog.getByRole('checkbox', { name: 'Counter' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Vimeo' })).toBeHidden();
    await expect(dialog.getByRole('group', { name: 'Medien' })).toBeHidden();
    await dialog.getByRole('checkbox', { name: 'Counter' }).uncheck();
    await dialog.getByRole('button', { name: 'Fertig' }).click();

    await page.reload();
    await expect(banner).toBeHidden();
    expect(await counted(page)).toBe(0);
});

test('rejecting is as easy as agreeing', async ({ page }) => {
    await open(page);
    const banner = page.getByRole('region', { name: 'Dienste anderer Anbieter' });

    await banner.getByRole('button', { name: 'Alle ablehnen' }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(banner).toBeHidden();
    expect(await counted(page)).toBe(0);

    // The settings stay at hand to agree later.
    await page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Datenschutz-Einstellungen' });
    await dialog.getByRole('checkbox', { name: 'Counter' }).check();
    expect(await counted(page)).toBe(1);
});

test('the banner opens the settings for a choice of its own', async ({ page }) => {
    await open(page);
    await page.getByRole('region', { name: 'Dienste anderer Anbieter' }).getByRole('button', { name: 'Einstellungen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Datenschutz-Einstellungen' });

    await expect(dialog.getByRole('checkbox', { name: 'Counter' })).not.toBeChecked();
    await dialog.getByRole('checkbox', { name: 'Counter' }).check();
    await dialog.getByRole('button', { name: 'Fertig' }).click();
    await expect(page.getByRole('region', { name: 'Dienste anderer Anbieter' })).toBeHidden();
    expect(await counted(page)).toBe(1);
});

test('takes over the choice of before', async ({ page }) => {
    await page.addInitScript(() => {
        if (!localStorage.getItem('frootbox:consent')) {
            localStorage.setItem('frootbox:external', JSON.stringify(['vimeo']));
        }
    });
    await open(page);

    await expect(page.locator('fb-external .loaded')).toHaveText('Video');
    const stored = await page.evaluate(() => localStorage.getItem('frootbox:consent'));
    expect(stored).toBeNull();
});

test('a consent tool decides instead of the banner', async ({ page }) => {
    await open(page, { tool: true });
    const banner = page.locator('fb-consent-banner');

    await expect(banner).toBeHidden();
    expect(await counted(page)).toBe(0);

    // The tool says yes, the script loads; "always load" goes to the tool.
    await page.evaluate((service) => {
        const consent = (window as unknown as { frootboxConsent: { tool: { choices: Record<string, boolean> }; changed(): void } }).frootboxConsent;
        consent.tool.choices[service] = true;
        consent.changed();
    }, SERVICE);
    expect(await counted(page)).toBe(1);

    await page.getByRole('checkbox', { name: 'Vimeo immer laden' }).check();
    await page.getByRole('button', { name: 'Inhalt laden' }).click();
    expect(await page.evaluate(() => (window as unknown as { frootboxConsent: { tool: { choices: Record<string, boolean> } } }).frootboxConsent.tool.choices.vimeo)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('frootbox:consent'))).toBeNull();
    await expect(banner).toBeHidden();
});

test('sends a proof of the choice when the website keeps one', async ({ page }) => {
    const proof = page.waitForRequest((request) => request.url().endsWith('/_consent/proof') && request.method() === 'POST');
    await open(page, { proof: true });
    await page.getByRole('region', { name: 'Dienste anderer Anbieter' }).getByRole('button', { name: 'Alle ablehnen' }).click();
    const sent = (await proof).postDataJSON() as { id: string; version: string; services: Record<string, boolean> };

    expect(sent.version).toBe('a1b2c3d4e5f6');
    expect(sent.services).toEqual({ [SERVICE]: false });
    expect(sent.id).toMatch(/^[0-9a-f-]{32,36}$/);

    // The visitor reads the ID in the settings, to ask about it.
    await page.getByRole('button', { name: 'Datenschutz-Einstellungen' }).click();
    await expect(page.getByRole('dialog').getByText('Deine Einwilligungs-ID:')).toContainText(sent.id);
});
