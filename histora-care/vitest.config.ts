import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@stencil/core/internal/client': path.resolve(__dirname, 'src/testing/stencil-mock.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup-external.ts'],
  },
});
