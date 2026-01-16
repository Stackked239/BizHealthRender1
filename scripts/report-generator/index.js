#!/usr/bin/env node
/**
 * BizHealth Report Generator
 *
 * Generates comprehensive business health reports from the master-analysis JSON file.
 * Outputs HTML files following BizHealth formatting standards v2.0.
 *
 * Usage: node scripts/report-generator/index.js [master-json-path] [output-dir]
 *
 * Reports Generated:
 * 1. Executive Summary (3-7 pages)
 * 2. Business Health Scorecard/Dashboard (4-9 pages)
 * 3. Multi-Dimensional Analysis (15-30 pages)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataExtractor } from './utils/data-extractor.js';
import { wrapInHtmlDocument, footer, divider } from './utils/html-template.js';
import { generateExecutiveSummaryHtml } from './generators/executive-summary-html.js';
import { generateScorecardHtml } from './generators/scorecard-html.js';
import { generateMultiDimensionalAnalysisHtml } from './generators/multi-dimensional-html.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'reports');

/**
 * Main report generation orchestrator
 */
async function generateReports(masterJsonPath, outputDir = DEFAULT_OUTPUT_DIR) {
  console.log('🚀 BizHealth Report Generator v2.0 (HTML Output)\n');
  console.log('═'.repeat(60));

  // Step 1: Load and validate master JSON
  console.log('\n📂 Loading master analysis JSON...');
  if (!fs.existsSync(masterJsonPath)) {
    console.error(`❌ Error: Master JSON not found at ${masterJsonPath}`);
    process.exit(1);
  }

  const masterData = JSON.parse(fs.readFileSync(masterJsonPath, 'utf-8'));
  console.log(`   ✓ Loaded: ${path.basename(masterJsonPath)}`);
  console.log(`   ✓ Company ID: ${masterData.meta.company_profile_id}`);
  console.log(`   ✓ Phases included: ${masterData.meta.phases_included.join(', ')}`);

  // Step 2: Initialize data extractor
  console.log('\n🔧 Initializing data extractor...');
  const extractor = new DataExtractor(masterData);
  const companyData = extractor.extractAll();
  console.log(`   ✓ Extracted ${Object.keys(companyData).length} top-level data categories`);

  // Step 3: Create output directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportOutputDir = path.join(outputDir, `report-${timestamp}`);
  fs.mkdirSync(reportOutputDir, { recursive: true });
  console.log(`\n📁 Output directory: ${reportOutputDir}`);

  // Step 4: Generate reports
  console.log('\n' + '═'.repeat(60));
  console.log('📝 GENERATING HTML REPORTS');
  console.log('═'.repeat(60));

  const reports = [];

  // Generate Executive Summary
  console.log('\n1️⃣  Executive Summary...');
  try {
    const execSummaryContent = generateExecutiveSummaryHtml(companyData);
    const execSummaryHtml = wrapInHtmlDocument(execSummaryContent, 'Executive Summary - BizHealth Report');
    const execPath = path.join(reportOutputDir, '01-Executive-Summary.html');
    fs.writeFileSync(execPath, execSummaryHtml);
    reports.push({ name: 'Executive Summary', path: execPath, pages: '3-7' });
    console.log('   ✓ Generated: 01-Executive-Summary.html');
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Generate Scorecard/Dashboard
  console.log('\n2️⃣  Business Health Scorecard...');
  try {
    const scorecardContent = generateScorecardHtml(companyData);
    const scorecardHtml = wrapInHtmlDocument(scorecardContent, 'Business Health Scorecard - BizHealth Report');
    const scorecardPath = path.join(reportOutputDir, '02-Business-Health-Scorecard.html');
    fs.writeFileSync(scorecardPath, scorecardHtml);
    reports.push({ name: 'Business Health Scorecard', path: scorecardPath, pages: '4-9' });
    console.log('   ✓ Generated: 02-Business-Health-Scorecard.html');
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Generate Multi-Dimensional Analysis
  console.log('\n3️⃣  Multi-Dimensional Analysis...');
  try {
    const multiDimContent = generateMultiDimensionalAnalysisHtml(companyData);
    const multiDimHtml = wrapInHtmlDocument(multiDimContent, 'Multi-Dimensional Analysis - BizHealth Report');
    const multiDimPath = path.join(reportOutputDir, '03-Multi-Dimensional-Analysis.html');
    fs.writeFileSync(multiDimPath, multiDimHtml);
    reports.push({ name: 'Multi-Dimensional Analysis', path: multiDimPath, pages: '15-30' });
    console.log('   ✓ Generated: 03-Multi-Dimensional-Analysis.html');
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Step 5: Generate combined report (single footer at end only)
  console.log('\n4️⃣  Combined Owner\'s Report...');
  try {
    // Generate sections WITHOUT individual footers
    const noFooterOption = { includeFooter: false };

    // Create the single footer for the combined report
    const combinedFooter = footer([
      'This Complete Owner\'s Report provides comprehensive analysis synthesizing insights from your Business Health Assessment across all 12 core business dimensions.',
      `Report Generated: ${companyData.meta.reportDate}`,
      `Assessment Period: ${companyData.meta.assessmentPeriod}`,
      'BizHealth.ai © 2025 | Proprietary and Confidential'
    ]);

    const combinedContent = [
      generateExecutiveSummaryHtml(companyData, noFooterOption),
      '<div class="page-break"></div>',
      generateScorecardHtml(companyData, noFooterOption),
      '<div class="page-break"></div>',
      generateMultiDimensionalAnalysisHtml(companyData, noFooterOption),
      divider(),
      combinedFooter
    ].join('\n\n');

    const combinedHtml = wrapInHtmlDocument(combinedContent, 'Complete Owner\'s Report - BizHealth');
    const combinedPath = path.join(reportOutputDir, '00-Complete-Owners-Report.html');
    fs.writeFileSync(combinedPath, combinedHtml);
    console.log('   ✓ Generated: 00-Complete-Owners-Report.html');
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
  }

  // Step 6: Generate metadata
  const metadata = {
    generated_at: new Date().toISOString(),
    source_file: masterJsonPath,
    company_profile_id: masterData.meta.company_profile_id,
    reports_generated: reports.map(r => ({ name: r.name, file: path.basename(r.path), pages: r.pages })),
    output_directory: reportOutputDir,
    format: 'HTML',
    version: '2.0'
  };
  fs.writeFileSync(
    path.join(reportOutputDir, 'report-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('✅ REPORT GENERATION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n📊 Reports Generated: ${reports.length}`);
  reports.forEach(r => console.log(`   • ${r.name} (${r.pages} pages)`));
  console.log(`\n📁 Output Location: ${reportOutputDir}`);
  console.log('\n📄 Output Format: HTML');
  console.log('\n🎉 Done!\n');

  return { success: true, outputDir: reportOutputDir, reports };
}

// Find most recent master JSON if not specified
function findLatestMasterJson() {
  const outputDir = path.join(__dirname, '..', '..', 'output');
  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('master-analysis-') && f.endsWith('.json'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(outputDir, files[0]) : null;
}

// Run if called directly
const masterJsonArg = process.argv[2] || findLatestMasterJson();
const outputDirArg = process.argv[3] || DEFAULT_OUTPUT_DIR;

if (!masterJsonArg) {
  console.error('❌ No master JSON file found. Please specify the path.');
  console.log('Usage: node scripts/report-generator/index.js [master-json-path] [output-dir]');
  process.exit(1);
}

generateReports(masterJsonArg, outputDirArg);

export { generateReports };
