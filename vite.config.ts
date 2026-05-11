import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    // dev 전용: /api 호출을 라이브 EC2 backend로 프록시.
    // VITE_BACKEND_URL을 빈 문자열로 두면 axios baseURL이 비어 relative URL이 되고
    // 이 proxy가 잡아 EC2로 전달한다 → 브라우저 origin은 localhost지만 CORS 회피.
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
