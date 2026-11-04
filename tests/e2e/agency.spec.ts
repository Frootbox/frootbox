/*
 * SPDX-License-Identifier: MIT
 */

import { expect, test, type Page } from '@playwright/test';
import { axeBuilder } from './axe';
import { signIn } from './admin';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// The test design of an agency (decisions 0164, 0212): the static page in
// tests/Fixtures/Themes/agency/design/ and the same page from Frootbox
// with the child theme around it, built by `tools/e2e.php --agency`.
// Both come from the same browser, so the images match on every system.
// The child also hides blocks of the library, brings one of its own and
// stays accessible.

export const AGENCY = process.env.PLAYWRIGHT_AGENCY_URL ?? 'http://127.0.0.1:8102';

const DESIGN = pathToFileURL(resolve('tests/Fixtures/Themes/agency/design/index.html')).href;

const widths = { wide: { width: 1280, height: 800 }, narrow: { width: 390, height: 844 } };

// A pixel differs when a channel is off by more than this, which leaves
// room for the smoothing of edges; at most this share of pixels may differ.
const CHANNEL = 32;
const SHARE = 0.0005;

test.use({ baseURL: AGENCY });

/** An image of the whole page once its fonts are there. */
async function shoot(page: Page, url: string): Promise<Buffer> {
    expect((await page.goto(url))?.ok() ?? url.startsWith('file:')).toBe(true);
    await page.evaluate(() => document.fonts.ready);

    return page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
}

/** Compares two images in a canvas; the difference shows red on grey. */
async function compare(page: Page, expected: Buffer, actual: Buffer): Promise<{ width: number[]; height: number[]; share: number; diff: Buffer }> {
    await page.goto('about:blank');
    const result = await page.evaluate(
        async ([a, b, channel]) => {
            const load = async (data: string) => {
                const image = new Image();
                image.src = `data:image/png;base64,${data}`;
                await image.decode();

                return image;
            };
            const [first, second] = await Promise.all([load(a), load(b)]);
            const width = Math.max(first.width, second.width);
            const height = Math.max(first.height, second.height);
            const pixels = (image: HTMLImageElement) => {
                const canvas = new OffscreenCanvas(width, height);
                const context = canvas.getContext('2d')!;
                context.fillStyle = '#ff00ff';
                context.fillRect(0, 0, width, height);
                context.drawImage(image, 0, 0);

                return context.getImageData(0, 0, width, height).data;
            };
            const [one, two] = [pixels(first), pixels(second)];
            const canvas = new OffscreenCanvas(width, height);
            const context = canvas.getContext('2d')!;
            const out = context.createImageData(width, height);
            let different = 0;

            for (let index = 0; index < one.length; index += 4) {
                const off = Math.max(Math.abs(one[index] - two[index]), Math.abs(one[index + 1] - two[index + 1]), Math.abs(one[index + 2] - two[index + 2])) > channel;
                const grey = (one[index] + one[index + 1] + one[index + 2]) / 3;
                different += off ? 1 : 0;
                out.data.set(off ? [255, 0, 0, 255] : [grey, grey, grey, 64], index);
            }

            context.putImageData(out, 0, 0);
            const blob = await canvas.convertToBlob({ type: 'image/png' });
            const bytes = new Uint8Array(await blob.arrayBuffer());
            let binary = '';
            bytes.forEach((byte) => (binary += String.fromCharCode(byte)));

            return { width: [first.width, second.width], height: [first.height, second.height], share: different / (width * height), diff: btoa(binary) };
        },
        [expected.toString('base64'), actual.toString('base64'), CHANNEL] as const,
    );

    return { ...result, diff: Buffer.from(result.diff, 'base64') };
}

for (const [name, viewport] of Object.entries(widths)) {
    test(`shows the design of the agency pixel for pixel, ${name}`, async ({ page }, info) => {
        await page.setViewportSize(viewport);
        const design = await shoot(page, DESIGN);
        const website = await shoot(page, '/');
        const result = await compare(page, design, website);

        // On a failure the three images lie in the results of the test.
        if (result.share > SHARE || result.height[0] !== result.height[1]) {
            for (const [label, body] of Object.entries({ design, website, difference: result.diff })) {
                const path = info.outputPath(`${label}.png`);
                await writeFile(path, body);
                await info.attach(label, { path, contentType: 'image/png' });
            }
        }

        expect(result.height[1], 'The page is as high as the design.').toBe(result.height[0]);
        expect(result.share, 'Share of pixels that differ').toBeLessThanOrEqual(SHARE);
    });
}

test('offers its own block and not the ones it hides', async ({ page }) => {
    await signIn(page, '/cms');
    const blocks: { name: string; offered: boolean }[] = await page.evaluate(async () => (await (await fetch('/cms/queries/block.list', { headers: { Accept: 'application/json' } })).json()).data);
    // Hidden blocks stay known for pages that have them, but are not offered.
    const offered = blocks.filter((block) => block.offered).map((block) => block.name);

    expect(offered).toContain('frootbox-test/theme-agency/ProjectGrid');
    expect(offered).toContain('frootbox/theme-base/Hero');
    for (const hidden of ['Slider', 'Video', 'Pricing', 'Testimonials']) {
        expect(offered).not.toContain(`frootbox/theme-base/${hidden}`);
    }
});

test('has no violations of accessibility', async ({ page }) => {
    for (const viewport of Object.values(widths)) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        const results = await (await axeBuilder(page)).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)).toEqual([]);
    }
});
