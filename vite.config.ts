import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // ✅ subdomínio

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },

  // pode remover isso também; não é necessário
  // optimizeDeps: { exclude: ['lucide-react'] }
});
