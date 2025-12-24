import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    webExtension({
      manifest: resolve(__dirname, 'src/manifest.json'),
      watchFilePaths: ['src/**/*'],
      browser: 'chrome',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  publicDir: 'src/icons',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
