import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, 'src/test/unit/mocks/vscode.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/test/unit/**/*.test.ts'],
  },
});
