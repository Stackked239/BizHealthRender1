/**
 * Run Phase 4 and Phase 5 only using existing Phase 0-3 data
 *
 * This script:
 * 1. Loads existing Phase 0-3 outputs from a specified directory
 * 2. Runs Phase 4 (IDM Consolidation)
 * 3. Runs Phase 5 (Report Generation)
 */

import { consolidateIDM, IDMConsolidatorInput } from './src/orchestration/idm-consolidator.js';
import { createPhase5Orchestrator } from './src/orchestration/phase5-orchestrator.js';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase4And5() {
  // Use the most recent law firm run
  const outputDir = 'output/9b90ef63-7064-42a2-8825-516b6fb7af71';
  const fullOutputDir = path.resolve(process.cwd(), outputDir);

  console.log('================================================================================');
  console.log('BIZHEALTH PHASE 4-5 RE-RUN');
  console.log('================================================================================');
  console.log(`Output Dir: ${fullOutputDir}`);
  console.log('Phases:     4 → 5');
  console.log('================================================================================\n');

  try {
    // Load existing phase outputs
    const phase0Path = path.join(fullOutputDir, 'phase0_output.json');
    const phase1Path = path.join(fullOutputDir, 'phase1_output.json');
    const phase1_5Path = path.join(fullOutputDir, 'phase1_5_output.json');
    const phase2Path = path.join(fullOutputDir, 'phase2_output.json');
    const phase3Path = path.join(fullOutputDir, 'phase3_output.json');

    console.log('Loading existing phase outputs...');
    const phase0 = JSON.parse(fs.readFileSync(phase0Path, 'utf-8'));
    const phase1 = JSON.parse(fs.readFileSync(phase1Path, 'utf-8'));
    const phase1_5 = JSON.parse(fs.readFileSync(phase1_5Path, 'utf-8'));
    const phase2 = JSON.parse(fs.readFileSync(phase2Path, 'utf-8'));
    const phase3 = JSON.parse(fs.readFileSync(phase3Path, 'utf-8'));

    console.log('✓ Loaded Phase 0 output');
    console.log('✓ Loaded Phase 1 output');
    console.log('✓ Loaded Phase 1.5 output');
    console.log('✓ Loaded Phase 2 output');
    console.log('✓ Loaded Phase 3 output\n');

    // ────────────────────────────────────────────────────────────
    // PHASE 4: IDM Consolidation
    // ────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────');
    console.log('PHASE 4: IDM Consolidation');
    console.log('────────────────────────────────────────────────────────────');

    const phase4Start = Date.now();

    const idmInput: IDMConsolidatorInput = {
      companyProfile: phase0.output.companyProfile,
      questionnaireResponses: phase0.output.questionnaireResponses,
      phase1Results: phase1, // Phase1 output IS the results object
      phase2Results: phase2, // Phase2 output IS the results object
      phase3Results: phase3, // Phase3 output IS the results object
      assessmentRunId: phase0.assessment_run_id,
    };

    const idmResult = await consolidateIDM(idmInput);

    const phase4Duration = Date.now() - phase4Start;

    // Save Phase 4 output
    const phase4OutputPath = path.join(fullOutputDir, 'phase4_output.json');
    fs.writeFileSync(phase4OutputPath, JSON.stringify(idmResult, null, 2));

    // Save IDM output
    const idmOutputPath = path.join(fullOutputDir, 'idm_output.json');
    fs.writeFileSync(idmOutputPath, JSON.stringify(idmResult.idm, null, 2));

    console.log(`✓ Phase 4: SUCCESS`);
    console.log(`  Duration: ${phase4Duration}ms`);
    console.log(`  IDM Path: ${idmOutputPath}\n`);

    // ────────────────────────────────────────────────────────────
    // PHASE 5: Report Generation
    // ────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────');
    console.log('PHASE 5: Report Generation');
    console.log('────────────────────────────────────────────────────────────');

    const phase5Start = Date.now();

    const orchestrator = createPhase5Orchestrator({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    const runId = path.basename(fullOutputDir);

    const phase5Result = await orchestrator.executePhase5(idmOutputPath, {
      runId,
      outputDir: fullOutputDir,
    });

    const phase5Duration = Date.now() - phase5Start;

    console.log(`✓ Phase 5: SUCCESS`);
    console.log(`  Duration: ${phase5Duration}ms`);
    console.log(`  Reports Generated: ${phase5Result?.reports_generated?.length || 'Unknown'}`);
    console.log(`  Reports Dir: ${fullOutputDir}/reports/\n`);

    // Summary
    console.log('\n================================================================================');
    console.log('✅ PHASE 4-5 RE-RUN COMPLETED SUCCESSFULLY');
    console.log('================================================================================');
    console.log(`Total Duration: ${phase4Duration + phase5Duration}ms`);
    console.log(`Phase 4 Output: ${phase4OutputPath}`);
    console.log(`IDM Output: ${idmOutputPath}`);
    console.log(`Phase 5 Output: ${fullOutputDir}/phase5_output.json`);
    console.log(`Reports: ${fullOutputDir}/reports/`);
    console.log('================================================================================\n');

  } catch (error) {
    console.error('❌ Phase 4-5 re-run failed:', error);
    process.exit(1);
  }
}

runPhase4And5();
