#!/usr/bin/env node
/**
 * BizHealth Recipe-Based Report Generator
 *
 * Generates HTML reports from IDM data using declarative recipe configurations.
 * This is the main entry point for the multi-report recipe system.
 *
 * Usage:
 *   node scripts/report-generator/recipe-index.js <idm-path> <recipe-path> [output-dir]
 *   node scripts/report-generator/recipe-index.js <idm-path> --all [output-dir]
 *
 * Examples:
 *   node scripts/report-generator/recipe-index.js ./output/idm.json ./config/report-recipes/owners.json
 *   node scripts/report-generator/recipe-index.js ./output/idm.json --all ./output/reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderReport, resolveDataSource } from './recipe-renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'reports');
const RECIPES_DIR = path.join(__dirname, '..', '..', 'config', 'report-recipes');

// All available recipe IDs
const ALL_RECIPES = [
  'comprehensive',
  'owners',
  'executive',
  'employees',
  'managers-sales-marketing',
  'managers-operations',
  'managers-financials',
  'managers-it-technology',
  'managers-strategy'
];

/**
 * Load and validate IDM
 */
function loadIDM(idmPath) {
  console.log(`\n   Loading IDM from: ${path.basename(idmPath)}`);

  if (!fs.existsSync(idmPath)) {
    throw new Error(`IDM file not found: ${idmPath}`);
  }

  const idm = JSON.parse(fs.readFileSync(idmPath, 'utf-8'));

  // Basic validation
  if (!idm.meta || !idm.chapters || !idm.dimensions) {
    throw new Error('Invalid IDM structure: missing required fields (meta, chapters, dimensions)');
  }

  console.log(`   IDM validated: ${idm.dimensions.length} dimensions, ${idm.findings?.length || 0} findings`);
  return idm;
}

/**
 * Load and validate recipe
 */
function loadRecipe(recipePath) {
  console.log(`   Loading recipe from: ${path.basename(recipePath)}`);

  if (!fs.existsSync(recipePath)) {
    throw new Error(`Recipe file not found: ${recipePath}`);
  }

  const recipe = JSON.parse(fs.readFileSync(recipePath, 'utf-8'));

  // Basic validation
  if (!recipe.report_id || !recipe.name || !recipe.sections) {
    throw new Error('Invalid recipe structure: missing required fields (report_id, name, sections)');
  }

  console.log(`   Recipe validated: "${recipe.name}" with ${recipe.sections.length} sections`);
  return recipe;
}

/**
 * Generate a single report
 */
async function generateSingleReport(idm, recipe, outputDir) {
  const reportId = recipe.report_id;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${reportId}-report-${timestamp}.html`;
  const outputPath = path.join(outputDir, filename);

  console.log(`\n   Generating: ${recipe.name}`);
  console.log(`   Target pages: ${recipe.target_page_range.min}-${recipe.target_page_range.max}`);

  // Render the report
  const html = renderReport(idm, recipe);

  // Write to file
  fs.writeFileSync(outputPath, html);

  console.log(`   Output: ${filename}`);

  return {
    reportId,
    name: recipe.name,
    path: outputPath,
    filename,
    pageRange: recipe.target_page_range,
    audience: recipe.primary_audience
  };
}

/**
 * Generate all reports
 */
async function generateAllReports(idm, outputDir) {
  const reports = [];

  for (const recipeId of ALL_RECIPES) {
    try {
      const recipePath = path.join(RECIPES_DIR, `${recipeId}.json`);
      const recipe = loadRecipe(recipePath);
      const report = await generateSingleReport(idm, recipe, outputDir);
      reports.push(report);
    } catch (error) {
      console.error(`   Error generating ${recipeId}: ${error.message}`);
    }
  }

  return reports;
}

/**
 * Generate metadata file
 */
function generateMetadata(reports, idm, outputDir) {
  const metadata = {
    generated_at: new Date().toISOString(),
    idm_version: idm.meta.idm_schema_version,
    company_profile_id: idm.meta.company_profile_id,
    assessment_run_id: idm.meta.assessment_run_id,
    overall_health_score: idm.scores_summary?.overall_health_score,
    reports_generated: reports.map(r => ({
      report_id: r.reportId,
      name: r.name,
      filename: r.filename,
      audience: r.audience,
      page_range: r.pageRange
    })),
    output_directory: outputDir,
    format: 'HTML',
    version: '1.0.0'
  };

  const metadataPath = path.join(outputDir, 'reports-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  return metadataPath;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  BizHealth Recipe-Based Report Generator v1.0');
  console.log('='.repeat(60));

  // Parse arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('\nUsage:');
    console.log('  node recipe-index.js <idm-path> <recipe-path> [output-dir]');
    console.log('  node recipe-index.js <idm-path> --all [output-dir]');
    console.log('\nAvailable recipes:');
    ALL_RECIPES.forEach(r => console.log(`  - ${r}`));
    process.exit(1);
  }

  const idmPath = args[0];
  const isAllReports = args[1] === '--all';
  const recipePath = isAllReports ? null : args[1];
  const outputDir = args[isAllReports ? 2 : 2] || DEFAULT_OUTPUT_DIR;

  // Create output directory with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportOutputDir = path.join(outputDir, `reports-${timestamp}`);
  fs.mkdirSync(reportOutputDir, { recursive: true });

  console.log(`\nOutput directory: ${reportOutputDir}`);

  try {
    // Load IDM
    const idm = loadIDM(idmPath);

    let reports = [];

    if (isAllReports) {
      console.log('\n' + '-'.repeat(60));
      console.log('  Generating all 9 reports...');
      console.log('-'.repeat(60));

      reports = await generateAllReports(idm, reportOutputDir);
    } else {
      const recipe = loadRecipe(recipePath);
      const report = await generateSingleReport(idm, recipe, reportOutputDir);
      reports.push(report);
    }

    // Generate metadata
    const metadataPath = generateMetadata(reports, idm, reportOutputDir);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('  GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n  Reports generated: ${reports.length}`);

    reports.forEach(r => {
      console.log(`    - ${r.name} (${r.audience}) [${r.pageRange.min}-${r.pageRange.max} pages]`);
    });

    console.log(`\n  Output: ${reportOutputDir}`);
    console.log(`  Metadata: ${path.basename(metadataPath)}`);
    console.log('\n  Done!\n');

    return { success: true, reports, outputDir: reportOutputDir };

  } catch (error) {
    console.error(`\n  Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for programmatic use
export { loadIDM, loadRecipe, generateSingleReport, generateAllReports };

// Run if called directly
main();
