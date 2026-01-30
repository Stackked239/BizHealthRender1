/**
 * LIL Pipeline Orchestrator
 * 
 * Main controller for the Essentials Plan ($99) pipeline.
 * Coordinates all phases: 0 → 1 → 1.5 → 4 → 4.5 → 5
 * 
 * CRITICAL: Phases 2 and 3 are REMOVED in LIL pipeline.
 */

import { logger } from '../../utils/logger.js';
import { LIL_PIPELINE_CONFIG } from '../../config/lil-pipeline.config.js';
import {
  LILQuestionnaireInput,
  LILPipelineState,
  LILPhase0Output,
  LILPhase1Output,
  LILPhase1_5Output,
  LILIDMOutput,
  LILPhase4_5Output,
  LILPhase5Output
} from '../../types/lil-pipeline.types.js';
import { runLILPhase0 } from './phase0-lil-orchestrator.js';
import { runLILPhase1 } from './phase1-lil-orchestrator.js';
import { runLILPhase1_5 } from './phase1-5-lil-orchestrator.js';
import { runLILPhase4 } from './phase4-lil-orchestrator.js';
import { runLILPhase4_5 } from './phase4-5-lil-orchestrator.js';
import { runPhase5LIL } from './phase5-lil-orchestrator.js';

export interface LILPipelineOptions {
  inputData: LILQuestionnaireInput;
  outputDir: string;
  onProgress?: (state: LILPipelineState) => void;
}

export interface LILPipelineResult {
  success: boolean;
  state: LILPipelineState;
  reports?: LILPhase5Output;
  error?: string;
}

/**
 * Run the complete LIL pipeline
 */
export async function runLILPipeline(options: LILPipelineOptions): Promise<LILPipelineResult> {
  const { inputData, outputDir, onProgress } = options;
  const startTime = Date.now();
  
  // Initialize pipeline state
  const state: LILPipelineState = {
    submissionId: inputData.submissionId,
    pipelineType: 'LIL',
    status: 'processing',
    currentPhase: 'phase0',
    startedAt: new Date().toISOString(),
    outputs: {},
    metrics: {
      totalTokensUsed: 0,
      estimatedCost: 0,
      executionTimeMs: 0
    }
  };

  const updateState = (updates: Partial<LILPipelineState>) => {
    Object.assign(state, updates);
    state.metrics.executionTimeMs = Date.now() - startTime;
    onProgress?.(state);
  };

  logger.info({
    submissionId: inputData.submissionId,
    companyName: inputData.businessOverview.companyName,
    pipelineType: 'LIL'
  }, 'Starting LIL Pipeline');

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 0: Data Normalization
    // ═══════════════════════════════════════════════════════════════════════
    if (LIL_PIPELINE_CONFIG.phasesEnabled.phase0) {
      logger.info({ phase: 'phase0' }, 'Starting Phase 0: Data Normalization');
      updateState({ currentPhase: 'phase0' });

      const phase0Output = await runLILPhase0({
        input: inputData,
        outputDir
      });

      state.outputs.phase0 = phase0Output;
      logger.info({ 
        phase: 'phase0',
        overallScore: phase0Output.overallScore,
        questionCount: phase0Output.metadata.questionCount
      }, 'Phase 0 completed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Cross-Functional Analyses (5 analyses)
    // ═══════════════════════════════════════════════════════════════════════
    if (LIL_PIPELINE_CONFIG.phasesEnabled.phase1) {
      logger.info({ phase: 'phase1' }, 'Starting Phase 1: Cross-Functional Analyses');
      updateState({ currentPhase: 'phase1' });

      const phase1Output = await runLILPhase1({
        phase0Output: state.outputs.phase0!,
        businessOverview: inputData.businessOverview,
        outputDir
      });

      state.outputs.phase1 = phase1Output;
      state.metrics.totalTokensUsed += phase1Output.metadata.tokensUsed;
      state.metrics.estimatedCost += (phase1Output.metadata.tokensUsed / 1000) * 0.003;

      logger.info({ 
        phase: 'phase1',
        analysesCount: phase1Output.analyses.length,
        tokensUsed: phase1Output.metadata.tokensUsed
      }, 'Phase 1 completed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1.5: Category Deep Dives (12 categories)
    // ═══════════════════════════════════════════════════════════════════════
    if (LIL_PIPELINE_CONFIG.phasesEnabled.phase1_5) {
      logger.info({ phase: 'phase1_5' }, 'Starting Phase 1.5: Category Deep Dives');
      updateState({ currentPhase: 'phase1_5' });

      const phase1_5Output = await runLILPhase1_5({
        phase0Output: state.outputs.phase0!,
        phase1Output: state.outputs.phase1!,
        businessOverview: inputData.businessOverview,
        outputDir
      });

      state.outputs.phase1_5 = phase1_5Output;
      state.metrics.totalTokensUsed += phase1_5Output.metadata.tokensUsed;
      state.metrics.estimatedCost += (phase1_5Output.metadata.tokensUsed / 1000) * 0.003;

      logger.info({ 
        phase: 'phase1_5',
        categoriesAnalyzed: phase1_5Output.categoryAnalyses.length,
        tokensUsed: phase1_5Output.metadata.tokensUsed
      }, 'Phase 1.5 completed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2 & 3: SKIPPED IN LIL PIPELINE
    // ═══════════════════════════════════════════════════════════════════════
    logger.info('Phases 2 and 3 are skipped in LIL pipeline');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: IDM Assembly (Simplified)
    // ═══════════════════════════════════════════════════════════════════════
    if (LIL_PIPELINE_CONFIG.phasesEnabled.phase4) {
      logger.info({ phase: 'phase4' }, 'Starting Phase 4: IDM Assembly');
      updateState({ currentPhase: 'phase4' });

      const phase4Output = await runLILPhase4({
        phase0Output: state.outputs.phase0!,
        phase1Output: state.outputs.phase1!,
        phase1_5Output: state.outputs.phase1_5!,
        businessOverview: inputData.businessOverview,
        outputDir
      });

      state.outputs.phase4 = phase4Output;
      logger.info({ phase: 'phase4' }, 'Phase 4 completed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4.5: BLUF Generation (8 BLUFs)
    // ═══════════════════════════════════════════════════════════════════════
    if (LIL_PIPELINE_CONFIG.phasesEnabled.phase4_5) {
      logger.info({ phase: 'phase4_5' }, 'Starting Phase 4.5: BLUF Generation');
      updateState({ currentPhase: 'phase4_5' });

      const phase4_5Output = await runLILPhase4_5({
        idmOutput: state.outputs.phase4!,
        outputDir
      });

      state.outputs.phase4_5 = phase4_5Output;
      state.metrics.totalTokensUsed += phase4_5Output.metadata.tokensUsed;
      state.metrics.estimatedCost += (phase4_5Output.metadata.tokensUsed / 1000) * 0.003;

      logger.info({ 
        phase: 'phase4_5',
        blufsGenerated: Object.keys(phase4_5Output.blufs).length,
        tokensUsed: phase4_5Output.metadata.tokensUsed
      }, 'Phase 4.5 completed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Report Generation (8 reports)
    // ═══════════════════════════════════════════════════════════════════════
    if (LIL_PIPELINE_CONFIG.phasesEnabled.phase5) {
      logger.info({ phase: 'phase5' }, 'Starting Phase 5: Report Generation');
      updateState({ currentPhase: 'phase5' });

      const phase5Output = await runPhase5LIL({
        idmOutput: state.outputs.phase4!,
        blufsOutput: state.outputs.phase4_5!,
        businessOverview: inputData.businessOverview,
        outputDir
      });

      state.outputs.phase5 = phase5Output;
      state.metrics.totalTokensUsed += phase5Output.metadata.tokensUsed;
      state.metrics.estimatedCost += (phase5Output.metadata.tokensUsed / 1000) * 0.003;

      logger.info({ 
        phase: 'phase5',
        reportsGenerated: phase5Output.reports.length,
        totalPages: phase5Output.metadata.totalPages,
        tokensUsed: phase5Output.metadata.tokensUsed
      }, 'Phase 5 completed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PIPELINE COMPLETE
    // ═══════════════════════════════════════════════════════════════════════
    state.status = 'completed';
    state.currentPhase = 'complete';
    state.completedAt = new Date().toISOString();
    state.metrics.executionTimeMs = Date.now() - startTime;

    logger.info({
      submissionId: inputData.submissionId,
      executionTimeMs: state.metrics.executionTimeMs,
      totalTokensUsed: state.metrics.totalTokensUsed,
      estimatedCost: state.metrics.estimatedCost.toFixed(2),
      reportsGenerated: state.outputs.phase5?.reports.length || 0
    }, 'LIL Pipeline completed successfully');

    return {
      success: true,
      state,
      reports: state.outputs.phase5
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    state.status = 'failed';
    state.error = errorMessage;
    state.metrics.executionTimeMs = Date.now() - startTime;

    logger.error({
      submissionId: inputData.submissionId,
      phase: state.currentPhase,
      error: errorMessage
    }, 'LIL Pipeline failed');

    return {
      success: false,
      state,
      error: errorMessage
    };
  }
}

/**
 * Validate that the input is suitable for LIL pipeline
 */
export function validateLILInput(input: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.submissionId) {
    errors.push('Missing submissionId');
  }

  if (!input.businessOverview?.companyName) {
    errors.push('Missing company name');
  }

  if (!input.responses || !Array.isArray(input.responses)) {
    errors.push('Missing or invalid responses array');
  } else if (input.responses.length < 40 || input.responses.length > 50) {
    errors.push(`Expected 40-50 responses for LIL pipeline, got ${input.responses.length}`);
  }

  // Check for required question IDs
  const requiredQuestionIds = ['LQ001', 'LQ010', 'LQ020', 'LQ030', 'LQ040', 'LQ045'];
  const responseIds = new Set(input.responses?.map((r: any) => r.questionId) || []);
  
  for (const reqId of requiredQuestionIds) {
    if (!responseIds.has(reqId)) {
      errors.push(`Missing required question: ${reqId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
