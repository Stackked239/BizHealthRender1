#!/usr/bin/env npx tsx
/**
 * CLI script to validate report section mappings
 *
 * Usage:
 *   npx tsx src/orchestration/reports/validation/validate-reports.ts
 *   npx tsx src/orchestration/reports/validation/validate-reports.ts ./custom-output
 *   npm run validate:reports
 */

import * as path from 'path';
import { runValidation } from './section-mapping-validator.js';

// Get report directory from args or use default
const reportDir = process.argv[2] || path.join(process.cwd(), 'output', 'reports');

// Run validation
const success = runValidation(reportDir);

// Exit with appropriate code
process.exit(success ? 0 : 1);
