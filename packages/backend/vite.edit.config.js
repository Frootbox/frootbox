// Builds the editing mode on the website into assets/build/edit.js
// (decision 0119). Theme pages have no import map, so this entry brings
// Lit along. It is a build of its own, so the entries of the backend
// keep loading Lit from lit.js alone, without a shared chunk.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'assets/build',
        emptyOutDir: false,
        target: 'es2022',
        modulePreload: false,
        reportCompressedSize: false,
        rolldownOptions: {
            input: { edit: resolve(import.meta.dirname, 'resources/js/edit.js') },
            output: {
                format: 'es',
                entryFileNames: '[name].js',
            },
        },
    },
});
