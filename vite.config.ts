import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        id : '/',
        name: 'SHOW-GY',
        short_name: 'SHOW-GY',
        description: 'SHOW-GY PWA App',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation : 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'education', 'utilities'],

        icons: [
          {
            src: '/icons/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],

        screenshots: [
          {
            src: '/screenshots/desktop-1.jpeg',
            sizes: '1280x720',
            type: 'image/jpeg',
            form_factor: 'wide',
          },
          {
            src: '/screenshots/mobile-1.jpeg',
            sizes: '390x844',
            type: 'image/jpeg',
            form_factor: 'narrow',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  base: '/',

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.show-gy.com',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },

  css: {
    devSourcemap: false,
  },

  optimizeDeps: {
    include: ['quill-mention'],
  },

  build: {
    outDir: 'docs',
    emptyOutDir: true,
    sourcemap: false,
  },
});
