import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.JPG', '**/*.jpg', '**/*.png'], // Handles capital asset extensions
  test: {
    globals: true, // Enables describe, it, expect globally without importing
    environment: 'jsdom', // Provides browser APIs like localStorage and window
    setupFiles: './src/setupTests.js',
  },
});