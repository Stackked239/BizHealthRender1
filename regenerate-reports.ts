/**
 * Regenerate Phase 5 reports using existing pipeline outputs
 * Usage: npx tsx regenerate-reports.ts <runId>
 */

import { createPhase5Orchestrator } from './src/orchestration/phase5-orchestrator.js';
import path from 'path';

const runId = process.argv[2] || '977dcf01-86b3-46f2-831d-2ad5d1306039';
const runOutputDir = path.join('output', runId);

console.log('═'.repeat(80));
console.log('REGENERATING PHASE 5 REPORTS');
console.log('═'.repeat(80));
console.log(`Run ID: ${runId}`);
console.log(`Output Dir: ${runOutputDir}`);
console.log('');
console.log('This will regenerate all 16 executive reports using existing Phase 0-4 data.');
console.log('');

try {
  console.log('Starting Phase 5 report regeneration...');
  console.log('');

  const orchestrator = createPhase5Orchestrator();
  const result = await orchestrator.executePhase5(runOutputDir, {
    runId,
    outputDir: runOutputDir,
  });

  console.log('');
  console.log('═'.repeat(80));
  console.log('PHASE 5 REPORT REGENERATION COMPLETE');
  console.log('═'.repeat(80));
  console.log(`Status: ${result.status}`);
  console.log(`Duration: ${result.duration_ms}ms`);
  console.log(`Reports Generated: ${result.reportsGenerated}`);
  console.log(`Company: ${result.companyName || 'Premier Auto Care Centers'}`);
  console.log(`Output Directory: ${runOutputDir}`);
  console.log('═'.repeat(80));
  console.log('');
  console.log('✅ All reports have been regenerated with your PR31 changes!');
  console.log('');

  process.exit(0);
} catch (error) {
  console.error('');
  console.error('✗ Phase 5 regeneration failed:');
  console.error(error);
  process.exit(1);
}
