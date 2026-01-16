#!/usr/bin/env npx ts-node

/**
 * BizHealth Phase 5 Visualization Validation Script
 *
 * Validates Phase 5 reports for:
 * - Minimum visualization count based on report type configuration
 * - No orphaned visualization headers
 * - Required visualizations present (risk heatmap, roadmap timeline, etc.)
 * - Print-safe CSS
 * - Accessibility labels
 *
 * Usage:
 *   npx ts-node scripts/validate-phase5-visualizations.ts [output_directory]
 *
 * @module validate-phase5-visualizations
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION - Per-Report Type Minimums
// ============================================================================

/** Report type visual configuration */
interface ReportVisualConfig {
  minVisualCount: number;
  targetVisualCount: number;
}

/** Per-report type minimum and target visual counts */
const REPORT_VISUAL_CONFIGS: Record<string, ReportVisualConfig> = {
  comprehensive: { minVisualCount: 25, targetVisualCount: 50 },
  owner: { minVisualCount: 6, targetVisualCount: 15 },
  executiveBrief: { minVisualCount: 3, targetVisualCount: 8 },
  quickWins: { minVisualCount: 3, targetVisualCount: 8 },
  risk: { minVisualCount: 4, targetVisualCount: 12 },
  roadmap: { minVisualCount: 4, targetVisualCount: 10 },
  financial: { minVisualCount: 3, targetVisualCount: 10 },
  'deep-dive-ge': { minVisualCount: 4, targetVisualCount: 10 },
  'deep-dive-ph': { minVisualCount: 3, targetVisualCount: 10 },
  'deep-dive-pl': { minVisualCount: 3, targetVisualCount: 10 },
  'deep-dive-rs': { minVisualCount: 4, targetVisualCount: 10 },
  employees: { minVisualCount: 2, targetVisualCount: 6 },
  managersOperations: { minVisualCount: 1, targetVisualCount: 8 },
  managersSalesMarketing: { minVisualCount: 2, targetVisualCount: 8 },
  managersFinancials: { minVisualCount: 1, targetVisualCount: 8 },
  managersStrategy: { minVisualCount: 2, targetVisualCount: 8 },
  managersItTechnology: { minVisualCount: 2, targetVisualCount: 8 },
};

/** Default for unknown report types */
const DEFAULT_VISUAL_COUNT = 25;

/** Get minimum visual count for a report type */
function getMinVisualCount(reportType: string): number {
  return REPORT_VISUAL_CONFIGS[reportType]?.minVisualCount ?? DEFAULT_VISUAL_COUNT;
}

/** Get target visual count for a report type */
function getTargetVisualCount(reportType: string): number {
  return REPORT_VISUAL_CONFIGS[reportType]?.targetVisualCount ?? DEFAULT_VISUAL_COUNT;
}

interface ValidationResult {
  path: string;
  reportType: string;
  passed: boolean;
  visualCount: number;
  minRequired: number;
  targetCount: number;
  orphanedHeaders: string[];
  missingVisuals: string[];
  printIssues: string[];
  accessibilityIssues: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Extract report type from filename
 */
function getReportTypeFromPath(htmlPath: string): string {
  const fileName = path.basename(htmlPath, '.html');
  return fileName;
}

/**
 * Validate a single report HTML file
 */
function validateReport(htmlPath: string): ValidationResult {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const reportType = getReportTypeFromPath(htmlPath);
  const minRequired = getMinVisualCount(reportType);
  const targetCount = getTargetVisualCount(reportType);

  const results: ValidationResult = {
    path: htmlPath,
    reportType,
    passed: true,
    visualCount: 0,
    minRequired,
    targetCount,
    orphanedHeaders: [],
    missingVisuals: [],
    printIssues: [],
    accessibilityIssues: []
  };

  // Count visualizations
  const visualPatterns = [
    /class="[^"]*svg-chart-container/g,
    /class="[^"]*biz-gauge/g,
    /class="[^"]*biz-kpi-dashboard/g,
    /class="[^"]*biz-risk-matrix/g,
    /class="[^"]*biz-roadmap-timeline/g,
    /class="[^"]*biz-timeline/g,
    /class="[^"]*biz-heatmap/g,
    /class="[^"]*risk-heatmap/g,
    /class="[^"]*dimension-gauge/g,
    /class="[^"]*executive-metrics-dashboard/g,
    /class="[^"]*benchmark-comparison/g,
    /class="[^"]*chart-container/g,
    /<svg[^>]*viewBox/g
  ];

  visualPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      results.visualCount += matches.length;
    }
  });

  // Check minimum visualization count (using per-report type minimum)
  if (results.visualCount < minRequired) {
    results.passed = false;
    results.missingVisuals.push(
      `Only ${results.visualCount} visuals found, minimum is ${minRequired} (target: ${targetCount})`
    );
  }

  // Check for orphaned visualization headers
  const orphanPatterns = [
    { pattern: /Visual Benchmark Position/gi, name: 'Visual Benchmark Position' },
    { pattern: /<h[23][^>]*>Risk Heat Map<\/h[23]>\s*<hr/gi, name: 'Empty Risk Heat Map header' },
    { pattern: /<h[23][^>]*>Transformation Summary Matrix<\/h[23]>\s*<hr/gi, name: 'Empty Summary Matrix header' },
    { pattern: /<h[23][^>]*>Cascade Effects<\/h[23]>\s*(?![\s\S]*<svg)/gi, name: 'Empty Cascade Effects header' },
    { pattern: /<h[23][^>]*>Growth Trajectory Model<\/h[23]>\s*<hr/gi, name: 'Empty Growth Model header' },
    { pattern: /<h[23][^>]*>Scenario Analysis<\/h[23]>\s*<hr/gi, name: 'Empty Scenario Analysis header' },
    { pattern: /<!--\s*VISUALIZATION_PLACEHOLDER_\d+\s*-->/gi, name: 'Unreplaced placeholder' }
  ];

  orphanPatterns.forEach(({ pattern, name }) => {
    pattern.lastIndex = 0; // Reset for global patterns
    if (pattern.test(html)) {
      results.passed = false;
      results.orphanedHeaders.push(`Found: ${name}`);
    }
  });

  // Check for required Phase 5 visualizations
  const requiredVisuals = [
    { pattern: /risk-heatmap|biz-risk-matrix/i, name: 'Risk Heat Map' },
    { pattern: /biz-roadmap-timeline|roadmap-timeline-container/i, name: 'Roadmap Timeline' },
    { pattern: /biz-kpi-dashboard|executive-metrics-dashboard/i, name: 'Executive Dashboard' }
  ];

  requiredVisuals.forEach(({ pattern, name }) => {
    if (!pattern.test(html)) {
      // Not a hard failure, just a warning
      results.missingVisuals.push(`Missing recommended: ${name}`);
    }
  });

  // Check print CSS
  if (!html.includes('-webkit-print-color-adjust: exact') && !html.includes('print-color-adjust: exact')) {
    results.printIssues.push('Missing print color adjust CSS');
  }

  if (!html.includes('@media print')) {
    results.printIssues.push('Missing @media print styles');
  }

  // Check accessibility
  const svgCount = (html.match(/<svg/g) || []).length;
  const ariaCount = (html.match(/aria-label/g) || []).length;
  const roleCount = (html.match(/role="(figure|img|region)"/g) || []).length;

  if (ariaCount < svgCount * 0.5) {
    results.accessibilityIssues.push(
      `Only ${ariaCount}/${svgCount} SVGs have aria-labels (${Math.round(ariaCount / svgCount * 100)}%)`
    );
  }

  if (roleCount < svgCount * 0.3) {
    results.accessibilityIssues.push(
      `Only ${roleCount}/${svgCount} elements have role attributes`
    );
  }

  return results;
}

/**
 * Format result for console output
 */
function formatResult(result: ValidationResult): string {
  const lines: string[] = [];
  const fileName = path.basename(result.path);

  lines.push(`\n${'='.repeat(60)}`);
  lines.push(`Report: ${fileName} (type: ${result.reportType})`);
  lines.push(`${'='.repeat(60)}`);

  // Visual count - use per-report minimum
  const meetsMin = result.visualCount >= result.minRequired;
  const meetsTarget = result.visualCount >= result.targetCount;
  const visualStatus = meetsMin ? (meetsTarget ? '✅' : '⚠️') : '❌';
  lines.push(`Visualizations: ${result.visualCount} ${visualStatus} (min: ${result.minRequired}, target: ${result.targetCount})`);

  // Orphaned headers
  if (result.orphanedHeaders.length === 0) {
    lines.push(`Orphaned Headers: ✅ None`);
  } else {
    lines.push(`Orphaned Headers: ❌`);
    result.orphanedHeaders.forEach(h => lines.push(`  - ${h}`));
  }

  // Missing visuals
  if (result.missingVisuals.length > 0) {
    lines.push(`Warnings:`);
    result.missingVisuals.forEach(m => lines.push(`  - ${m}`));
  }

  // Print issues
  if (result.printIssues.length === 0) {
    lines.push(`Print CSS: ✅ OK`);
  } else {
    lines.push(`Print CSS: ⚠️`);
    result.printIssues.forEach(p => lines.push(`  - ${p}`));
  }

  // Accessibility
  if (result.accessibilityIssues.length === 0) {
    lines.push(`Accessibility: ✅ OK`);
  } else {
    lines.push(`Accessibility: ⚠️`);
    result.accessibilityIssues.forEach(a => lines.push(`  - ${a}`));
  }

  // Overall status
  lines.push(`\nOverall: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const outputDir = process.argv[2] || 'output';

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   BizHealth Phase 5 Visualization Validation               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nScanning directory: ${outputDir}`);

  // Check if directory exists
  if (!fs.existsSync(outputDir)) {
    console.error(`\n❌ Error: Directory not found: ${outputDir}`);
    console.log('Usage: npx ts-node scripts/validate-phase5-visualizations.ts [output_directory]');
    process.exit(1);
  }

  // Find HTML reports
  const files = fs.readdirSync(outputDir);
  const htmlReports = files.filter(f => f.endsWith('.html'));

  if (htmlReports.length === 0) {
    console.error(`\n❌ Error: No HTML reports found in ${outputDir}`);
    process.exit(1);
  }

  console.log(`Found ${htmlReports.length} HTML report(s)\n`);

  // Validate each report
  let allPassed = true;
  const results: ValidationResult[] = [];

  htmlReports.forEach(report => {
    const htmlPath = path.join(outputDir, report);
    const result = validateReport(htmlPath);
    results.push(result);

    console.log(formatResult(result));

    if (!result.passed) {
      allPassed = false;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passedCount = results.filter(r => r.passed).length;
  const totalVisuals = results.reduce((sum, r) => sum + r.visualCount, 0);
  const avgVisuals = Math.round(totalVisuals / results.length);

  console.log(`Reports validated: ${results.length}`);
  console.log(`Passed: ${passedCount}/${results.length}`);
  console.log(`Total visualizations: ${totalVisuals}`);
  console.log(`Average per report: ${avgVisuals}`);

  console.log('\n' + (allPassed
    ? '✅ All validations passed!'
    : '❌ Some validations failed'));

  process.exit(allPassed ? 0 : 1);
}

main();
