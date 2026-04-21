import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // ✅ subdomain deployment

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    // ✅ QUALITY FIX: Automatically strip all console.log & debugger statements in production builds
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
