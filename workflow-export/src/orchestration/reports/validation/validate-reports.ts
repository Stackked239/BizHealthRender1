#!/usr/bin/env npx tsx
/**
 * CLI script to validate report section mappings
 * Usage: npx tsx src/orchestration/reports/validation/validate-reports.ts [reportDir]
 */

import * as path from 'path';
import { runValidation } from './section-mapping-validator';

const reportDir = process.argv[2] || path.join(process.cwd(), 'output', 'reports');
const success = runValidation(reportDir);
process.exit(success ? 0 : 1);
