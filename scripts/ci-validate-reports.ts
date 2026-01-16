#!/usr/bin/env npx tsx
/**
 * CI VALIDATION SCRIPT
 *
 * This script is run in the CI pipeline after report generation.
 * It FAILS THE BUILD if any ASCII diagram characters are detected
 * in the final HTML output.
 *
 * Exit codes:
 *   0 = All reports pass validation
 *   1 = ASCII violations detected (build failure)
 *   2 = Script error
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FORBIDDEN_ASCII_PATTERN } from '../src/contracts/visualization.contract';

interface ValidationResult {
  file: string;
  passed: boolean;
  asciiCount: number;
  samples: string[];
  lineNumbers: number[];
}

interface ValidationSummary {
  passed: boolean;
  totalFiles: number;
  passedFiles: number;
  failedFiles: number;
  totalViolations: number;
  results: ValidationResult[];
}

/**
 * Find line numbers where ASCII violations occur
 */
function findViolationLineNumbers(content: string): number[] {
  const lines = content.split('\n');
  const violationLines: number[] = [];

  lines.forEach((line, index) => {
    if (FORBIDDEN_ASCII_PATTERN.test(line)) {
      violationLines.push(index + 1);
    }
  });

  return violationLines.slice(0, 10); // Limit to first 10 lines
}

/**
 * Validate a single file for ASCII violations
 */
function validateFile(filePath: string, baseDir: string): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(baseDir, filePath);

  // Find all ASCII matches
  const matches = content.match(new RegExp(FORBIDDEN_ASCII_PATTERN.source, 'g'));
  const asciiCount = matches?.length || 0;

  // Get unique sample violations (first 5)
  const samples = matches ? [...new Set(matches)].slice(0, 5) : [];

  // Find line numbers
  const lineNumbers = asciiCount > 0 ? findViolationLineNumbers(content) : [];

  return {
    file: relativePath,
    passed: asciiCount === 0,
    asciiCount,
    samples,
    lineNumbers
  };
}

/**
 * Validate all reports in a directory
 */
async function validateReports(reportDir: string): Promise<ValidationSummary> {
  // Find all HTML files
  const htmlFiles = await glob(`${reportDir}/**/*.html`);

  console.log(`\n=========================================`);
  console.log(`  ASCII VALIDATION - BizHealth Reports`);
  console.log(`=========================================\n`);
  console.log(`Scanning ${htmlFiles.length} HTML files in ${reportDir}...\n`);

  const results: ValidationResult[] = [];
  let passedFiles = 0;
  let failedFiles = 0;
  let totalViolations = 0;

  for (const filePath of htmlFiles) {
    const result = validateFile(filePath, reportDir);
    results.push(result);

    if (result.passed) {
      passedFiles++;
      console.log(`  ✅ ${result.file}`);
    } else {
      failedFiles++;
      totalViolations += result.asciiCount;
      console.log(`  ❌ ${result.file}`);
      console.log(`     └─ ${result.asciiCount} violations: ${result.samples.map((s) => `"${s}"`).join(', ')}`);
      if (result.lineNumbers.length > 0) {
        console.log(`     └─ Lines: ${result.lineNumbers.join(', ')}${result.lineNumbers.length >= 10 ? '...' : ''}`);
      }
    }
  }

  const passed = failedFiles === 0;

  return {
    passed,
    totalFiles: htmlFiles.length,
    passedFiles,
    failedFiles,
    totalViolations,
    results
  };
}

/**
 * Print summary report
 */
function printSummary(summary: ValidationSummary): void {
  console.log(`\n=========================================`);
  console.log(`  VALIDATION SUMMARY`);
  console.log(`=========================================\n`);

  console.log(`  Total files scanned:  ${summary.totalFiles}`);
  console.log(`  Files passed:         ${summary.passedFiles}`);
  console.log(`  Files failed:         ${summary.failedFiles}`);
  console.log(`  Total violations:     ${summary.totalViolations}`);

  if (summary.passed) {
    console.log(`\n  ✅ ALL REPORTS PASS ASCII VALIDATION\n`);
  } else {
    console.log(`\n  ❌ ASCII VALIDATION FAILED\n`);
    console.log(`  The following reports contain forbidden ASCII diagram characters:\n`);

    for (const result of summary.results.filter((r) => !r.passed)) {
      console.log(`    • ${result.file}`);
      console.log(`      Violations: ${result.asciiCount}`);
      console.log(`      Characters: ${result.samples.join(' ')}`);
      console.log('');
    }

    console.log(`  ⚠️  BUILD WILL FAIL`);
    console.log(`  Review Phase 1-3 prompts and visualization extraction.`);
    console.log(`  All visualizations must use structured JSON format.\n`);
  }
}

/**
 * Write JSON report for CI consumption
 */
function writeJsonReport(summary: ValidationSummary, outputPath: string): void {
  const report = {
    timestamp: new Date().toISOString(),
    passed: summary.passed,
    summary: {
      totalFiles: summary.totalFiles,
      passedFiles: summary.passedFiles,
      failedFiles: summary.failedFiles,
      totalViolations: summary.totalViolations
    },
    failures: summary.results
      .filter((r) => !r.passed)
      .map((r) => ({
        file: r.file,
        violations: r.asciiCount,
        samples: r.samples,
        lines: r.lineNumbers
      }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`JSON report written to: ${outputPath}`);
}

// Main execution
async function main() {
  const reportDir = process.argv[2] || 'output/reports';
  const jsonOutput = process.argv[3]; // Optional JSON output path

  // Check if directory exists
  if (!fs.existsSync(reportDir)) {
    console.error(`\n❌ Report directory not found: ${reportDir}`);
    console.error(`   Make sure reports have been generated before running validation.\n`);
    process.exit(2);
  }

  try {
    const summary = await validateReports(reportDir);
    printSummary(summary);

    // Write JSON report if requested
    if (jsonOutput) {
      writeJsonReport(summary, jsonOutput);
    }

    // Exit with appropriate code
    if (!summary.passed) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script error:', error);
    process.exit(2);
  }
}

main();
