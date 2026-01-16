import { createPhase5Orchestrator } from './src/orchestration/phase5-orchestrator.js';
import path from 'path';

const runId = 'fe1beb8d-0a75-48ce-b00a-4635e7b4b90a';
const runOutputDir = path.join('output', runId);

console.log('Starting Phase 5 for existing run...');
console.log(`Run ID: ${runId}`);
console.log(`Output Dir: ${runOutputDir}`);
console.log('');

const orchestrator = createPhase5Orchestrator();

try {
  const results = await orchestrator.executePhase5(runOutputDir, {
    runId,
    outputDir: runOutputDir
  });

  console.log('');
  console.log('='.repeat(80));
  console.log('PHASE 5 COMPLETE');
  console.log('='.repeat(80));
  console.log(`Status: ${results.status}`);
  console.log(`Reports Generated: ${results.reportsGenerated}`);
  console.log(`Output Directory: ${results.outputDir}`);
  console.log('='.repeat(80));

  process.exit(0);
} catch (error) {
  console.error('Phase 5 failed:', error);
  process.exit(1);
}
