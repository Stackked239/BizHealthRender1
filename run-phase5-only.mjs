/**
 * Run Phase 5 only using existing data from a specific output directory
 */

import { createPhase5Orchestrator } from './src/orchestration/phase5-orchestrator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase5Only() {
  // Get output directory from command line argument
  const outputDir = process.argv[2];

  if (!outputDir) {
    console.error('Usage: node run-phase5-only.mjs <output-directory>');
    process.exit(1);
  }

  const fullOutputDir = path.resolve(__dirname, outputDir);
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

  } catch (error) {
    console.error('❌ Phase 5 failed:', error.message);
    process.exit(1);
  }
}

runPhase5Only();
