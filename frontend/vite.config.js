import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Vitest 1.x runs on its own Vite 5 (esbuild), which defaults to the classic JSX transform and
  // would need `import React` in every component. Use the automatic runtime under tests only.
  ...(mode === 'test' ? { esbuild: { jsx: 'automatic' } } : {}),

  assetsInclude: [
    '**/*.JPG',
    '**/*.jpg',
    '**/*.png'
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
}));
