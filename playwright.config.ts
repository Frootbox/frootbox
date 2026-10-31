/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

import { defineConfig, devices } from '@playwright/test';

// The browser tests run against a fresh installation of the demo website,
// built and served by tools/e2e.php. PHP is the PHP 8.5 binary to use.
const php = process.env.PHP ?? 'php';

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: {
        baseURL: 'http://127.0.0.1:8100',
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: `"${php}" tools/e2e.php`,
        url: 'http://127.0.0.1:8100/',
        timeout: 300_000,
        // Always a fresh installation, the tests rely on its state.
        reuseExistingServer: false,
        stdout: 'ignore',
    },
});
