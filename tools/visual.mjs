/*
 * SPDX-License-Identifier: MIT
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

// The demo website and the base theme alone (decision 0163). Each in its
// own process group: tools/e2e.php starts the PHP server with its workers
// as children, and they all have to end with the run.
const servers = [
    spawn(php, ['tools/e2e.php'], { cwd: root, detached: true, env: { ...process.env, E2E_LISTEN: '0.0.0.0:8100' }, stdio: ['ignore', 'ignore', 'inherit'] }),
    spawn(php, ['tools/e2e.php', '--base'], { cwd: root, detached: true, env: { ...process.env, E2E_LISTEN: '0.0.0.0:8101' }, stdio: ['ignore', 'ignore', 'inherit'] }),
];
const stop = () => servers.forEach((server) => {
    try {
        process.kill(-server.pid, 'SIGTERM');
    } catch {
        // Already ended.
    }
});
process.on('SIGINT', () => {
    stop();
    process.exit(130);
});

let exitCode = 1;

try {
    await Promise.all([waitFor('http://127.0.0.1:8100/', 300_000), waitFor('http://127.0.0.1:8101/', 300_000)]);

    const result = spawnSync('docker', [
        'run', '--rm', '--ipc=host',
        '--add-host=host.docker.internal:host-gateway',
        '-v', `${root}:/work`, '-w', '/work',
        '-e', 'PLAYWRIGHT_BASE_URL=http://host.docker.internal:8100',
        '-e', 'PLAYWRIGHT_LIBRARY_URL=http://host.docker.internal:8101',
        '-e', 'CI',
        image,
        'npx', 'playwright', 'test', '--project=visual', ...process.argv.slice(2),
    ], { stdio: 'inherit' });

    exitCode = result.status ?? 1;
} finally {
    stop();
}

process.exit(exitCode);

async function waitFor(url, timeout) {
    const end = Date.now() + timeout;

    while (Date.now() < end) {
        const ended = servers.find((server) => server.exitCode !== null);

        if (ended) {
            throw new Error(`tools/e2e.php ended with ${ended.exitCode}.`);
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
