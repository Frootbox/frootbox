/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

// The second installation of the browser tests: the base theme alone with
// its sample website (decision 0163), built by `tools/e2e.php --base`.
export const LIBRARY = process.env.PLAYWRIGHT_LIBRARY_URL ?? 'http://127.0.0.1:8101';

// The pages of packages/themes/base/demo/library.yaml.
export const PAGES = {
    start: '/',
    heading: '/heading',
    text: '/text',
    button: '/button',
    section: '/section',
    prose: '/text-with-heading',
    quote: '/quote',
    notice: '/notice',
    divider: '/divider',
    cta: '/call-to-action',
    figures: '/key-figures',
    landing: '/aktion',
};
