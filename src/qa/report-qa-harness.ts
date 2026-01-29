/**
 * Report QA Harness
 *
 * Generates sample reports for manual quality verification.
 * Run with: npx tsx src/qa/report-qa-harness.ts
 *
 * This harness generates test reports using the Phase 5 builders with
 * Phase 4 visual patterns, allowing manual verification of:
 * - Brand compliance (BizNavy, BizGreen)
 * - CSS class application
 * - Visual layout and styling
 * - Print optimization
 * - Interactive features
 * - Content quality gate validation (NEW)
 *
 * @module report-qa-harness
 * @version 1.1.0
 * @date 2025-12-16
 */

import * as fs from 'fs';
import * as path from 'path';
import { buildOwnersReport } from '../orchestration/reports/owners-report.builder.js';
import { buildComprehensiveReport } from '../orchestration/reports/comprehensive-report.builder.js';
import { buildQuickWinsReport } from '../orchestration/reports/quick-wins-report.builder.js';
import { buildExecutiveBrief } from '../orchestration/reports/executive-brief.builder.js';
import {
  createSampleReportContext,
  createHighPerformingContext,
  createLowPerformingContext,
} from './fixtures/sample-context.js';
import type { ReportRenderOptions } from '../types/report.types.js';
import {
  validateManagerReportQuality,
  formatQualityResult,
  type ContentQualityResult,
} from './content-quality-gate.js';

// Brand colors
const BRAND_OPTIONS: ReportRenderOptions['brand'] = {
  primaryColor: '#212653', // BizNavy
  accentColor: '#969423',  // BizGreen
};

/**
 * Generate QA sample reports
 */
async function generateQASamples(): Promise<void> {
  console.log('====================================================');
  console.log('BizHealth Report QA Harness');
  console.log('Phase 4/5 Formatting Consolidation Verification');
  console.log('====================================================\n');

  // Create output directory
  const outputDir = path.join(process.cwd(), 'qa-samples');
  fs.mkdirSync(outputDir, { recursive: true });

  // Create subdirectories for different test scenarios
  const standardDir = path.join(outputDir, 'standard');
  const highDir = path.join(outputDir, 'high-performer');
  const lowDir = path.join(outputDir, 'low-performer');

  fs.mkdirSync(standardDir, { recursive: true });
  fs.mkdirSync(highDir, { recursive: true });
  fs.mkdirSync(lowDir, { recursive: true });

  // Generate standard test reports
  console.log('Generating standard test reports...');
  await generateReportSet(createSampleReportContext(), standardDir, 'standard');

  // Generate high performer reports (Excellence band)
  console.log('\nGenerating high performer reports (Excellence band)...');
  await generateReportSet(createHighPerformingContext(), highDir, 'high-performer');

  // Generate low performer reports (Critical band)
  console.log('\nGenerating low performer reports (Critical band)...');
  await generateReportSet(createLowPerformingContext(), lowDir, 'low-performer');

  // Run content quality gate validation
  await runContentQualityValidation(outputDir);

  // Print verification checklist
  printVerificationChecklist(outputDir);
}

/**
 * Generate a set of reports for a given context
 */
async function generateReportSet(
  ctx: any,
  outputDir: string,
  scenarioName: string
): Promise<void> {
  const renderOptions: ReportRenderOptions = {
    outputDir,
    brand: BRAND_OPTIONS,
    includeTOC: true,
    includeCharts: true,
  };

  const reports = [
    { name: 'owner', builder: buildOwnersReport },
    { name: 'comprehensive', builder: buildComprehensiveReport },
    { name: 'quickWins', builder: buildQuickWinsReport },
    { name: 'executiveBrief', builder: buildExecutiveBrief },
  ];

  for (const report of reports) {
    try {
      console.log(`  Generating ${report.name}...`);
      await report.builder(ctx, renderOptions);
      console.log(`  [OK] ${report.name}.html`);
    } catch (error) {
      console.error(`  [FAIL] ${report.name}:`, (error as Error).message);
    }
  }
}

/**
 * Run content quality gate validation on generated reports
 */
async function runContentQualityValidation(outputDir: string): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('CONTENT QUALITY GATE VALIDATION');
  console.log('='.repeat(60) + '\n');

  const scenarios = ['standard', 'high-performer', 'low-performer'];
  const reportTypes = ['owner', 'comprehensive', 'quickWins', 'executiveBrief'];

  let totalPassed = 0;
  let totalFailed = 0;
  const qualityResults: Array<{ scenario: string; type: string; result: ContentQualityResult }> = [];

  for (const scenario of scenarios) {
    const scenarioDir = path.join(outputDir, scenario);
    console.log(`\nValidating ${scenario} reports...`);

    for (const reportType of reportTypes) {
      const htmlPath = path.join(scenarioDir, `${reportType}.html`);

      if (!fs.existsSync(htmlPath)) {
        console.log(`  [SKIP] ${reportType}.html - not found`);
        continue;
      }

      try {
        const html = fs.readFileSync(htmlPath, 'utf-8');
        const result = validateManagerReportQuality(html, reportType);

        qualityResults.push({ scenario, type: reportType, result });

        const status = result.passed ? '[PASS]' : '[FAIL]';
        console.log(`  ${status} ${reportType}.html - Score: ${result.overallScore}%`);

        if (result.passed) {
          totalPassed++;
        } else {
          totalFailed++;
          // Print blockers for failed reports
          if (result.blockers.length > 0) {
            console.log(`         Blockers: ${result.blockers.join(', ')}`);
          }
        }

        if (result.warnings.length > 0) {
          console.log(`         Warnings: ${result.warnings.length}`);
        }
      } catch (error) {
        console.log(`  [ERROR] ${reportType}.html - ${(error as Error).message}`);
      }
    }
  }

  // Print summary
  console.log('\n' + '-'.repeat(40));
  console.log('QUALITY GATE SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total Passed: ${totalPassed}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log(`Pass Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

  // Write detailed results to file
  const resultsPath = path.join(outputDir, 'quality-gate-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(qualityResults, null, 2), 'utf-8');
  console.log(`\nDetailed results saved to: ${resultsPath}`);
}

/**
 * Print the QA verification checklist
 */
function printVerificationChecklist(outputDir: string): void {
  console.log('\n' + '='.repeat(60));
  console.log('QA VERIFICATION CHECKLIST');
  console.log('='.repeat(60));
  console.log(`
Generated reports are available at: ${outputDir}

Open in browser with: file://${outputDir}/standard/owner.html

BRAND COMPLIANCE:
  [ ] BizNavy (#212653) used for headings and primary elements
  [ ] BizGreen (#969423) used for accents and highlights
  [ ] Montserrat font used for all headings (H1-H6)
  [ ] Open Sans font used for body text

PHASE 4 VISUAL PATTERNS:
  [ ] Score circles have gradient backgrounds matching score band
  [ ] Chapter cards have gradient backgrounds with proper colors
  [ ] Tables have rounded corners (10px) and shadows
  [ ] Tables have BizNavy header backgrounds
  [ ] Findings use 3-column gradient card layout
  [ ] Risk items have left border accent (5px)
  [ ] Timeline phases have colored headers with negative margins
  [ ] Quick wins have proper impact score badges

PHASE 5 FEATURES PRESERVED:
  [ ] Interactive Table of Contents works (Comprehensive Report)
  [ ] Cross-references link correctly (Owner's -> Comprehensive)
  [ ] All AI-generated narrative content placeholders are present
  [ ] No content loss compared to previous Phase 5 output

SCORE BAND VERIFICATION:
  Standard (Attention band):
    [ ] Score circle shows attention colors (yellow/amber)
    [ ] Chapter cards show appropriate band colors
    [ ] Priority indicators highlight attention areas

  High Performer (Excellence band):
    [ ] Score circle shows excellence colors (green)
    [ ] Chapter cards show excellence styling
    [ ] Strengths highlighted appropriately

  Low Performer (Critical band):
    [ ] Score circle shows critical colors (red)
    [ ] Chapter cards show critical styling
    [ ] Urgent priorities highlighted

PDF EXPORT TESTING:
  [ ] Page breaks occur at logical section boundaries
  [ ] Colors render correctly (print-color-adjust)
  [ ] Tables don't break awkwardly across pages
  [ ] Headers and footers are consistent

RESPONSIVE DESIGN:
  [ ] Reports display correctly on desktop (1200px+)
  [ ] Reports are readable on tablet (768px)
  [ ] Mobile view (< 768px) shows single-column layout
`);

  console.log('='.repeat(60));
  console.log('To run this harness:');
  console.log('  npx tsx src/qa/report-qa-harness.ts');
  console.log('='.repeat(60));
}

// Run the harness
generateQASamples().catch((error) => {
  console.error('QA Harness failed:', error);
  process.exit(1);
});
