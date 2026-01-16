/**
 * Phase 0 Orchestrator
 *
 * Coordinates the complete Phase 0 pipeline:
 * - Phase 0A: Raw data capture with immutable storage
 * - Phase 0B: Normalization of company profile and questionnaire
 * - Benchmark data retrieval
 * - Index management for linking all outputs
 *
 * This orchestrator produces the inputs required for Phase 1+:
 * - CompanyProfile (normalized)
 * - QuestionnaireResponses (normalized)
 * - BenchmarkData
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';
import { generateAuditTimestamp, computePayloadHash } from '../utils/security.js';
import {
  RawAssessmentStorageService,
  getRawAssessmentStorage,
  type RawStorageConfig,
} from '../services/raw-assessment-storage.js';
import {
  AssessmentIndexService,
  NormalizedDataStorage,
  getAssessmentIndexService,
  getNormalizedDataStorage,
  type AssessmentIndexConfig,
} from '../services/assessment-index.js';
import {
  transformToNormalizedCompanyProfile,
  transformWebhookToNormalizedCP,
} from '../data-transformation/normalized-company-profile-transformer.js';
import {
  transformToNormalizedQuestionnaireResponses,
} from '../data-transformation/normalized-questionnaire-transformer.js';
import {
  getBenchmarksForCategory,
  getAllBenchmarks,
  getCrossFunctionalBenchmarks,
  type BenchmarkDataset,
} from '../data-transformation/benchmark-service.js';
import type { WebhookPayload } from '../types/webhook.types.js';
import type {
  RawAssessment,
  CreateRawAssessmentOptions,
} from '../types/raw-input.types.js';
import type {
  Phase0Output,
  NormalizedCompanyProfile,
  NormalizedQuestionnaireResponses,
  NormalizedBenchmarkData,
  AssessmentIndexEntry,
} from '../types/normalized.types.js';

const logger = createLogger('phase0-orchestrator');

// ============================================================================
// Configuration
// ============================================================================

export interface Phase0Config {
  /** Raw storage configuration */
  rawStorage?: Partial<RawStorageConfig>;

  /** Index configuration */
  index?: Partial<AssessmentIndexConfig>;

  /** Questionnaire version */
  questionnaireVersion?: string;

  /** Company profile version */
  cpVersion?: string;

  /** CP transformation version */
  cpTransformationVersion?: string;

  /** QR transformation version */
  qrTransformationVersion?: string;
}

const DEFAULT_VERSIONS = {
  questionnaire: 'v2025-09-16',
  cp: 'v2025-09-16',
  cpTransformation: 'v1.0.0',
  qrTransformation: 'v1.0.0',
};

// ============================================================================
// Phase 0 Result Types
// ============================================================================

export interface Phase0Result {
  success: boolean;
  assessment_run_id: string;
  company_profile_id: string;
  output?: Phase0Output;
  error?: string;
  warnings?: string[];
  execution_time_ms: number;
  phases_completed: {
    raw_capture: boolean;
    cp_normalization: boolean;
    qr_normalization: boolean;
    benchmark_retrieval: boolean;
    index_update: boolean;
  };
}

// ============================================================================
// Phase 0 Orchestrator
// ============================================================================

export class Phase0Orchestrator {
  private rawStorage: RawAssessmentStorageService;
  private indexService: AssessmentIndexService;
  private dataStorage: NormalizedDataStorage;
  private config: Phase0Config;

  constructor(config: Phase0Config = {}) {
    this.config = config;
    this.rawStorage = getRawAssessmentStorage(config.rawStorage);
    this.indexService = getAssessmentIndexService(config.index);
    this.dataStorage = getNormalizedDataStorage(config.index);
  }

  /**
   * Execute the complete Phase 0 pipeline
   *
   * @param webhookPayload - The incoming webhook payload
   * @param options - Optional capture options
   * @returns Phase0Result with success status and output
   */
  public async executePhase0(
    webhookPayload: WebhookPayload,
    options: CreateRawAssessmentOptions = {}
  ): Promise<Phase0Result> {
    const startTime = Date.now();
    const assessmentRunId = options.assessment_run_id || uuidv4();
    const warnings: string[] = [];

    const result: Phase0Result = {
      success: false,
      assessment_run_id: assessmentRunId,
      company_profile_id: '',
      execution_time_ms: 0,
      phases_completed: {
        raw_capture: false,
        cp_normalization: false,
        qr_normalization: false,
        benchmark_retrieval: false,
        index_update: false,
      },
    };

    logger.info(
      {
        assessment_run_id: assessmentRunId,
        company_name: webhookPayload.business_overview.company_name,
      },
      'Starting Phase 0 execution'
    );

    try {
      // ===== Phase 0A: Raw Capture =====
      logger.info({ phase: '0A' }, 'Executing Phase 0A: Raw Capture');

      const rawResult = await this.rawStorage.captureRawAssessment(webhookPayload, {
        ...options,
        assessment_run_id: assessmentRunId,
        questionnaire_version: this.config.questionnaireVersion || DEFAULT_VERSIONS.questionnaire,
        cp_version: this.config.cpVersion || DEFAULT_VERSIONS.cp,
      });

      result.company_profile_id = rawResult.assessment.company_profile_id;
      result.phases_completed.raw_capture = true;

      logger.info(
        {
          assessment_run_id: assessmentRunId,
          company_profile_id: result.company_profile_id,
          raw_path: rawResult.path.full_path,
        },
        'Phase 0A complete: Raw data captured'
      );

      // ===== Phase 0B: Normalization =====
      logger.info({ phase: '0B' }, 'Executing Phase 0B: Normalization');

      // Normalize Company Profile
      const cpResult = transformToNormalizedCompanyProfile(
        rawResult.assessment.raw_company_profile,
        rawResult.assessment.raw_questionnaire,
        {
          assessmentRunId,
          transformationVersion: this.config.cpTransformationVersion || DEFAULT_VERSIONS.cpTransformation,
          schemaVersion: this.config.cpVersion || DEFAULT_VERSIONS.cp,
        }
      );

      if (!cpResult.success || !cpResult.profile) {
        throw new Error(`Company profile normalization failed: ${cpResult.error}`);
      }

      result.phases_completed.cp_normalization = true;

      // Store normalized company profile
      const cpPath = this.dataStorage.storeCompanyProfile(cpResult.profile);

      logger.info(
        {
          assessment_run_id: assessmentRunId,
          snapshot_id: cpResult.profile.metadata.snapshot_id,
          cp_path: cpPath,
        },
        'Company profile normalized and stored'
      );

      // Normalize Questionnaire Responses
      const qrResult = transformToNormalizedQuestionnaireResponses(
        rawResult.assessment.raw_questionnaire,
        {
          assessmentRunId,
          companyProfileId: result.company_profile_id,
          transformationVersion: this.config.qrTransformationVersion || DEFAULT_VERSIONS.qrTransformation,
          questionnaireVersion: this.config.questionnaireVersion || DEFAULT_VERSIONS.questionnaire,
        }
      );

      if (!qrResult.success || !qrResult.responses) {
        throw new Error(`Questionnaire normalization failed: ${qrResult.error}`);
      }

      result.phases_completed.qr_normalization = true;

      // Track missing questions as warnings
      if (qrResult.missingQuestions && qrResult.missingQuestions.length > 0) {
        warnings.push(`Missing ${qrResult.missingQuestions.length} questions`);
        logger.warn(
          {
            assessment_run_id: assessmentRunId,
            missing_count: qrResult.missingQuestions.length,
          },
          'Some questions were not answered'
        );
      }

      // Store normalized questionnaire responses
      const qrPath = this.dataStorage.storeQuestionnaireResponses(qrResult.responses);

      logger.info(
        {
          assessment_run_id: assessmentRunId,
          total_questions: qrResult.responses.overall_metrics.total_questions,
          answered: qrResult.responses.overall_metrics.total_answered,
          qr_path: qrPath,
        },
        'Questionnaire responses normalized and stored'
      );

      // ===== Benchmark Retrieval =====
      logger.info({ phase: 'benchmark' }, 'Retrieving benchmark data');

      const benchmarkResult = this.retrieveBenchmarks(
        cpResult.profile,
        assessmentRunId,
        result.company_profile_id
      );

      result.phases_completed.benchmark_retrieval = true;

      // Store benchmark data
      const benchmarkPath = this.dataStorage.storeBenchmarkData(
        benchmarkResult,
        result.company_profile_id,
        assessmentRunId
      );

      logger.info(
        {
          assessment_run_id: assessmentRunId,
          match_level: benchmarkResult.match_level,
          benchmark_path: benchmarkPath,
        },
        'Benchmark data retrieved and stored'
      );

      // ===== Index Update =====
      logger.info({ phase: 'index' }, 'Updating assessment index');

      // Create initial index entry
      const indexEntry = this.indexService.createEntry({
        assessmentRunId,
        companyProfileId: result.company_profile_id,
        cpSnapshotId: cpResult.profile.metadata.snapshot_id,
        questionnaireVersion: this.config.questionnaireVersion || DEFAULT_VERSIONS.questionnaire,
        cpVersion: this.config.cpVersion || DEFAULT_VERSIONS.cp,
        cpTransformationVersion: this.config.cpTransformationVersion || DEFAULT_VERSIONS.cpTransformation,
        qrTransformationVersion: this.config.qrTransformationVersion || DEFAULT_VERSIONS.qrTransformation,
        rawAssessmentPath: rawResult.path.full_path,
      });

      // Update paths
      this.indexService.setNormalizedCPPath(assessmentRunId, cpPath);
      this.indexService.setNormalizedQRPath(assessmentRunId, qrPath);
      this.indexService.setBenchmarkPath(assessmentRunId, benchmarkPath);

      // Update status to ready for analysis
      this.indexService.updateStatus(assessmentRunId, 'ready_for_analysis');

      result.phases_completed.index_update = true;

      // Get final index entry
      const finalEntry = this.indexService.getEntry(assessmentRunId)!;

      logger.info(
        {
          assessment_run_id: assessmentRunId,
          status: finalEntry.status,
        },
        'Assessment index updated'
      );

      // ===== Build Output =====
      result.success = true;
      result.output = {
        assessment_run_id: assessmentRunId,
        companyProfile: cpResult.profile,
        questionnaireResponses: qrResult.responses,
        benchmarkData: benchmarkResult,
        indexEntry: finalEntry,
      };
      result.warnings = warnings.length > 0 ? warnings : undefined;

      const executionTime = Date.now() - startTime;
      result.execution_time_ms = executionTime;

      logger.info(
        {
          assessment_run_id: assessmentRunId,
          company_profile_id: result.company_profile_id,
          execution_time_ms: executionTime,
          success: true,
        },
        'Phase 0 execution complete'
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      result.execution_time_ms = executionTime;
      result.error = error instanceof Error ? error.message : String(error);

      // Update index with error status if entry was created
      if (result.phases_completed.raw_capture) {
        this.indexService.updateStatus(assessmentRunId, 'error', {
          phase: 'phase0',
          message: result.error,
        });
      }

      logger.error(
        {
          assessment_run_id: assessmentRunId,
          error: result.error,
          phases_completed: result.phases_completed,
          execution_time_ms: executionTime,
        },
        'Phase 0 execution failed'
      );

      return result;
    }
  }

  /**
   * Retrieve benchmarks for a company profile
   */
  private retrieveBenchmarks(
    profile: NormalizedCompanyProfile,
    assessmentRunId: string,
    companyProfileId: string
  ): NormalizedBenchmarkData {
    // Get benchmark match
    const matchResult = getBenchmarksForCategory('strategy', profile.benchmark_selectors);

    // Extend with assessment linkage
    const normalizedBenchmark: NormalizedBenchmarkData = {
      ...matchResult.dataset,
      assessment_run_id: assessmentRunId,
      company_profile_id: companyProfileId,
      match_level: matchResult.match_level,
      match_description: matchResult.match_description,
      retrieved_at: generateAuditTimestamp(),
    };

    return normalizedBenchmark;
  }

  /**
   * Load Phase 0 output from storage for a given assessment
   */
  public loadPhase0Output(assessmentRunId: string): Phase0Output | null {
    const entry = this.indexService.getEntry(assessmentRunId);

    if (!entry) {
      logger.warn({ assessment_run_id: assessmentRunId }, 'Assessment not found in index');
      return null;
    }

    if (entry.status !== 'ready_for_analysis' && entry.status !== 'analysis_complete') {
      logger.warn(
        { assessment_run_id: assessmentRunId, status: entry.status },
        'Assessment not ready for analysis'
      );
      return null;
    }

    // Load all components
    const companyProfile = this.dataStorage.loadCompanyProfile(
      entry.company_profile_id,
      entry.cp_snapshot_id
    );

    const questionnaireResponses = this.dataStorage.loadQuestionnaireResponses(
      entry.company_profile_id,
      assessmentRunId
    );

    const benchmarkData = this.dataStorage.loadBenchmarkData(
      entry.company_profile_id,
      assessmentRunId
    );

    if (!companyProfile || !questionnaireResponses || !benchmarkData) {
      logger.error(
        {
          assessment_run_id: assessmentRunId,
          has_cp: !!companyProfile,
          has_qr: !!questionnaireResponses,
          has_benchmark: !!benchmarkData,
        },
        'Failed to load all Phase 0 components'
      );
      return null;
    }

    return {
      assessment_run_id: assessmentRunId,
      companyProfile,
      questionnaireResponses,
      benchmarkData,
      indexEntry: entry,
    };
  }

  /**
   * Verify integrity of raw assessment
   */
  public verifyRawIntegrity(
    companyProfileId: string,
    assessmentRunId: string
  ): { valid: boolean; details: Record<string, unknown> } {
    return this.rawStorage.verifyAssessmentIntegrity(companyProfileId, assessmentRunId);
  }

  /**
   * Get index statistics
   */
  public getStats(): ReturnType<AssessmentIndexService['getStats']> {
    return this.indexService.getStats();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a Phase 0 orchestrator with default configuration
 */
export function createPhase0Orchestrator(config: Phase0Config = {}): Phase0Orchestrator {
  return new Phase0Orchestrator(config);
}

/**
 * Execute Phase 0 with a webhook payload (convenience function)
 */
export async function executePhase0(
  webhookPayload: WebhookPayload,
  options: CreateRawAssessmentOptions = {},
  config: Phase0Config = {}
): Promise<Phase0Result> {
  const orchestrator = createPhase0Orchestrator(config);
  return orchestrator.executePhase0(webhookPayload, options);
}

export default Phase0Orchestrator;
