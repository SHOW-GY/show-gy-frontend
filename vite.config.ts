import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/show-gy-frontend/',
  server: { port: 5173 },
  css: {
    devSourcemap: false,
  },
  optimizeDeps: {
    include: ['quill-mention'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
