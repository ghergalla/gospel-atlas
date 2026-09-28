import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath, URL} from 'node:url';

export default defineConfig({
  plugins: [react()],
  // Relative paths work both at a domain root and /gospel-atlas/ on GitHub Pages.
  base: './',
  server: {host: '0.0.0.0', allowedHosts: ['terminal.local']},
  resolve: {alias: {'@': fileURLToPath(new URL('.', import.meta.url))}},
  build: {outDir: 'docs', emptyOutDir: true},
});
