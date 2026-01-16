#!/usr/bin/env npx tsx
/**
 * IDM SCHEMA AUDIT
 * Verifies that IDM type definitions support structured visualization data
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IdmSchemaAuditResult } from './types.js';

const IDM_RELATED_FILES = [
  'src/types/visualization.types.ts',
  'src/orchestration/idm-consolidator.ts',
  'src/prompts/schemas/visualization-output.schema.ts',
];

const REQUIRED_TYPE_PATTERNS = [
  { name: 'Visualization type definition', pattern: /interface\s+\w*[Vv]isualization/i },
  { name: 'ChartData or ChartConfig', pattern: /interface\s+\w*[Cc]hart/i },
  { name: 'SVG or render type', pattern: /(svg|render)/i },
  { name: 'Structured data fields', pattern: /(data|values|labels|series)/i },
  { name: 'Type enum or union', pattern: /(type:\s*['"][a-z]+['"]|VisualizationType)/i },
];

const PROHIBITED_PATTERNS = [
  { name: 'ASCII art literals', pattern: /['"`][^'"]*[\u2500-\u257F\u2580-\u259F][^'"]*['"`]/m },
  { name: 'Box drawing references', pattern: /box[_-]?drawing|ascii[_-]?art/i },
];

function checkIdmFile(filePath: string): {
  exists: boolean;
  checks: { name: string; passed: boolean; details?: string }[];
} {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      checks: [{ name: 'File exists', passed: false, details: 'File not found' }]
    };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const checks: { name: string; passed: boolean; details?: string }[] = [];

  // Check for required patterns
  for (const pattern of REQUIRED_TYPE_PATTERNS) {
    const passed = pattern.pattern.test(content);
    checks.push({
      name: pattern.name,
      passed,
      details: passed ? 'Found' : 'Not found'
    });
  }

  // Check for prohibited patterns (should NOT be present)
  for (const pattern of PROHIBITED_PATTERNS) {
    const found = pattern.pattern.test(content);
    checks.push({
      name: `No ${pattern.name}`,
      passed: !found,
      details: found ? 'FOUND - should not be present' : 'Clean'
    });
  }

  return { exists: true, checks };
}

export async function runIdmSchemaAudit(): Promise<IdmSchemaAuditResult> {
  const projectRoot = process.cwd();

  console.log('   Checking IDM schema definitions...\n');

  // Primary check is on visualization.types.ts
  const primarySchemaPath = 'src/types/visualization.types.ts';
  const fullPath = path.join(projectRoot, primarySchemaPath);

  const result = checkIdmFile(fullPath);
  const allChecks: { name: string; passed: boolean; details?: string }[] = [];

  if (!result.exists) {
    console.log(`   \u2717 ${primarySchemaPath} - File not found`);
    allChecks.push({ name: 'Primary schema file', passed: false, details: 'Not found' });
  } else {
    console.log(`   \u2713 ${primarySchemaPath} exists`);
    allChecks.push(...result.checks);
  }

  // Check other IDM-related files
  for (const file of IDM_RELATED_FILES) {
    if (file === primarySchemaPath) continue;

    const filePath = path.join(projectRoot, file);
    const exists = fs.existsSync(filePath);

    if (exists) {
      console.log(`   \u2713 ${path.basename(file)} exists`);
      const fileResult = checkIdmFile(filePath);
      // Only add critical checks from secondary files
      const criticalChecks = fileResult.checks.filter(c =>
        c.name.includes('ASCII') || c.name.includes('box')
      );
      allChecks.push(...criticalChecks.map(c => ({
        ...c,
        name: `${path.basename(file)}: ${c.name}`
      })));
    } else {
      console.log(`   \u26a0 ${path.basename(file)} not found (optional)`);
    }
  }

  // Print check results
  console.log('\n   Schema checks:');
  for (const check of allChecks) {
    const icon = check.passed ? '\u2713' : '\u2717';
    console.log(`   ${icon} ${check.name}: ${check.details || ''}`);
  }

  const passedChecks = allChecks.filter(c => c.passed).length;
  const schemaCompliant = passedChecks >= Math.floor(allChecks.length * 0.7);

  console.log('\n   Summary:');
  console.log(`   Checks passed: ${passedChecks}/${allChecks.length}`);
  console.log(`   Schema compliant: ${schemaCompliant ? 'Yes' : 'No'}`);

  return {
    schemaPath: primarySchemaPath,
    schemaExists: result.exists,
    schemaCompliant,
    checks: allChecks
  };
}

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runIdmSchemaAudit().then(result => {
    console.log('\n   Full result:');
    console.log(JSON.stringify({ schemaCompliant: result.schemaCompliant }, null, 2));
  });
}
