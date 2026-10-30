import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base and one classic bundle, so `dist/` runs from any static host
// (including a claude.ai artifact) without a dev server.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    modulePreload: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/niyam.js',
        assetFileNames: 'assets/niyam[extname]',
      },
    },
  },
});
