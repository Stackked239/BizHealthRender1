/**
 * Vitest Global Setup
 * Ensures test environment is properly configured
 */
import { beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';

const QUALITY_AUDIT_DIR = './output/system-audit/quality';
const COVERAGE_DIR = './output/coverage';

beforeAll(() => {
  // Ensure output directories exist
  [QUALITY_AUDIT_DIR, COVERAGE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('Test environment initialized');
  console.log(`  Quality artifacts: ${QUALITY_AUDIT_DIR}`);
  console.log(`  Coverage reports: ${COVERAGE_DIR}`);
});

afterAll(() => {
  console.log('Test suite completed');
});
