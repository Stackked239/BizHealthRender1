/**
 * Standalone Test Script for Report Generation
 *
 * This script tests report generation using existing phase outputs.
 * No API calls are needed - it uses pre-computed phase data.
 */

import { createPhase5Orchestrator } from './src/orchestration/phase5-orchestrator';

async function testReportGeneration() {
  const outputDir = './output';

  console.log('=== Report Generation Test ===\n');
  console.log('Loading phase outputs and generating reports...\n');

  // Create the orchestrator - it will only generate comprehensive and owner reports
  const orchestrator = createPhase5Orchestrator({
    reportTypes: ['comprehensive', 'owner'],
    renderPDF: false,
  });

  try {
    // Execute Phase 5 - this loads all phase outputs and generates reports
    const results = await orchestrator.executePhase5(outputDir);

    console.log('\n=== RESULTS ===');
    console.log(`Status: ${results.status}`);
    console.log(`Company: ${results.companyName}`);
    console.log(`Reports Generated: ${results.reportsGenerated}`);
    console.log(`Output Directory: ${results.outputDir}`);

    console.log('\nFiles generated:');
    for (const report of results.reports) {
      console.log(`  - ${report.reportName}: ${report.htmlPath}`);
    }

    if (results.errors && results.errors.length > 0) {
      console.log('\nErrors:');
      for (const error of results.errors) {
        console.log(`  - ${error.reportType}: ${error.error}`);
      }
    }

    console.log('\n=== SUCCESS ===');

  } catch (error) {
    console.error('Report generation failed:', error);
    process.exit(1);
  }
}

testReportGeneration();
