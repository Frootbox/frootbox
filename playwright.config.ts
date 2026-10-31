/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { defineConfig, devices } from '@playwright/test';

// The browser tests run against a fresh installation of the demo website,
// built and served by tools/e2e.php. PHP is the PHP 8.5 binary to use.
//
// Two projects: "e2e" checks behavior and runs everywhere. "visual"
// compares screenshots of the backend with approved images; they are only
// valid in the Playwright container on Linux (CI or `npm run test:visual`),
// because fonts and rendering differ between systems.
const php = process.env.PHP ?? 'php';
// tools/visual.mjs runs the browser in a container and the server on the host.
const external = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: {
        baseURL: external ?? 'http://127.0.0.1:8100',
        trace: 'retain-on-failure',
    },
    snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',
    expect: {
        toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css' },
    },
    projects: [
        { name: 'e2e', testIgnore: /\.visual\.ts$/, use: { ...devices['Desktop Chrome'] } },
        ...(process.platform === 'linux'
            ? [{ name: 'visual', testMatch: /\.visual\.ts$/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }]
            : []),
    ],
    webServer: external
        ? undefined
        : {
              command: `"${php}" tools/e2e.php`,
              url: 'http://127.0.0.1:8100/',
              timeout: 300_000,
              // Always a fresh installation, the tests rely on its state.
              reuseExistingServer: false,
              stdout: 'ignore',
          },
});
