/**
 * Run Phase 5 only using existing data from a specific output directory
 */

import { createPhase5Orchestrator } from './src/orchestration/phase5-orchestrator.js';
import path from 'path';

async function runPhase5Only() {
  // Hardcoded for this specific run
  const outputDir = 'output/e995b237-7e02-427a-8270-cc44e8b5a5a1';
  const fullOutputDir = path.resolve(process.cwd(), outputDir);

  console.log(`Running Phase 5 using data from: ${fullOutputDir}`);

  try {
    const orchestrator = createPhase5Orchestrator({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    const idmPath = path.join(fullOutputDir, 'idm_output.json');
    const runId = path.basename(fullOutputDir);

    console.log(`IDM Path: ${idmPath}`);
    console.log(`Run ID: ${runId}`);

    const result = await orchestrator.executePhase5(idmPath, {
      runId,
      outputDir: fullOutputDir,
    });

    console.log('\n✅ Phase 5 completed successfully!');
    console.log(`Reports generated: ${result.reports_generated.length}`);
    console.log(`Duration: ${result.duration_ms}ms`);
    console.log(`Output: ${fullOutputDir}/phase5_output.json`);
    console.log(`Reports: ${fullOutputDir}/reports/`);

  } catch (error) {
    console.error('❌ Phase 5 failed:', error);
    process.exit(1);
  }
}

runPhase5Only();
