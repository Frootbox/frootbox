/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

// Runs the screenshot tests (tests/e2e/*.visual.ts) in the Playwright
// container, the same one CI uses, so the images match (decision 0114).
// The server runs here with tools/e2e.php, the browser in the container.
//
//     npm run test:visual
//     npm run test:visual -- --update-snapshots
//
// Needs Docker or OrbStack, PHP 8.5 in PHP and Composer (COMPOSER_BINARY).

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(resolve(root, 'node_modules/@playwright/test/package.json'), 'utf8'));
const image = `mcr.microsoft.com/playwright:v${version}-noble`;
const php = process.env.PHP ?? 'php';

if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
    console.error('Docker is not running. Start Docker or OrbStack, or let the workflow "Update screenshots" make the images.');
    process.exit(1);
}

const server = spawn(php, ['tools/e2e.php'], {
    cwd: root,
    env: { ...process.env, E2E_LISTEN: '0.0.0.0:8100' },
    stdio: ['ignore', 'ignore', 'inherit'],
});

let exitCode = 1;

try {
    await waitFor('http://127.0.0.1:8100/', 300_000);

    const result = spawnSync('docker', [
        'run', '--rm', '--ipc=host',
        '--add-host=host.docker.internal:host-gateway',
        '-v', `${root}:/work`, '-w', '/work',
        '-e', 'PLAYWRIGHT_BASE_URL=http://host.docker.internal:8100',
        '-e', 'CI',
        image,
        'npx', 'playwright', 'test', '--project=visual', ...process.argv.slice(2),
    ], { stdio: 'inherit' });

    exitCode = result.status ?? 1;
} finally {
    server.kill();
}

process.exit(exitCode);

async function waitFor(url, timeout) {
    const end = Date.now() + timeout;

    while (Date.now() < end) {
        if (server.exitCode !== null) {
            throw new Error(`tools/e2e.php ended with ${server.exitCode}.`);
        }

        try {
            await fetch(url, { redirect: 'manual' });

            return;
        } catch {
            await new Promise((done) => setTimeout(done, 1000));
        }
    }

    throw new Error(`${url} did not answer within ${timeout / 1000} s.`);
}
