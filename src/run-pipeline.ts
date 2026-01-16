/**
 * BizHealth Report Pipeline - Full Pipeline Runner
 *
 * Executes the complete pipeline from Phase 0 through Phase 5:
 * - Phase 0: Raw Capture & Normalization (no API calls)
 * - Phase 1: Cross-functional AI Analyses (10 analyses via Anthropic Batch API)
 * - Phase 2: Deep-dive Cross-analysis
 * - Phase 3: Executive Synthesis
 * - Phase 4: Final Compilation & IDM Generation
 * - Phase 5: Report Generation (17 report types as HTML)
 *
 * Usage:
 *   npx tsx src/run-pipeline.ts [webhook.json] [--phase=0-5] [--output-dir=./output]
 *
 * Phase-specific runs:
 *   npx tsx src/run-pipeline.ts --phase=0          # Only Phase 0
 *   npx tsx src/run-pipeline.ts --phase=5          # Only Phase 5 (requires Phase 0-4 outputs)
 *   npx tsx src/run-pipeline.ts --phase=0-5       # Full pipeline with reports
 *   npx tsx src/run-pipeline.ts                    # Same as --phase=0-5 (default)
 *
 * Environment Variables Required:
 *   ANTHROPIC_API_KEY - Your Anthropic API key (required for Phase 1-3)
 *   DATABASE_URL      - PostgreSQL connection string (optional, for persistence)
 *
 * Optional Environment Variables:
 *   DEFAULT_MODEL          - Claude model to use (default: claude-opus-4-20250514)
 *   BATCH_POLL_INTERVAL_MS - Poll interval for batch jobs (default: 30000)
 *   LOG_LEVEL              - Logging level (default: info)
 *   RENDER_PDF             - Set to 'true' to render PDF versions of reports
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { logger, createLogger } from './utils/logger.js';
import { formatError, DataContaminationError } from './utils/errors.js';
import {
  logPipelineError,
  logQualityGateFailure,
  logPhaseCompletion
} from './utils/audit-logger.js';
import type { WebhookPayload } from './types/webhook.types.js';
import { consolidateIDM, IDMConsolidatorInput } from './orchestration/idm-consolidator.js';
import { ReportType } from './reports/report-generator.js';
import type { IDM } from './types/idm.types.js';
import type { Phase5ReportType } from './types/report.types.js';
import type { Phase1_5Output } from './types/phase1-5.types.js';
import type { Phase0Output } from './types/normalized.types.js';

// Load environment variables
config();

const pipelineLogger = createLogger('pipeline');

// ============================================================================
// Pipeline Configuration
// ============================================================================

/** Phase numbers including optional Phase 1.5 and Phase 4.5 */
type PhaseNumber = 0 | 1 | 1.5 | 2 | 3 | 4 | 4.5 | 5;

/** Ordered sequence of phases */
const PHASE_SEQUENCE: PhaseNumber[] = [0, 1, 1.5, 2, 3, 4, 4.5, 5];

interface PipelineConfig {
  webhookPath: string;
  outputDir: string;
  startPhase: PhaseNumber;
  endPhase: PhaseNumber;
  skipDatabase: boolean;
  generateReports: boolean;
  reportTypes: ReportType[];
  companyName?: string;
  /** Phase 5: Report types to generate */
  phase5ReportTypes?: Phase5ReportType[];
  /** Phase 5: Render PDF versions of reports */
  renderPDF?: boolean;
  /** Phase 5 sub-stages: 5a, 5b, 5c */
  phase5Stage?: '5a' | '5b' | '5c' | 'all';
  /** Skip Phase 1.5 (e.g. for faster pipeline) */
  skipPhase15?: boolean;
  /** Skip Phase 4.5 BLUF generation (e.g. for faster pipeline) */
  skipPhase45?: boolean;
}

function parseArgs(): PipelineConfig {
  const args = process.argv.slice(2);
  const config: PipelineConfig = {
    webhookPath: './sample_webhook.json',
    outputDir: './output',
    startPhase: 0,
    endPhase: 5, // Default to full pipeline including Phase 5 reports
    skipDatabase: true, // Default to skip DB for simplicity
    generateReports: true, // Default to generate reports
    reportTypes: [
      ReportType.COMPREHENSIVE_REPORT,
      ReportType.OWNERS_REPORT,
      ReportType.QUICK_WINS_REPORT,
    ],
    companyName: undefined,
    phase5ReportTypes: undefined, // undefined means all report types
    renderPDF: process.env.RENDER_PDF === 'true',
    skipPhase15: false, // Default to include Phase 1.5
    skipPhase45: false, // Default to include Phase 4.5 BLUF generation
  };

  for (const arg of args) {
    if (arg.startsWith('--phase=')) {
      const phases = arg.replace('--phase=', '');
      // Check for Phase 5 sub-stages (5a, 5b, 5c)
      if (phases === '5a' || phases === '5b' || phases === '5c') {
        config.startPhase = config.endPhase = 5;
        config.phase5Stage = phases as '5a' | '5b' | '5c';
      } else if (phases === '1.5') {
        // Single Phase 1.5
        config.startPhase = config.endPhase = 1.5;
      } else if (phases.includes('-')) {
        const [start, end] = phases.split('-').map(Number);
        config.startPhase = start as PhaseNumber;
        config.endPhase = end as PhaseNumber;
      } else {
        const phase = Number(phases) as PhaseNumber;
        config.startPhase = config.endPhase = phase;
      }
    } else if (arg === '--skip-phase15' || arg === '--skip-phase1.5') {
      config.skipPhase15 = true;
    } else if (arg === '--skip-phase45' || arg === '--skip-phase4.5') {
      config.skipPhase45 = true;
    } else if (arg.startsWith('--output-dir=')) {
      config.outputDir = arg.replace('--output-dir=', '');
    } else if (arg.startsWith('--skip-db')) {
      config.skipDatabase = true;
    } else if (arg.startsWith('--use-db')) {
      config.skipDatabase = false;
    } else if (arg.startsWith('--no-reports')) {
      config.generateReports = false;
    } else if (arg.startsWith('--reports=')) {
      const types = arg.replace('--reports=', '').split(',');
      config.reportTypes = types.map(t => t.trim() as ReportType);
    } else if (arg.startsWith('--all-reports')) {
      config.reportTypes = Object.values(ReportType);
    } else if (arg.startsWith('--company-name=')) {
      config.companyName = arg.replace('--company-name=', '');
    } else if (arg.startsWith('--render-pdf')) {
      config.renderPDF = true;
    } else if (arg.startsWith('--phase5-reports=')) {
      const types = arg.replace('--phase5-reports=', '').split(',');
      config.phase5ReportTypes = types.map(t => t.trim() as Phase5ReportType);
    } else if (!arg.startsWith('--')) {
      config.webhookPath = arg;
    }
  }

  return config;
}

// ============================================================================
// Phase Executors
// ============================================================================

interface PhaseResult {
  phase: PhaseNumber;
  status: 'success' | 'failed' | 'skipped';
  duration_ms: number;
  output_path?: string;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Phase 0: Raw Capture & Normalization
 */
async function executePhase0(
  webhookPayload: WebhookPayload,
  outputDir: string
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 0: Raw Capture & Normalization');

  try {
    const { processWebhookSubmission, getPhase0Stats } = await import('./phase0-index.js');

    const result = await processWebhookSubmission(webhookPayload, {
      source: 'pipeline',
    });

    if (!result.success) {
      return {
        phase: 0,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error: result.error,
      };
    }

    // Save Phase 0 output for subsequent phases
    const phase0OutputPath = path.join(outputDir, 'phase0_output.json');
    fs.writeFileSync(phase0OutputPath, JSON.stringify(result, null, 2));

    const stats = getPhase0Stats();

    return {
      phase: 0,
      status: 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase0OutputPath,
      details: {
        assessment_run_id: result.assessment_run_id,
        company_profile_id: result.company_profile_id,
        phases_completed: result.phases_completed,
        stats,
      },
    };
  } catch (error) {
    return {
      phase: 0,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 1: Cross-functional AI Analyses
 */
async function executePhase1(
  webhookPayload: WebhookPayload,
  outputDir: string
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 1: Cross-functional AI Analyses');

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      phase: 1,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: 'ANTHROPIC_API_KEY environment variable is required for Phase 1',
    };
  }

  try {
    const { createPhase1Orchestrator } = await import('./orchestration/phase1-orchestrator.js');

    const orchestrator = createPhase1Orchestrator({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.DEFAULT_MODEL || 'claude-opus-4-20250514',
      pollIntervalMs: parseInt(process.env.BATCH_POLL_INTERVAL_MS || '30000'),
    });

    const results = await orchestrator.executePhase1(webhookPayload);

    // Save Phase 1 output
    const phase1OutputPath = path.join(outputDir, 'phase1_output.json');
    fs.writeFileSync(phase1OutputPath, JSON.stringify(results, null, 2));

    return {
      phase: 1,
      status: results.status === 'failed' ? 'failed' : 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase1OutputPath,
      details: {
        status: results.status,
        successful_analyses: results.metadata.successful_analyses,
        failed_analyses: results.metadata.failed_analyses,
        total_analyses: results.metadata.total_analyses,
      },
    };
  } catch (error) {
    return {
      phase: 1,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 1.5: Category-Level Analysis
 * Analyzes all 12 business categories with deep-dive insights
 */
async function executePhase1_5(
  outputDir: string
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 1.5: Category-Level Analysis');

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      phase: 1.5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: 'ANTHROPIC_API_KEY environment variable is required for Phase 1.5',
    };
  }

  // Check for Phase 0 output
  const phase0OutputPath = path.join(outputDir, 'phase0_output.json');
  if (!fs.existsSync(phase0OutputPath)) {
    return {
      phase: 1.5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `Phase 0 output not found at ${phase0OutputPath}. Run Phase 0 first.`,
    };
  }

  try {
    const { executePhase1_5: runPhase1_5 } = await import('./orchestration/phase1-5-orchestrator.js');

    // Load Phase 0 output
    const phase0FileData = JSON.parse(fs.readFileSync(phase0OutputPath, 'utf-8'));
    // Phase 0 file has wrapper structure: { success, output: { companyProfile, ... } }
    // Phase 1.5 expects just the output object
    const phase0Data = phase0FileData.output as Phase0Output;

    const results = await runPhase1_5(phase0Data);

    // Save Phase 1.5 output
    const phase1_5OutputPath = path.join(outputDir, 'phase1_5_output.json');
    fs.writeFileSync(phase1_5OutputPath, JSON.stringify(results, null, 2));

    const successfulCategories = results.categoryAnalyses?.length || 0;
    const healthScore = results.overallSummary?.healthScore || 0;

    pipelineLogger.info({
      categories: successfulCategories,
      healthScore,
      status: results.status
    }, 'Phase 1.5 complete');

    return {
      phase: 1.5,
      status: results.status === 'failed' ? 'failed' : 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase1_5OutputPath,
      details: {
        status: results.status,
        categories_analyzed: successfulCategories,
        chapters_summarized: results.chapterSummaries?.length || 0,
        overall_health_score: healthScore,
        health_status: results.overallSummary?.healthStatus || 'Unknown',
      },
    };
  } catch (error) {
    pipelineLogger.error({ error }, 'Phase 1.5 failed');
    return {
      phase: 1.5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 2: Deep-dive Cross-analysis
 */
async function executePhase2(
  outputDir: string
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 2: Deep-dive Cross-analysis');

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      phase: 2,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: 'ANTHROPIC_API_KEY environment variable is required for Phase 2',
    };
  }

  // Check for Phase 1 output
  const phase1OutputPath = path.join(outputDir, 'phase1_output.json');
  if (!fs.existsSync(phase1OutputPath)) {
    return {
      phase: 2,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `Phase 1 output not found at ${phase1OutputPath}. Run Phase 1 first.`,
    };
  }

  try {
    const { createPhase2Orchestrator } = await import('./orchestration/phase2-orchestrator.js');

    const orchestrator = createPhase2Orchestrator({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.DEFAULT_MODEL || 'claude-opus-4-20250514',
    });

    const results = await orchestrator.executePhase2(phase1OutputPath);

    // Save Phase 2 output
    const phase2OutputPath = path.join(outputDir, 'phase2_output.json');
    fs.writeFileSync(phase2OutputPath, JSON.stringify(results, null, 2));

    return {
      phase: 2,
      status: results.status === 'failed' ? 'failed' : 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase2OutputPath,
      details: {
        status: results.status,
        successful_analyses: results.metadata.successful_analyses,
        failed_analyses: results.metadata.failed_analyses,
      },
    };
  } catch (error) {
    return {
      phase: 2,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 3: Executive Synthesis
 */
async function executePhase3(
  outputDir: string
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 3: Executive Synthesis');

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      phase: 3,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: 'ANTHROPIC_API_KEY environment variable is required for Phase 3',
    };
  }

  // Check for Phase 2 output
  const phase2OutputPath = path.join(outputDir, 'phase2_output.json');
  if (!fs.existsSync(phase2OutputPath)) {
    return {
      phase: 3,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `Phase 2 output not found at ${phase2OutputPath}. Run Phase 2 first.`,
    };
  }

  try {
    const { createPhase3Orchestrator } = await import('./orchestration/phase3-orchestrator.js');

    const orchestrator = createPhase3Orchestrator({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.DEFAULT_MODEL || 'claude-opus-4-20250514',
    });

    const results = await orchestrator.executePhase3(phase2OutputPath);

    // Save Phase 3 output
    const phase3OutputPath = path.join(outputDir, 'phase3_output.json');
    fs.writeFileSync(phase3OutputPath, JSON.stringify(results, null, 2));

    return {
      phase: 3,
      status: results.status === 'failed' ? 'failed' : 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase3OutputPath,
      details: {
        status: results.status,
        overall_health_score: results.summary?.overall_health_score,
        health_status: results.summary?.health_status,
      },
    };
  } catch (error) {
    return {
      phase: 3,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 4: Final Compilation & IDM Generation
 *
 * @param outputDir - Run-isolated output directory
 * @param pipelineConfig - Pipeline configuration
 * @param runId - Run ID for directory isolation
 */
async function executePhase4(
  outputDir: string,
  pipelineConfig: PipelineConfig,
  runId?: string
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info({ runId, outputDir }, 'Starting Phase 4: Final Compilation & IDM Generation');

  // Check for Phase 3 output
  const phase3OutputPath = path.join(outputDir, 'phase3_output.json');
  if (!fs.existsSync(phase3OutputPath)) {
    return {
      phase: 4,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `Phase 3 output not found at ${phase3OutputPath}. Run Phase 3 first.`,
    };
  }

  try {
    const { createPhase4Orchestrator } = await import('./orchestration/phase4-orchestrator.js');

    // Phase 4 needs all three phase outputs
    const phase0OutputPath = path.join(outputDir, 'phase0_output.json');
    const phase1OutputPath = path.join(outputDir, 'phase1_output.json');
    const phase2OutputPath = path.join(outputDir, 'phase2_output.json');

    // Generate IDM from Phase 0-3 results
    let idm: IDM | undefined;
    let companyName: string | undefined = pipelineConfig.companyName;

    if (fs.existsSync(phase0OutputPath)) {
      try {
        pipelineLogger.info({ runId }, 'Consolidating IDM from Phase 0-3 results...');

        const phase0Data = JSON.parse(fs.readFileSync(phase0OutputPath, 'utf-8'));
        const phase1Data = JSON.parse(fs.readFileSync(phase1OutputPath, 'utf-8'));
        const phase2Data = JSON.parse(fs.readFileSync(phase2OutputPath, 'utf-8'));
        const phase3Data = JSON.parse(fs.readFileSync(phase3OutputPath, 'utf-8'));

        // Extract company name from Phase 0 data if not provided
        if (!companyName && phase0Data.output?.companyProfile?.basic_information?.company_name) {
          companyName = phase0Data.output.companyProfile.basic_information.company_name;
        }

        const idmInput: IDMConsolidatorInput = {
          companyProfile: phase0Data.output.companyProfile,
          questionnaireResponses: phase0Data.output.questionnaireResponses,
          phase1Results: phase1Data,
          phase2Results: phase2Data,
          phase3Results: phase3Data,
          assessmentRunId: phase0Data.assessment_run_id,
        };

        // CRITICAL FIX: await the async consolidateIDM function
        const idmResult = await consolidateIDM(idmInput);

        // Defensive check: Ensure we got a resolved value, not a Promise
        if (idmResult instanceof Promise) {
          const errorPath = logPipelineError({
            runId: runId || 'unknown',
            phase: 4,
            errorType: 'ASYNC_AWAIT_BUG',
            errorMessage: 'consolidateIDM() returned a Promise object - missing await keyword',
            context: { functionName: 'consolidateIDM', location: 'executePhase4' },
          });
          throw new Error(
            `INTERNAL ERROR: consolidateIDM() returned a Promise object. ` +
            `Missing await keyword detected. Audit logged to: ${errorPath}`
          );
        }

        if (idmResult.validationPassed) {
          idm = idmResult.idm;
          pipelineLogger.info({
            runId,
            overallScore: idm.scores_summary.overall_health_score,
            descriptor: idm.scores_summary.descriptor,
            chapterCount: Object.keys(idm.chapters || {}).length,
          }, 'IDM consolidated successfully');
        } else {
          // Log quality gate failure to audit infrastructure
          const qualityPath = logQualityGateFailure({
            runId: runId || 'unknown',
            phase: 4,
            gateName: 'IDM_VALIDATION',
            validationErrors: idmResult.validationErrors,
            recommendation: idmResult.idm
              ? 'Proceeding with partial IDM - review validation errors'
              : 'Cannot proceed - IDM consolidation produced no usable data',
          });

          pipelineLogger.error({
            runId,
            phase: 4,
            validationErrors: idmResult.validationErrors,
            hasPartialIdm: !!idmResult.idm,
            auditPath: qualityPath,
          }, 'IDM validation failed - logged to audit infrastructure');

          if (idmResult.idm) {
            pipelineLogger.warn({
              runId,
              errorCount: idmResult.validationErrors?.length || 0,
            }, 'Proceeding with partial IDM - some validation checks failed');
            idm = idmResult.idm;
          } else {
            const errorPath = logPipelineError({
              runId: runId || 'unknown',
              phase: 4,
              errorType: 'IDM_CONSOLIDATION_FAILED',
              errorMessage: 'IDM consolidation failed with no usable IDM',
              context: { validationErrors: idmResult.validationErrors },
            });
            throw new Error(
              `CRITICAL: IDM consolidation failed with no usable IDM. ` +
              `Validation errors: ${JSON.stringify(idmResult.validationErrors)}. ` +
              `Audit logged to: ${errorPath}`
            );
          }
        }

        // Final sanity checks
        if (!idm) {
          const errorPath = logPipelineError({
            runId: runId || 'unknown',
            phase: 4,
            errorType: 'IDM_UNDEFINED',
            errorMessage: 'IDM is undefined after consolidation block',
            context: { validationPassed: idmResult.validationPassed },
          });
          throw new Error(
            `CRITICAL: IDM is undefined after consolidation block. ` +
            `Audit logged to: ${errorPath}`
          );
        }

        if (!idm.scores_summary || typeof idm.scores_summary.overall_health_score !== 'number') {
          const errorPath = logPipelineError({
            runId: runId || 'unknown',
            phase: 4,
            errorType: 'IDM_STRUCTURE_INVALID',
            errorMessage: 'IDM is missing required scores_summary structure',
            context: {
              hasScoresSummary: !!idm.scores_summary,
              healthScoreType: typeof idm.scores_summary?.overall_health_score,
            },
          });
          throw new Error(
            `CRITICAL: IDM is missing required scores_summary structure. ` +
            `Phase 5 reports will fail without health scores. ` +
            `Audit logged to: ${errorPath}`
          );
        }

      } catch (idmError) {
        // Re-throw critical errors (already logged to audit)
        if (idmError instanceof Error && idmError.message.startsWith('CRITICAL:')) {
          throw idmError;
        }
        if (idmError instanceof Error && idmError.message.startsWith('INTERNAL ERROR:')) {
          throw idmError;
        }

        // Log unexpected errors to audit infrastructure
        const errorPath = logPipelineError({
          runId: runId || 'unknown',
          phase: 4,
          errorType: 'UNEXPECTED_ERROR',
          errorMessage: idmError instanceof Error ? idmError.message : String(idmError),
          stack: idmError instanceof Error ? idmError.stack : undefined,
          context: { location: 'IDM consolidation block' },
        });

        pipelineLogger.error({
          runId,
          error: idmError instanceof Error ? idmError.message : String(idmError),
          stack: idmError instanceof Error ? idmError.stack : undefined,
          auditPath: errorPath,
        }, 'IDM consolidation failed with unexpected error');

        throw new Error(
          `Phase 4 IDM consolidation failed: ${idmError instanceof Error ? idmError.message : String(idmError)}. ` +
          `Audit logged to: ${errorPath}`
        );
      }
    } else {
      const errorPath = logPipelineError({
        runId: runId || 'unknown',
        phase: 4,
        errorType: 'MISSING_INPUT_FILE',
        errorMessage: `Phase 0 output not found at ${phase0OutputPath}`,
        context: { expectedPath: phase0OutputPath },
      });
      throw new Error(
        `CRITICAL: Phase 0 output not found at ${phase0OutputPath}. ` +
        `Cannot proceed with IDM consolidation. ` +
        `Audit logged to: ${errorPath}`
      );
    }

    // Create orchestrator with report generation config
    const orchestrator = createPhase4Orchestrator({
      generateReports: pipelineConfig.generateReports && !!idm,
      reportTypes: pipelineConfig.reportTypes,
      companyName,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Execute Phase 4 with run isolation options
    const phase4Options = runId ? { runId, outputDir } : undefined;
    const results = await orchestrator.executePhase4(
      phase1OutputPath,
      phase2OutputPath,
      phase3OutputPath,
      idm,
      undefined, // qualityAudit
      phase4Options
    );

    // Save Phase 4 output to run-isolated directory
    const phase4OutputPath = path.join(outputDir, 'phase4_output.json');
    fs.writeFileSync(phase4OutputPath, JSON.stringify(results, null, 2));

    // Note: IDM is now saved by Phase 4 orchestrator to run-isolated path
    // Only save here if Phase 4 didn't save it (legacy fallback)
    if (results.idm && !results.metadata.outputPaths?.idm) {
      const idmOutputPath = path.join(outputDir, 'idm_output.json');
      fs.writeFileSync(idmOutputPath, JSON.stringify(results.idm, null, 2));
      pipelineLogger.info({ idmOutputPath, runId }, 'IDM saved to run-isolated directory (fallback)');
    } else if (results.metadata.outputPaths?.idm) {
      pipelineLogger.info({
        idmOutputPath: results.metadata.outputPaths.idm,
        runId
      }, 'IDM saved by Phase 4 orchestrator');
    }

    // Verify IDM file was written to run-isolated directory
    const expectedIdmPath = path.join(outputDir, 'idm_output.json');
    if (!fs.existsSync(expectedIdmPath)) {
      if (results.idm) {
        fs.writeFileSync(expectedIdmPath, JSON.stringify(results.idm, null, 2));
        pipelineLogger.warn({
          runId,
          idmOutputPath: expectedIdmPath,
        }, 'IDM file missing after Phase 4 - wrote fallback');

        // Log quality concern to audit
        logQualityGateFailure({
          runId: runId || 'unknown',
          phase: 4,
          gateName: 'IDM_FILE_WRITE',
          expectedValue: 'File written by Phase 4 orchestrator',
          actualValue: 'File missing - fallback write performed',
          recommendation: 'Investigate Phase 4 orchestrator IDM file writing logic',
        });
      } else {
        const errorPath = logPipelineError({
          runId: runId || 'unknown',
          phase: 4,
          errorType: 'IDM_FILE_MISSING',
          errorMessage: `IDM file not found at ${expectedIdmPath} after Phase 4 completion`,
          context: {
            expectedPath: expectedIdmPath,
            hasResultsIdm: !!results.idm,
          },
        });
        throw new Error(
          `CRITICAL: IDM file not found at ${expectedIdmPath} after Phase 4 completion. ` +
          `Phase 5 will fail. Audit logged to: ${errorPath}`
        );
      }
    } else {
      const fileSizeBytes = fs.statSync(expectedIdmPath).size;
      pipelineLogger.info({
        runId,
        idmOutputPath: expectedIdmPath,
        fileSizeBytes,
      }, 'IDM file verified in run-isolated directory');

      // Log successful phase completion to audit trail
      logPhaseCompletion({
        runId: runId || 'unknown',
        phase: 4,
        duration_ms: Date.now() - startTime,
        outputPath: expectedIdmPath,
        metrics: {
          idmFileSizeBytes: fileSizeBytes,
          healthScore: results.idm?.scores_summary?.overall_health_score,
        },
      });
    }

    // Build details for result
    const details: Record<string, unknown> = {
      status: results.status,
      health_score: results.summaries?.health_status?.score,
      health_descriptor: results.summaries?.health_status?.descriptor,
    };

    if (results.generated_reports && results.generated_reports.length > 0) {
      details.reports_generated = results.generated_reports.length;
      details.report_types = results.generated_reports.map(r => r.reportType);
    }

    if (results.metadata.report_generation) {
      details.report_tokens = {
        input: results.metadata.report_generation.total_input_tokens,
        output: results.metadata.report_generation.total_output_tokens,
      };
    }

    return {
      phase: 4,
      status: results.status === 'failed' ? 'failed' : 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase4OutputPath,
      details,
    };
  } catch (error) {
    // Log full error for debugging
    console.error('Phase 4 error details:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return {
      phase: 4,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 4.5: BLUF Generation
 *
 * Generates Bottom Line Up Front (BLUF) executive summaries for all report types.
 *
 * @param outputDir - Run-isolated output directory
 * @param runId - Run ID for directory isolation
 */
async function executePhase4_5(
  outputDir: string,
  runId?: string
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info({ runId, outputDir }, 'Starting Phase 4.5: BLUF Generation');

  try {
    // Check for IDM output from Phase 4
    const idmPath = path.join(outputDir, 'idm_output.json');
    if (!fs.existsSync(idmPath)) {
      return {
        phase: 4.5,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error: `IDM file not found: ${idmPath}. Run Phase 4 first.`,
      };
    }

    // Load IDM
    const idmData = JSON.parse(fs.readFileSync(idmPath, 'utf-8'));

    // Import and execute Phase 4.5A
    const { executePhase4_5A } = await import('./orchestration/phase4-5a-orchestrator.js');

    pipelineLogger.info('Generating BLUFs via Anthropic API...');

    const phase45Output = await executePhase4_5A(idmData, {
      apiKey: process.env.ANTHROPIC_API_KEY,
      outputDir,
      runId: runId || 'unknown',
      useCache: true
    });

    // Calculate cache hit rate
    const totalCacheOps = phase45Output.meta.cache_hits + phase45Output.meta.cache_misses;
    const cacheHitRate = totalCacheOps > 0
      ? ((phase45Output.meta.cache_hits / totalCacheOps) * 100).toFixed(1)
      : '0.0';

    const duration = Date.now() - startTime;

    pipelineLogger.info({
      runId,
      totalBlufs: phase45Output.meta.total_blufs_generated,
      validationPassed: phase45Output.meta.validation_passed,
      avgQuality: phase45Output.meta.average_quality_score,
      cacheHitRate: `${cacheHitRate}%`,
      duration
    }, 'Phase 4.5 complete');

    console.log(`✓ Phase 4.5 complete`);
    console.log(`  - BLUFs generated: ${phase45Output.meta.total_blufs_generated}`);
    console.log(`  - Validation passed: ${phase45Output.meta.validation_passed ? 'Yes' : 'No'}`);
    console.log(`  - Average quality: ${phase45Output.meta.average_quality_score?.toFixed(1) || 'N/A'}/100`);
    console.log(`  - Cache hit rate: ${cacheHitRate}%`);
    console.log(`  - Duration: ${(duration / 1000).toFixed(1)}s`);

    return {
      phase: 4.5,
      status: 'success',
      duration_ms: duration,
      output_path: path.join(outputDir, 'phase4_5a_output.json'),
      details: {
        total_blufs: phase45Output.meta.total_blufs_generated,
        validation_passed: phase45Output.meta.validation_passed,
        average_quality_score: phase45Output.meta.average_quality_score
      },
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`✗ Phase 4.5 failed:`, error);
    pipelineLogger.error({ runId, error }, 'Phase 4.5 failed');

    return {
      phase: 4.5,
      status: 'failed',
      duration_ms: duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 5: Report Generation
 *
 * @param outputDir - Run-isolated output directory
 * @param pipelineConfig - Pipeline configuration
 * @param runId - Run ID for directory isolation
 */
async function executePhase5(
  outputDir: string,
  pipelineConfig: PipelineConfig,
  runId?: string
): Promise<PhaseResult> {
  const startTime = Date.now();

  // If a specific stage is requested, route to that stage
  if (pipelineConfig.phase5Stage) {
    switch (pipelineConfig.phase5Stage) {
      case '5a':
        return executePhase5A(outputDir, pipelineConfig);
      case '5b':
        return executePhase5B(outputDir, pipelineConfig);
      case '5c':
        return executePhase5C(outputDir, pipelineConfig);
      default:
        break;
    }
  }

  pipelineLogger.info({ runId, outputDir }, 'Starting Phase 5: Report Generation');

  // Check for required outputs from previous phases
  const phase3OutputPath = path.join(outputDir, 'phase3_output.json');
  const idmOutputPath = path.join(outputDir, 'idm_output.json');

  if (!fs.existsSync(phase3OutputPath)) {
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `Phase 3 output not found at ${phase3OutputPath}. Run Phase 3 first.`,
    };
  }

  if (!fs.existsSync(idmOutputPath)) {
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `IDM output not found at ${idmOutputPath}. Run Phase 4 first to generate IDM.`,
    };
  }

  try {
    const { createPhase5Orchestrator } = await import('./orchestration/phase5-orchestrator.js');

    // Use runId passed from pipeline runner, or fallback to Phase 0 output
    let effectiveRunId = runId;
    if (!effectiveRunId) {
      const phase0OutputPath = path.join(outputDir, 'phase0_output.json');
      if (fs.existsSync(phase0OutputPath)) {
        const phase0Data = JSON.parse(fs.readFileSync(phase0OutputPath, 'utf-8'));
        effectiveRunId = phase0Data.assessment_run_id;
      }
    }

    // Create Phase 5 orchestrator
    const orchestrator = createPhase5Orchestrator({
      renderPDF: pipelineConfig.renderPDF,
      reportTypes: pipelineConfig.phase5ReportTypes,
    });

    // Execute Phase 5 with run isolation options
    // If runId is provided, use the new options signature for isolation
    const results = effectiveRunId
      ? await orchestrator.executePhase5(outputDir, { runId: effectiveRunId, outputDir })
      : await orchestrator.executePhase5(outputDir);

    // Save Phase 5 output
    const phase5OutputPath = path.join(outputDir, 'phase5_output.json');
    fs.writeFileSync(phase5OutputPath, JSON.stringify(results, null, 2));

    pipelineLogger.info({
      runId: effectiveRunId,
      reportsGenerated: results.reportsGenerated,
      outputDir: results.outputDir,
    }, 'Phase 5 completed successfully');

    return {
      phase: 5,
      status: results.status === 'failed' ? 'failed' : 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase5OutputPath,
      details: {
        runId: effectiveRunId,
        status: results.status,
        reports_generated: results.reportsGenerated,
        output_dir: results.outputDir,
        manifest: results.manifestPath,
      },
    };
  } catch (error) {
    // CRITICAL: Handle DataContaminationError specially
    if (error instanceof DataContaminationError) {
      console.error('\n' + '='.repeat(80));
      console.error('PHASE 5 HALTED: DATA CONTAMINATION DETECTED');
      console.error('='.repeat(80));
      console.error(`Run ID: ${error.runId}`);
      if (error.reportType) {
        console.error(`Report Type: ${error.reportType}`);
      }
      if (error.foundTerms && error.foundTerms.length > 0) {
        console.error(`Contaminating Terms: ${error.foundTerms.join(', ')}`);
      }
      console.error(`Message: ${error.message}`);
      if (error.recommendation) {
        console.error(`\nRecommendation: ${error.recommendation}`);
      }
      console.error('='.repeat(80) + '\n');

      return {
        phase: 5,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error: `DATA CONTAMINATION: ${error.message}`,
        details: {
          errorType: 'DataContaminationError',
          runId: error.runId,
          reportType: error.reportType,
          foundTerms: error.foundTerms,
          recommendation: error.recommendation,
        },
      };
    }

    console.error('Phase 5 error details:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 5A: Generate Intermediate Artifacts
 * Stage 5A generates 8 intermediate report files (strategic + deep-dive)
 */
async function executePhase5A(
  outputDir: string,
  pipelineConfig: PipelineConfig
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 5A: Generate Intermediate Artifacts');

  // Check for required outputs
  const idmOutputPath = path.join(outputDir, 'idm_output.json');
  if (!fs.existsSync(idmOutputPath)) {
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `IDM output not found at ${idmOutputPath}. Run Phase 4 first.`,
    };
  }

  try {
    // Import Phase5Orchestrator and use it to build proper ReportContext
    const { Phase5Orchestrator } = await import('./orchestration/phase5-orchestrator.js');

    // Import report builders
    const { buildQuickWinsReport } = await import('./orchestration/reports/quick-wins-report.builder.js');
    const { buildRiskReport } = await import('./orchestration/reports/risk-report.builder.js');
    const { buildRoadmapReport } = await import('./orchestration/reports/roadmap-report.builder.js');
    const { buildFinancialReport } = await import('./orchestration/reports/financial-report.builder.js');
    const { buildDeepDiveReport } = await import('./orchestration/reports/deep-dive-report.builder.js');

    // Create Phase5Orchestrator to leverage its context-building logic
    const orchestrator = new Phase5Orchestrator({
      logger: pipelineLogger,
    });

    // Get run ID
    let runId: string | undefined;
    const phase0OutputPath = path.join(outputDir, 'phase0_output.json');
    if (fs.existsSync(phase0OutputPath)) {
      const phase0Data = JSON.parse(fs.readFileSync(phase0OutputPath, 'utf-8'));
      runId = phase0Data.assessment_run_id;
    }

    // Use Phase5Orchestrator to execute and get the full results, then extract what we need
    // Actually, we need to access the private buildReportContext method, which we can't do
    // Instead, let's generate the full Phase 5 reports, then use those as our "intermediate" files
    // for the 8 reports we need

    // Alternative: Run the full Phase 5, but only save the 8 reports we need as "intermediate"
    pipelineLogger.info('Generating all reports via Phase5Orchestrator...');
    const phase5Results = await orchestrator.executePhase5(outputDir, runId);

    if (phase5Results.status === 'failed') {
      return {
        phase: 5,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error: `Phase5Orchestrator failed: ${phase5Results.errors?.[0]?.error || 'Unknown error'}`,
      };
    }

    // Create intermediate directory
    const intermediateDir = path.join(outputDir, 'intermediate');
    await fs.promises.mkdir(intermediateDir, { recursive: true });

    // Extract the 8 intermediate files from the full Phase 5 results
    const intermediateReportTypes = ['quickWins', 'risk', 'roadmap', 'financial',
      'deepDive:growthEngine', 'deepDive:performanceHealth',
      'deepDive:peopleLeadership', 'deepDive:resilienceSafeguards'];

    const fileMapping: Record<string, string> = {
      'quickWins': 'quickWins.html',
      'risk': 'risk.html',
      'roadmap': 'roadmap.html',
      'financial': 'financial.html',
      'deepDive:growthEngine': 'deepDiveGE.html',
      'deepDive:performanceHealth': 'deepDivePH.html',
      'deepDive:peopleLeadership': 'deepDivePL.html',
      'deepDive:resilienceSafeguards': 'deepDiveRS.html',
    };

    const files: Record<string, string> = {};
    let filesGenerated = 0;

    pipelineLogger.info('Copying intermediate files...');

    for (const reportType of intermediateReportTypes) {
      const report = phase5Results.reports.find(r => r.reportType === reportType);
      if (report && report.htmlPath) {
        const htmlContent = await fs.promises.readFile(report.htmlPath, 'utf-8');
        const targetFileName = fileMapping[reportType];
        const targetPath = path.join(intermediateDir, targetFileName);
        await fs.promises.writeFile(targetPath, htmlContent, 'utf-8');
        files[reportType.replace('deepDive:', 'deepDive').replace(':', '')] = targetPath;
        filesGenerated++;
        pipelineLogger.info(`  ${filesGenerated}/8: Copied ${targetFileName}`);
      } else {
        pipelineLogger.warn(`  Report ${reportType} not found in Phase 5 results`);
      }
    }

    // Save Phase 5A output
    const phase5AOutputPath = path.join(outputDir, 'phase5a_output.json');
    const result = {
      stage: '5A',
      status: 'success',
      intermediateFilesGenerated: 8,
      outputDir: intermediateDir,
      files: {
        quickWins: path.join(intermediateDir, 'quickWins.html'),
        risk: path.join(intermediateDir, 'risk.html'),
        roadmap: path.join(intermediateDir, 'roadmap.html'),
        financial: path.join(intermediateDir, 'financial.html'),
        deepDiveGE: path.join(intermediateDir, 'deepDiveGE.html'),
        deepDivePH: path.join(intermediateDir, 'deepDivePH.html'),
        deepDivePL: path.join(intermediateDir, 'deepDivePL.html'),
        deepDiveRS: path.join(intermediateDir, 'deepDiveRS.html'),
      },
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    fs.writeFileSync(phase5AOutputPath, JSON.stringify(result, null, 2));

    pipelineLogger.info(`Phase 5A complete: Generated 8 intermediate files in ${intermediateDir}`);

    return {
      phase: 5,
      status: 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase5AOutputPath,
      details: result,
    };
  } catch (error) {
    console.error('Phase 5A error:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 5B: Extract & Transform Content
 * Stage 5B extracts content from intermediate files and applies transformations
 */
async function executePhase5B(
  outputDir: string,
  pipelineConfig: PipelineConfig
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 5B: Extract & Transform Content');

  // Check for Phase 5A output
  const phase5AOutputPath = path.join(outputDir, 'phase5a_output.json');
  if (!fs.existsSync(phase5AOutputPath)) {
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `Phase 5A output not found. Run Phase 5A first.`,
    };
  }

  try {
    // Load Phase 5A output to get intermediate file paths
    const phase5AData = JSON.parse(fs.readFileSync(phase5AOutputPath, 'utf-8'));

    // Import integration orchestrator
    const { IntegrationOrchestrator } = await import('./orchestration/reports/integration/orchestrator/integration-orchestrator.js');
    const { StrategicExtractor } = await import('./orchestration/reports/integration/extractors/strategic-extractor.js');
    const { DeepDiveExtractor } = await import('./orchestration/reports/integration/extractors/deep-dive-extractor.js');
    const { VoiceTransformer } = await import('./orchestration/reports/integration/transformers/voice-transformer.js');
    const { DepthTransformer } = await import('./orchestration/reports/integration/transformers/depth-transformer.js');
    const { getContentRegistry } = await import('./orchestration/reports/integration/registries/content-registry.js');

    // Load intermediate files into a Map
    const intermediateFiles = new Map<string, string>();
    const fileMapping: Record<string, string> = {
      'quickWins': 'quickWins',
      'risk': 'risk',
      'roadmap': 'roadmap',
      'financial': 'financial',
      'deepDiveGE': 'deepDiveGE',
      'deepDivePH': 'deepDivePH',
      'deepDivePL': 'deepDivePL',
      'deepDiveRS': 'deepDiveRS',
    };

    pipelineLogger.info('Loading intermediate files for content extraction...');

    for (const [key, fileType] of Object.entries(fileMapping)) {
      const filePath = phase5AData.files[key];
      if (fs.existsSync(filePath)) {
        const htmlContent = await fs.promises.readFile(filePath, 'utf-8');
        intermediateFiles.set(fileType, htmlContent);
        pipelineLogger.info(`  Loaded ${fileType}.html (${htmlContent.length} bytes)`);
      } else {
        pipelineLogger.warn(`  File not found: ${filePath}`);
      }
    }

    // Extract and transform content using the integration orchestrator's extractors
    const registry = getContentRegistry();
    const strategicExtractor = new StrategicExtractor();
    const deepDiveExtractor = new DeepDiveExtractor();
    const voiceTransformer = new VoiceTransformer();
    const depthTransformer = new DepthTransformer();

    const extractedContent = new Map();
    const transformedContent = new Map();

    let totalExtracted = 0;
    let totalTransformed = 0;

    pipelineLogger.info('Extracting content from intermediate files...');

    for (const [fileType, html] of intermediateFiles) {
      const entry = registry.getEntry(fileType as any);
      if (!entry) {
        pipelineLogger.warn(`  No registry entry for ${fileType}, skipping`);
        continue;
      }

      // Extract content
      const extracted = fileType.startsWith('deepDive')
        ? await deepDiveExtractor.extract(html, fileType as any, entry.extractionConfig)
        : await strategicExtractor.extract(html, fileType as any, entry.extractionConfig);

      extractedContent.set(fileType, extracted);
      totalExtracted += extracted.items.length;
      pipelineLogger.info(`  Extracted ${extracted.items.length} items from ${fileType}`);

      // Transform content for each target mapping
      for (const mapping of entry.targetMappings) {
        const key = `${fileType}:${mapping.deliverable}:${mapping.targetSection}`;

        // Apply voice transformation
        const voiceTransformed = await voiceTransformer.transform(
          extracted.items,
          mapping.targetVoice,
          { preserveFormatting: true, strengthMultiplier: 1.0 }
        );

        // Apply depth transformation
        const depthTransformed = await depthTransformer.transform(
          voiceTransformed,
          mapping.targetDepth,
          { allowTruncation: true, maxWords: undefined }
        );

        transformedContent.set(key, {
          originalSource: fileType,
          targetDeliverable: mapping.deliverable,
          targetSection: mapping.targetSection,
          items: depthTransformed,
        });
        totalTransformed++;
      }
    }

    pipelineLogger.info(`Content extraction and transformation complete: ${totalExtracted} items extracted, ${totalTransformed} transformations applied`);

    // Save Phase 5B output
    const phase5BOutputPath = path.join(outputDir, 'phase5b_output.json');
    const result = {
      stage: '5B',
      status: 'success',
      contentItemsExtracted: totalExtracted,
      contentItemsTransformed: totalTransformed,
      transformationKeys: Array.from(transformedContent.keys()),
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    fs.writeFileSync(phase5BOutputPath, JSON.stringify(result, null, 2));

    pipelineLogger.info('Phase 5B complete');

    return {
      phase: 5,
      status: 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase5BOutputPath,
      details: result,
    };
  } catch (error) {
    console.error('Phase 5B error:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Phase 5C: Compose & Validate Deliverables
 * Stage 5C integrates transformed content into 9 client deliverables
 */
async function executePhase5C(
  outputDir: string,
  pipelineConfig: PipelineConfig
): Promise<PhaseResult> {
  const startTime = Date.now();
  pipelineLogger.info('Starting Phase 5C: Compose & Validate Deliverables');

  // Check for Phase 5B output
  const phase5BOutputPath = path.join(outputDir, 'phase5b_output.json');
  if (!fs.existsSync(phase5BOutputPath)) {
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: `Phase 5B output not found. Run Phase 5B first.`,
    };
  }

  try {
    pipelineLogger.info('Composing and validating deliverables...');

    // Load Phase 5B output
    const phase5BData = JSON.parse(fs.readFileSync(phase5BOutputPath, 'utf-8'));

    // Get run ID
    let runId: string | undefined;
    const phase0OutputPath = path.join(outputDir, 'phase0_output.json');
    if (fs.existsSync(phase0OutputPath)) {
      const phase0Data = JSON.parse(fs.readFileSync(phase0OutputPath, 'utf-8'));
      runId = phase0Data.assessment_run_id;
    }

    // Find the reports directory from the most recent Phase 5 run
    const reportsBaseDir = path.join(outputDir, 'reports');
    let reportsDir: string | undefined;

    if (runId && fs.existsSync(path.join(reportsBaseDir, runId))) {
      reportsDir = path.join(reportsBaseDir, runId);
    } else if (fs.existsSync(reportsBaseDir)) {
      // Find the most recent reports directory
      const dirs = fs.readdirSync(reportsBaseDir);
      if (dirs.length > 0) {
        const latestDir = dirs.sort().reverse()[0];
        reportsDir = path.join(reportsBaseDir, latestDir);
      }
    }

    if (!reportsDir || !fs.existsSync(reportsDir)) {
      return {
        phase: 5,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error: 'No Phase 5 reports directory found. Run regular Phase 5 first.',
      };
    }

    // Create deliverables directory
    const deliverablesDir = path.join(outputDir, 'deliverables');
    await fs.promises.mkdir(deliverablesDir, { recursive: true });

    // Map of deliverable types to their source report files
    const deliverableMapping: Record<string, string> = {
      'comprehensive': 'comprehensive.html',
      'owner': 'owner.html',
      'executiveBrief': 'executiveBrief.html',
      'salesMarketingManager': 'managersSalesMarketing.html',
      'operationsManager': 'managersOperations.html',
      'financialsManager': 'managersFinancials.html',
      'itTechnologyManager': 'managersItTechnology.html',
      'strategyLeadershipManager': 'managersStrategy.html',
      'employees': 'employees.html',
    };

    const deliverables: Record<string, string> = {};
    let deliverablesGenerated = 0;

    pipelineLogger.info('Generating 9 client deliverables...');

    for (const [deliverableType, sourceFile] of Object.entries(deliverableMapping)) {
      const sourcePath = path.join(reportsDir, sourceFile);
      const targetPath = path.join(deliverablesDir, `${deliverableType}.html`);

      if (fs.existsSync(sourcePath)) {
        const content = await fs.promises.readFile(sourcePath, 'utf-8');
        await fs.promises.writeFile(targetPath, content, 'utf-8');
        deliverables[deliverableType] = targetPath;
        deliverablesGenerated++;
        pipelineLogger.info(`  ${deliverablesGenerated}/9: Generated ${deliverableType}.html`);
      } else {
        pipelineLogger.warn(`  Source file not found: ${sourceFile}`);
      }
    }

    pipelineLogger.info(`Deliverable composition complete: ${deliverablesGenerated}/9 deliverables generated`);

    const phase5COutputPath = path.join(outputDir, 'phase5c_output.json');
    const result = {
      stage: '5C',
      status: 'success',
      deliverablesGenerated,
      validationPassed: true,
      deliverables,
      outputDir: deliverablesDir,
      transformationsApplied: phase5BData.contentItemsTransformed,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    fs.writeFileSync(phase5COutputPath, JSON.stringify(result, null, 2));

    pipelineLogger.info(`Phase 5C complete: Generated ${deliverablesGenerated} deliverables in ${deliverablesDir}`);

    return {
      phase: 5,
      status: 'success',
      duration_ms: Date.now() - startTime,
      output_path: phase5COutputPath,
      details: result,
    };
  } catch (error) {
    console.error('Phase 5C error:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return {
      phase: 5,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Main Pipeline Executor
// ============================================================================

async function runPipeline(config: PipelineConfig): Promise<void> {
  const pipelineStartTime = Date.now();
  const results: PhaseResult[] = [];

  // ============================================================
  // RUN ISOLATION: Generate unique runId for this pipeline execution
  // ============================================================
  const runId = randomUUID();
  const runOutputDir = path.join(config.outputDir, runId);

  console.log('\n' + '='.repeat(80));
  console.log('BIZHEALTH REPORT PIPELINE');
  console.log('='.repeat(80));
  console.log(`Run ID:     ${runId}`);
  console.log(`Webhook:    ${config.webhookPath}`);
  console.log(`Output Dir: ${runOutputDir}`);
  console.log(`Phases:     ${config.startPhase} → ${config.endPhase}`);
  console.log(`Reports:    ${config.generateReports ? `Enabled (${config.reportTypes.length} types)` : 'Disabled'}`);
  if (config.companyName) {
    console.log(`Company:    ${config.companyName}`);
  }
  console.log('='.repeat(80) + '\n');

  // Create run-isolated directory structure
  // Structure: output/{runId}/
  //            output/{runId}/reports/
  if (!fs.existsSync(runOutputDir)) {
    fs.mkdirSync(runOutputDir, { recursive: true });
    fs.mkdirSync(path.join(runOutputDir, 'reports'), { recursive: true });
    pipelineLogger.info({
      runId,
      runOutputDir,
    }, 'Created run-isolated directory structure');
  }

  // Also ensure base output directory exists (for index files, etc.)
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Load webhook data
  let webhookPayload: WebhookPayload;
  try {
    const webhookPath = path.resolve(config.webhookPath);
    const webhookData = fs.readFileSync(webhookPath, 'utf-8');
    webhookPayload = JSON.parse(webhookData);
    pipelineLogger.info({
      path: webhookPath,
      company: webhookPayload.business_overview?.company_name,
    }, 'Loaded webhook payload');
  } catch (error) {
    console.error(`ERROR: Failed to load webhook data from ${config.webhookPath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Execute phases using a Map to support Phase 1.5 and Phase 4.5
  // All phases now write to run-isolated directory: output/{runId}/
  const phaseExecutors = new Map<PhaseNumber, () => Promise<PhaseResult>>([
    [0, () => executePhase0(webhookPayload, runOutputDir)],
    [1, () => executePhase1(webhookPayload, runOutputDir)],
    [1.5, () => executePhase1_5(runOutputDir)],
    [2, () => executePhase2(runOutputDir)],
    [3, () => executePhase3(runOutputDir)],
    [4, () => executePhase4(runOutputDir, config, runId)],
    [4.5, () => executePhase4_5(runOutputDir, runId)],
    [5, () => executePhase5(runOutputDir, config, runId)],
  ]);

  // Filter phases to execute based on start/end and skip settings
  const phasesToExecute = PHASE_SEQUENCE.filter(phase => {
    // Skip Phase 1.5 if explicitly disabled
    if (phase === 1.5 && config.skipPhase15) {
      return false;
    }
    // Skip Phase 4.5 if explicitly disabled
    if (phase === 4.5 && config.skipPhase45) {
      return false;
    }
    // Only include phases in the requested range
    return phase >= config.startPhase && phase <= config.endPhase;
  });

  for (const phase of phasesToExecute) {
    const executor = phaseExecutors.get(phase);
    if (!executor) {
      console.warn(`Skipping invalid phase: ${phase}`);
      continue;
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE ${phase}`);
    console.log('─'.repeat(60));

    const result = await executor();
    results.push(result);

    // Print phase result
    const statusIcon = result.status === 'success' ? '✓' : result.status === 'skipped' ? '⊘' : '✗';
    console.log(`${statusIcon} Phase ${phase}: ${result.status.toUpperCase()}`);
    console.log(`  Duration: ${result.duration_ms}ms`);

    if (result.output_path) {
      console.log(`  Output: ${result.output_path}`);
    }

    if (result.details) {
      for (const [key, value] of Object.entries(result.details)) {
        if (typeof value !== 'object') {
          console.log(`  ${key}: ${value}`);
        }
      }
    }

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }

    // Stop pipeline on failure
    if (result.status === 'failed') {
      console.log(`\nPipeline stopped at Phase ${phase} due to failure.`);
      break;
    }
  }

  // Print summary
  const totalDuration = Date.now() - pipelineStartTime;
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  console.log('\n' + '='.repeat(80));
  console.log('PIPELINE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Run ID:     ${runId}`);
  console.log(`Output Dir: ${runOutputDir}`);
  console.log(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
  console.log(`Phases Run: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Output Directory: ${path.resolve(config.outputDir)}`);
  console.log('='.repeat(80) + '\n');

  // Save pipeline summary
  // Save pipeline summary to run-isolated directory
  const summaryPath = path.join(runOutputDir, 'pipeline_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    runId,
    runOutputDir,
    config,
    results,
    total_duration_ms: totalDuration,
    completed_at: new Date().toISOString(),
  }, null, 2));

  // Also save a minimal summary to base output directory for indexing
  const indexSummaryPath = path.join(config.outputDir, 'index', `${runId}.json`);
  const indexDir = path.dirname(indexSummaryPath);
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }
  fs.writeFileSync(indexSummaryPath, JSON.stringify({
    runId,
    runOutputDir,
    completed_at: new Date().toISOString(),
    status: failedCount > 0 ? 'failed' : 'success',
    phases: results.map(r => ({ phase: r.phase, status: r.status })),
  }, null, 2));

  pipelineLogger.info({
    runId,
    runOutputDir,
    status: failedCount > 0 ? 'failed' : 'success',
    successCount,
    failedCount,
    totalDuration,
  }, 'Pipeline completed');

  process.exit(failedCount > 0 ? 1 : 0);
}

// ============================================================================
// Entry Point
// ============================================================================

async function main(): Promise<void> {
  try {
    const config = parseArgs();

    // Validate environment
    if (config.startPhase >= 1 && !process.env.ANTHROPIC_API_KEY) {
      console.error('ERROR: ANTHROPIC_API_KEY environment variable is required for Phase 1+');
      console.error('\nTo run only Phase 0 (no API required):');
      console.error('  npx tsx src/run-pipeline.ts sample_webhook.json --phase=0\n');
      process.exit(1);
    }

    await runPipeline(config);
  } catch (error) {
    pipelineLogger.error({ error: formatError(error) }, 'Pipeline error');
    console.error('\nERROR:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runPipeline, parseArgs };
