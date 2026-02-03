import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5173 },
  css: {
    devSourcemap: false,
  },

  build: {
    outDir: 'docs',
    emptyOutDir: true,
    sourcemap: false,
  },
});
