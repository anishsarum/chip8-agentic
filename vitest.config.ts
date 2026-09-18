import { fileURLToPath, URL } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'apps/e2e/**'],
  },
  resolve: {
    alias: {
      '@chip8/contracts': fileURLToPath(
        new URL('./packages/contracts/src/index.ts', import.meta.url),
      ),
    },
  },
});
