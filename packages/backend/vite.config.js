// Builds the scripts of the backend into assets/build (decision 0111).
//
// Entries keep fixed names, so PHP finds them without a manifest. Shared
// libraries stay outside: the browser loads them by name through the
// import map, so extensions use the same copy. Only the vendor entries
// bundle them.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const shared = ['lit', 'htmx.org', '@frootbox/ui'];
const vendor = resolve(import.meta.dirname, 'resources/js/vendor');

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'assets/build',
        emptyOutDir: true,
        target: 'es2022',
        modulePreload: false,
        reportCompressedSize: false,
        rolldownOptions: {
            input: {
                backend: resolve(import.meta.dirname, 'resources/js/backend.js'),
                ui: resolve(import.meta.dirname, 'resources/js/ui/index.js'),
                lit: resolve(vendor, 'lit.js'),
                htmx: resolve(vendor, 'htmx.js'),
            },
            external: (id, importer) => !importer?.startsWith(vendor)
                && shared.some((name) => id === name || id.startsWith(name + '/')),
            preserveEntrySignatures: 'strict',
            // htmx evaluates hx-on attributes on purpose.
            onLog: (level, log, handler) => log.code === 'EVAL' ? undefined : handler(level, log),
            output: {
                format: 'es',
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
            },
        },
    },
});
