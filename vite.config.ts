import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'lucide-react'
      ],
      output: {
        format: 'esm'
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});