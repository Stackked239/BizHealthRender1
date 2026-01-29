/**
 * BizHealth Report Pipeline - Phase 0 Entry Point
 *
 * Phase 0: Data Capture and Normalization
 * - Phase 0A: Immutable raw data capture
 * - Phase 0B: Normalization to analysis-ready objects
 *
 * This module provides:
 * - processWebhookSubmission: Process a new webhook through Phase 0
 * - loadAssessmentForAnalysis: Load Phase 0 outputs for Phase 1+
 * - verifyAssessmentIntegrity: Verify raw data integrity
 */

import { config } from 'dotenv';
import { logger, createLogger } from './utils/logger.js';
import { formatError } from './utils/errors.js';
import {
  Phase0Orchestrator,
  createPhase0Orchestrator,
  executePhase0,
  type Phase0Config,
  type Phase0Result,
} from './orchestration/phase0-orchestrator.js';
import {
  getAssessmentIndexService,
  getNormalizedDataStorage,
} from './services/assessment-index.js';
import type { WebhookPayload } from './types/webhook.types.js';
import type {
  Phase0Output,
  NormalizedCompanyProfile,
  NormalizedQuestionnaireResponses,
  NormalizedBenchmarkData,
} from './types/normalized.types.js';
import type { CreateRawAssessmentOptions } from './types/raw-input.types.js';

// Load environment variables
config();

const moduleLogger = createLogger('phase0-entry');

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Process a webhook submission through Phase 0
 *
 * This function:
 * 1. Captures the raw payload immutably
 * 2. Normalizes company profile with snapshot
 * 3. Normalizes questionnaire responses with dimensions
 * 4. Retrieves benchmark data
 * 5. Creates index entry linking all outputs
 *
 * @param webhookPayload - The incoming webhook payload
 * @param options - Optional capture options (source, versions, etc.)
 * @returns Phase0Result with success status and output
 */
export async function processWebhookSubmission(
  webhookPayload: WebhookPayload,
  options: CreateRawAssessmentOptions = {}
): Promise<Phase0Result> {
  const startTime = Date.now();

  moduleLogger.info(
    {
      submission_id: webhookPayload.submission_id,
      company: webhookPayload.business_overview.company_name,
      event: webhookPayload.event,
    },
    'Processing webhook submission through Phase 0'
  );

  try {
    const result = await executePhase0(webhookPayload, options);

    const duration = Date.now() - startTime;

    if (result.success) {
      moduleLogger.info(
        {
          assessment_run_id: result.assessment_run_id,
          company_profile_id: result.company_profile_id,
          duration_ms: duration,
          warnings_count: result.warnings?.length || 0,
        },
        'Phase 0 processing complete'
      );
    } else {
      moduleLogger.error(
        {
          assessment_run_id: result.assessment_run_id,
          error: result.error,
          phases_completed: result.phases_completed,
          duration_ms: duration,
        },
        'Phase 0 processing failed'
      );
    }

    return result;
  } catch (error) {
    moduleLogger.error(
      {
        error: formatError(error),
        submission_id: webhookPayload.submission_id,
      },
      'Unexpected error in Phase 0 processing'
    );
    throw error;
  }
}

/**
 * Load Phase 0 outputs for Phase 1+ analysis
 *
 * This function retrieves the normalized objects needed for analysis:
 * - CompanyProfile (snapshot for the assessment)
 * - QuestionnaireResponses (normalized with dimensions)
 * - BenchmarkData (matched to company characteristics)
 *
 * @param assessmentRunId - The assessment run ID to load
 * @returns Phase0Output or null if not found/not ready
 */
export function loadAssessmentForAnalysis(assessmentRunId: string): Phase0Output | null {
  moduleLogger.info(
    { assessment_run_id: assessmentRunId },
    'Loading Phase 0 output for analysis'
  );

  const orchestrator = createPhase0Orchestrator();
  const output = orchestrator.loadPhase0Output(assessmentRunId);

  if (output) {
    moduleLogger.info(
      {
        assessment_run_id: assessmentRunId,
        company_profile_id: output.indexEntry.company_profile_id,
        cp_snapshot_id: output.companyProfile.metadata.snapshot_id,
      },
      'Phase 0 output loaded successfully'
    );
  } else {
    moduleLogger.warn(
      { assessment_run_id: assessmentRunId },
      'Phase 0 output not found or not ready'
    );
  }

  return output;
}

/**
 * Verify the integrity of a raw assessment
 *
 * Computes the hash of the stored raw data and compares
 * it to the original payload hash.
 *
 * @param companyProfileId - Company profile ID
 * @param assessmentRunId - Assessment run ID
 * @returns Verification result with valid status and details
 */
export function verifyAssessmentIntegrity(
  companyProfileId: string,
  assessmentRunId: string
): { valid: boolean; details: Record<string, unknown> } {
  moduleLogger.info(
    {
      company_profile_id: companyProfileId,
      assessment_run_id: assessmentRunId,
    },
    'Verifying assessment integrity'
  );

  const orchestrator = createPhase0Orchestrator();
  const result = orchestrator.verifyRawIntegrity(companyProfileId, assessmentRunId);

  if (result.valid) {
    moduleLogger.info(
      {
        assessment_run_id: assessmentRunId,
        valid: true,
      },
      'Assessment integrity verified'
    );
  } else {
    moduleLogger.error(
      {
        assessment_run_id: assessmentRunId,
        valid: false,
        expected_hash: result.details.expectedHash,
        actual_hash: result.details.actualHash,
      },
      'Assessment integrity verification failed'
    );
  }

  return result;
}

/**
 * Get Phase 0 pipeline statistics
 *
 * Returns counts of assessments by status and company.
 */
export function getPhase0Stats(): {
  totalEntries: number;
  byStatus: Record<string, number>;
  byCompany: Record<string, number>;
} {
  const orchestrator = createPhase0Orchestrator();
  return orchestrator.getStats();
}

/**
 * Get assessments ready for Phase 1+ analysis
 *
 * Returns a list of assessment run IDs that have completed
 * Phase 0 and are ready for analysis.
 */
export function getAssessmentsReadyForAnalysis(): string[] {
  const indexService = getAssessmentIndexService();
  const entries = indexService.getReadyForAnalysis();
  return entries.map(e => e.assessment_run_id);
}

/**
 * Mark a phase as complete for an assessment
 *
 * Call this after each phase completes to track progress.
 */
export function markPhaseComplete(
  assessmentRunId: string,
  phase: 'phase1' | 'phase2' | 'phase3' | 'phase4'
): void {
  const indexService = getAssessmentIndexService();
  indexService.markPhaseComplete(assessmentRunId, phase);

  // If phase4 is complete, update overall status
  if (phase === 'phase4') {
    indexService.updateStatus(assessmentRunId, 'analysis_complete');
  }

  moduleLogger.info(
    { assessment_run_id: assessmentRunId, phase },
    'Phase marked complete'
  );
}

// ============================================================================
// CLI Main Function
// ============================================================================

/**
 * Main function for CLI execution
 */
async function main() {
  try {
    // Check for required environment variables (none required for Phase 0)
    moduleLogger.info('Starting Phase 0 CLI');

    // Load sample webhook data
    const sampleWebhookPath = process.argv[2] || './sample_webhook.json';
    moduleLogger.info({ path: sampleWebhookPath }, 'Loading webhook data');

    const { default: webhookData } = await import(sampleWebhookPath, {
      with: { type: 'json' },
    });

    // Process through Phase 0
    const result = await processWebhookSubmission(webhookData as WebhookPayload, {
      source: 'cli',
    });

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 0 EXECUTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Assessment Run ID: ${result.assessment_run_id}`);
    console.log(`Company Profile ID: ${result.company_profile_id}`);
    console.log(`Execution Time: ${result.execution_time_ms}ms`);
    console.log('');
    console.log('Phases Completed:');
    console.log(`  - Raw Capture: ${result.phases_completed.raw_capture ? '✓' : '✗'}`);
    console.log(`  - CP Normalization: ${result.phases_completed.cp_normalization ? '✓' : '✗'}`);
    console.log(`  - QR Normalization: ${result.phases_completed.qr_normalization ? '✓' : '✗'}`);
    console.log(`  - Benchmark Retrieval: ${result.phases_completed.benchmark_retrieval ? '✓' : '✗'}`);
    console.log(`  - Index Update: ${result.phases_completed.index_update ? '✓' : '✗'}`);

    if (result.warnings && result.warnings.length > 0) {
      console.log('');
      console.log('Warnings:');
      for (const warning of result.warnings) {
        console.log(`  - ${warning}`);
      }
    }

    if (result.error) {
      console.log('');
      console.log(`Error: ${result.error}`);
    }

    if (result.output) {
      console.log('');
      console.log('Output Summary:');
      console.log(`  Company: ${result.output.companyProfile.basic_information.company_name}`);
      console.log(`  CP Snapshot ID: ${result.output.companyProfile.metadata.snapshot_id}`);
      console.log(`  Total Questions: ${result.output.questionnaireResponses.overall_metrics.total_questions}`);
      console.log(`  Questions Answered: ${result.output.questionnaireResponses.overall_metrics.total_answered}`);
      console.log(`  Completion Rate: ${result.output.questionnaireResponses.overall_metrics.completion_rate.toFixed(1)}%`);
      console.log(`  Benchmark Match: ${result.output.benchmarkData.match_level}`);
    }

    console.log('='.repeat(80) + '\n');

    // Print stats
    const stats = getPhase0Stats();
    console.log('Index Statistics:');
    console.log(`  Total Entries: ${stats.totalEntries}`);
    console.log(`  By Status:`);
    for (const [status, count] of Object.entries(stats.byStatus)) {
      if (count > 0) {
        console.log(`    - ${status}: ${count}`);
      }
    }
    console.log('');

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    moduleLogger.error({ error: formatError(error) }, 'Application error');
    console.error('\nERROR:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// ============================================================================
// Exports
// ============================================================================

export {
  Phase0Orchestrator,
  createPhase0Orchestrator,
  executePhase0,
};

export type {
  Phase0Config,
  Phase0Result,
  Phase0Output,
  NormalizedCompanyProfile,
  NormalizedQuestionnaireResponses,
  NormalizedBenchmarkData,
};

export default {
  processWebhookSubmission,
  loadAssessmentForAnalysis,
  verifyAssessmentIntegrity,
  getPhase0Stats,
  getAssessmentsReadyForAnalysis,
  markPhaseComplete,
};
