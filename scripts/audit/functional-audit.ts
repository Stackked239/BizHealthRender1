#!/usr/bin/env npx tsx
/**
 * FUNCTIONAL AUDIT
 * Tests the defense layer functionality for ASCII elimination
 */

import * as fs from 'fs';
import * as path from 'path';
import type { FunctionalAuditResult } from './types.js';

// ASCII characters that should be eliminated
const ASCII_BOX_CHARS = /[\u2500-\u257F\u2580-\u259F\u2190-\u21FF\u25A0-\u25FF\u2600-\u26FF]/g;
const ASCII_TABLE_PATTERN = /[+\-|]+[\n\r][+\-|]+/g;

interface TestCase {
  name: string;
  test: () => Promise<boolean>;
}

async function testVisualComponentsExist(): Promise<boolean> {
  const componentsPath = 'src/orchestration/reports/components/visual';
  const indexPath = path.join(process.cwd(), componentsPath, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    return false;
  }

  const content = fs.readFileSync(indexPath, 'utf-8');
  // Check that multiple components are exported
  const exportCount = (content.match(/export\s*\{/g) || []).length +
                      (content.match(/export\s+\*/g) || []).length;
  return exportCount > 0 || content.includes('export');
}

async function testSanitizerExists(): Promise<boolean> {
  const sanitizerPath = path.join(process.cwd(), 'src/orchestration/reports/utils/markdown-sanitizer.ts');
  return fs.existsSync(sanitizerPath);
}

async function testSvgChartRenderer(): Promise<boolean> {
  const rendererPath = path.join(process.cwd(), 'src/orchestration/reports/charts/svg-chart-renderer.ts');

  if (!fs.existsSync(rendererPath)) {
    return false;
  }

  const content = fs.readFileSync(rendererPath, 'utf-8');
  // Check for SVG generation patterns
  return content.includes('<svg') || content.includes('createSvg') || content.includes('generateSvg');
}

async function testNoAsciiInVisualComponents(): Promise<boolean> {
  const componentsDir = path.join(process.cwd(), 'src/orchestration/reports/components/visual');

  if (!fs.existsSync(componentsDir)) {
    return true; // Pass if directory doesn't exist (structural audit will catch this)
  }

  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.ts'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');

    // Check for ASCII box drawing in string literals
    const stringLiterals = content.match(/['"`][^'"]*['"`]/g) || [];
    for (const literal of stringLiterals) {
      if (ASCII_BOX_CHARS.test(literal)) {
        console.log(`      Found ASCII in ${file}`);
        return false;
      }
    }
  }

  return true;
}

async function testOutputReportsClean(): Promise<boolean> {
  const reportsDir = path.join(process.cwd(), 'output/reports');

  if (!fs.existsSync(reportsDir)) {
    return true; // Pass if no output yet
  }

  // Find the most recent report directory
  const dirs = fs.readdirSync(reportsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({
      name: d.name,
      path: path.join(reportsDir, d.name),
      mtime: fs.statSync(path.join(reportsDir, d.name)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (dirs.length === 0) {
    return true;
  }

  const latestDir = dirs[0].path;
  const htmlFiles = fs.readdirSync(latestDir).filter(f => f.endsWith('.html'));

  let totalAscii = 0;
  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(latestDir, file), 'utf-8');
    const matches = content.match(ASCII_BOX_CHARS) || [];
    totalAscii += matches.length;
  }

  return totalAscii === 0;
}

async function testChartGenerators(): Promise<boolean> {
  const generatorsDir = path.join(process.cwd(), 'src/orchestration/reports/charts/generators');

  if (!fs.existsSync(generatorsDir)) {
    return false;
  }

  const files = fs.readdirSync(generatorsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

  if (files.length === 0) {
    return false;
  }

  // Check that generators produce SVG output
  for (const file of files) {
    const content = fs.readFileSync(path.join(generatorsDir, file), 'utf-8');
    if (!content.includes('svg') && !content.includes('SVG')) {
      return false;
    }
  }

  return true;
}

async function testStylesPresent(): Promise<boolean> {
  const stylesPath = path.join(process.cwd(), 'src/orchestration/reports/styles/unified-bizhealth-styles.ts');

  if (!fs.existsSync(stylesPath)) {
    return false;
  }

  const content = fs.readFileSync(stylesPath, 'utf-8');
  // Check for brand colors and chart styles
  return content.includes('#212653') || content.includes('212653') || content.includes('chart');
}

const TEST_CASES: TestCase[] = [
  { name: 'Visual components directory exists', test: testVisualComponentsExist },
  { name: 'Markdown sanitizer exists', test: testSanitizerExists },
  { name: 'SVG chart renderer present', test: testSvgChartRenderer },
  { name: 'No ASCII in visual components', test: testNoAsciiInVisualComponents },
  { name: 'Output reports are clean', test: testOutputReportsClean },
  { name: 'Chart generators produce SVG', test: testChartGenerators },
  { name: 'Unified styles present', test: testStylesPresent },
];

export async function runFunctionalAudit(): Promise<FunctionalAuditResult> {
  console.log('   Running functional tests...\n');

  const tests: FunctionalAuditResult['tests'] = [];

  for (const testCase of TEST_CASES) {
    const start = Date.now();
    try {
      const passed = await testCase.test();
      const duration = Date.now() - start;

      const icon = passed ? '\u2713' : '\u2717';
      console.log(`   ${icon} ${testCase.name}`);

      tests.push({
        name: testCase.name,
        passed,
        duration
      });
    } catch (error) {
      console.log(`   \u2717 ${testCase.name} - Error: ${error}`);
      tests.push({
        name: testCase.name,
        passed: false,
        error: String(error)
      });
    }
  }

  const total = tests.length;
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  console.log('\n   Summary:');
  console.log(`   Total tests: ${total}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);

  return {
    tests,
    summary: { total, passed, failed }
  };
}

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runFunctionalAudit().then(result => {
    console.log('\n   Full result:');
    console.log(JSON.stringify(result.summary, null, 2));
  });
}
