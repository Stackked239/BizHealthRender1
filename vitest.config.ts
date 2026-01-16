import { defineConfig } from 'vitest/config';
import * as fs from 'fs';

// Ensure output directories exist at config load time
const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir('./output/system-audit/quality');
ensureDir('./output/coverage');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],

    // Coverage configuration - saves to QA-QC-Audit structure
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './output/coverage',
      include: [
        'src/orchestration/**/*.ts',
        'src/utils/**/*.ts',
        'src/validation/**/*.ts',
        'src/data-transformation/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.types.ts',
        'src/**/*.config.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
      all: true,
      clean: true,
    },

    // Test timeout for E2E tests
    testTimeout: 60000,
    hookTimeout: 30000,

    // Reporters - verbose + JSON for QA-QC-Audit
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './output/system-audit/quality/test-results.json',
    },

    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
