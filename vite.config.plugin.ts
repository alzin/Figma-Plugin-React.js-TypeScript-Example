import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/plugin/controller.ts'),
      formats: ['iife'],
      name: 'plugin',
      fileName: () => 'code.js',
    },
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});