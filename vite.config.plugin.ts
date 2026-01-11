import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyDir: false,
    lib: {
      entry: resolve(__dirname, 'src/plugin/controller.ts'),
      name: 'code',
      fileName: () => 'code.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'code.js',
      },
    },
    target: 'es2017',  // Important!
    minify: false,     // Easier to debug
  },
});