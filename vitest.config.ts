import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@modules/interface': resolve(__dirname, 'src/modules/interface/index.ts'),
      '@modules/pubsub': resolve(__dirname, 'src/modules/pubsub/index.ts'),
      '@modules/relay': resolve(__dirname, 'src/modules/relay/index.ts'),
    },
  },
});
