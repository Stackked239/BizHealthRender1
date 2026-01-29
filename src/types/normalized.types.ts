/**
 * Normalized Types for Phase 0B
 *
 * These types define the structure for normalized, analysis-ready objects
 * derived deterministically from raw data.
 *
 * Key Principles:
 * - Derived from raw data without mutation
 * - Fully versioned with transformation metadata
 * - Structurally separated but linked via IDs
 */

import type { CompanyProfile } from './company-profile.types.js';
import type { QuestionnaireResponses } from './questionnaire.types.js';
import type { BenchmarkDataset } from '../data-transformation/benchmark-service.js';

// ============================================================================
// Extended Company Profile with Snapshot Support
// ============================================================================

/**
 * Extended metadata for normalized company profile
 */
export interface NormalizedCPMetadata {
  /** Original profile ID (stable across assessments) */
  profile_id: string;

  /** Unique snapshot ID for this specific normalization */
  snapshot_id: string;

  /** Assessment run ID this snapshot belongs to */
  assessment_run_id: string;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last updated timestamp */
  last_updated: string;

  /** Version of the company profile schema */
  cp_version: string;

  /** Version of the transformation logic */
  cp_transformation_version: string;

  /** Original assessment version from input */
  assessment_version: string;
}

/**
 * Normalized Company Profile with snapshot support
 * Extends base CompanyProfile with Phase 0 metadata
 */
export interface NormalizedCompanyProfile extends Omit<CompanyProfile, 'metadata'> {
  metadata: NormalizedCPMetadata;
}

// ============================================================================
// Extended Questionnaire Responses with Chapter/Dimension Structure
// ============================================================================

/**
 * Dimension codes for the 12 business dimensions
 */
export type DimensionCode =
  | 'STR' // Strategy
  | 'SAL' // Sales
  | 'MKT' // Marketing
  | 'CXP' // Customer Experience
  | 'OPS' // Operations
  | 'FIN' // Financials
  | 'HRS' // Human Resources
  | 'LDG' // Leadership & Governance
  | 'TIN' // Technology & Innovation
  | 'ITD' // IT & Data Security (canonical code for Phase 1.5+)
  | 'IDS' // IT, Data & Systems (legacy code - maps to ITD)
  | 'RMS' // Risk Management & Sustainability
  | 'CMP'; // Compliance & Legal

/**
 * Chapter codes for the 4 main chapters
 */
export type ChapterCode = 'GE' | 'PH' | 'PL' | 'RS';

/**
 * Chapter names mapping
 */
export const CHAPTER_NAMES: Record<ChapterCode, string> = {
  GE: 'Growth Engine',
  PH: 'Performance & Health',
  PL: 'People & Leadership',
  RS: 'Resilience & Safeguards',
};

/**
 * Dimension names mapping
 */
export const DIMENSION_NAMES: Record<DimensionCode, string> = {
  STR: 'Strategy',
  SAL: 'Sales',
  MKT: 'Marketing',
  CXP: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Financials',
  HRS: 'Human Resources',
  LDG: 'Leadership & Governance',
  TIN: 'Technology & Innovation',
  ITD: 'IT & Data Security',
  IDS: 'IT, Data & Systems', // Legacy code - maps to ITD
  RMS: 'Risk Management & Sustainability',
  CMP: 'Compliance & Legal',
};

/**
 * Chapter to dimensions mapping
 */
export const CHAPTER_DIMENSIONS: Record<ChapterCode, DimensionCode[]> = {
  GE: ['STR', 'SAL', 'MKT', 'CXP'],
  PH: ['OPS', 'FIN'],
  PL: ['HRS', 'LDG'],
  RS: ['TIN', 'ITD', 'RMS', 'CMP'], // Using ITD (canonical code for Phase 1.5+)
};

/**
 * Normalized question response with full metadata
 */
export interface NormalizedQuestionResponse {
  /** Stable question ID from questionnaire doc */
  question_id: string;

  /** Question number within the questionnaire */
  question_number: number;

  /** Original question text as displayed */
  original_prompt_text: string;

  /** Raw response value (preserved exactly) */
  raw_response: unknown;

  /** Normalized value (0-100 scale or domain-appropriate) */
  normalized_value?: number;

  /** Normalization method applied */
  normalization_method?: 'scale_1_5' | 'percentage' | 'currency' | 'numeric' | 'boolean' | 'text' | 'composite';

  /** Dimension code this question maps to */
  dimension_code: DimensionCode;

  /** Sub-indicator ID (e.g., 'STR_competitive_clarity') */
  sub_indicator_id: string;

  /** Derived metrics calculated from this response */
  derived_metrics?: Record<string, number>;

  /** Response type from original questionnaire */
  response_type: string;

  /** Unit of measurement */
  response_unit?: string;

  /** Whether the value was estimated by respondent */
  is_estimate?: boolean;

  /** Whether marked as not applicable */
  not_applicable?: boolean;

  /** Question weight for scoring */
  question_weight: number;
}

/**
 * Dimension with grouped questions
 */
export interface NormalizedDimension {
  /** Dimension code */
  dimension_code: DimensionCode;

  /** Dimension name */
  name: string;

  /** Questions belonging to this dimension */
  questions: NormalizedQuestionResponse[];

  /** Aggregated dimension metrics */
  dimension_metrics: {
    /** Average score across scale questions (1-5) */
    avg_scale_score?: number;
    /** Average normalized score (0-100) */
    avg_normalized_score?: number;
    /** Total questions in dimension */
    total_questions: number;
    /** Questions answered */
    questions_answered: number;
    /** Completion rate */
    completion_rate: number;
  };

  /** Calculated dimension-level derived metrics */
  derived_metrics?: Record<string, number | string | null>;
}

/**
 * Chapter with grouped dimensions
 */
export interface NormalizedChapter {
  /** Chapter code */
  chapter_code: ChapterCode;

  /** Chapter name */
  name: string;

  /** Dimensions belonging to this chapter */
  dimensions: NormalizedDimension[];

  /** Aggregated chapter metrics */
  chapter_metrics: {
    /** Average score across all chapter questions */
    avg_score: number;
    /** Total questions in chapter */
    total_questions: number;
    /** Questions answered */
    questions_answered: number;
    /** Completion rate */
    completion_rate: number;
  };
}

/**
 * Extended metadata for normalized questionnaire responses
 */
export interface NormalizedQRMetadata {
  /** Unique response ID */
  response_id: string;

  /** Assessment run ID this belongs to */
  assessment_run_id: string;

  /** Company profile ID */
  company_profile_id: string;

  /** Questionnaire version */
  questionnaire_version: string;

  /** Transformation version */
  qr_transformation_version: string;

  /** ISO 8601 completion/submission date */
  completion_date: string;

  /** Completion status */
  completion_status: 'complete' | 'partial';

  /** Total questions in questionnaire */
  total_questions: number;

  /** Number of questions answered */
  questions_answered: number;

  /** ISO 8601 transformation timestamp */
  transformed_at: string;
}

/**
 * Normalized Questionnaire Responses with chapter/dimension structure
 */
export interface NormalizedQuestionnaireResponses {
  /** Extended metadata */
  meta: NormalizedQRMetadata;

  /** Chapters with nested dimensions and questions */
  chapters: NormalizedChapter[];

  /** Overall assessment metrics */
  overall_metrics: {
    total_questions: number;
    total_answered: number;
    completion_rate: number;
    overall_avg_scale_score: number;
    overall_avg_normalized_score: number;
    chapter_scores: Record<ChapterCode, number>;
    dimension_scores: Record<DimensionCode, number>;
  };

  /** All derived metrics aggregated */
  derived_metrics: {
    sales_velocity?: number;
    cac_ltv_ratio?: number;
    cash_ratio?: number;
    debt_to_asset_ratio?: number;
    capacity_utilization_avg?: number;
    growth_gap?: number;
    [key: string]: number | undefined;
  };
}

// ============================================================================
// Benchmark Data with Assessment Linkage
// ============================================================================

/**
 * Extended benchmark data tied to assessment
 */
export interface NormalizedBenchmarkData extends BenchmarkDataset {
  /** Assessment run ID this benchmark was retrieved for */
  assessment_run_id: string;

  /** Company profile ID */
  company_profile_id: string;

  /** Match level achieved */
  match_level: 'exact' | 'fallback_1' | 'fallback_2' | 'fallback_3' | 'fallback_4';

  /** Description of match */
  match_description: string;

  /** ISO 8601 timestamp when benchmark was retrieved */
  retrieved_at: string;
}

// ============================================================================
// Assessment Index Entry
// ============================================================================

/**
 * Assessment index entry linking all Phase 0 outputs
 */
export interface AssessmentIndexEntry {
  /** Unique assessment run ID */
  assessment_run_id: string;

  /**
   * Run ID for directory isolation (UUID)
   * This is the primary key for run-isolated output paths
   * May be the same as assessment_run_id or a new UUID
   */
  run_id?: string;

  /** Company profile ID */
  company_profile_id: string;

  /** Company name for quick lookups */
  company_name?: string;

  /** Company profile snapshot ID for this assessment */
  cp_snapshot_id: string;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 completion timestamp */
  completed_at?: string;

  /** Questionnaire version */
  questionnaire_version: string;

  /** Company profile version */
  cp_version: string;

  /** Company profile transformation version */
  cp_transformation_version: string;

  /** Questionnaire response transformation version */
  qr_transformation_version: string;

  /** Paths to stored files */
  paths: {
    /** Path to raw assessment JSON */
    raw_assessment: string;
    /** Path to normalized company profile JSON */
    normalized_company_profile: string;
    /** Path to normalized questionnaire responses JSON */
    normalized_questionnaire_responses: string;
    /** Path to benchmark data JSON (optional) */
    benchmark_data?: string;
  };

  /**
   * Run-isolated output paths (for Phase 4/5 outputs)
   * All paths relative to output/{run_id}/
   */
  output_paths?: {
    /** Root run directory: output/{run_id}/ */
    run_dir?: string;
    /** IDM output: output/{run_id}/idm_output.json */
    idm?: string;
    /** Category analyses: output/{run_id}/categoryAnalyses.json */
    category_analyses?: string;
    /** Reports directory: output/{run_id}/reports/{manifest_id}/ */
    reports?: string;
    /** Manifest file: output/{run_id}/reports/{manifest_id}/manifest.json */
    manifest?: string;
  };

  /** Processing status */
  status: 'raw_captured' | 'normalized' | 'ready_for_analysis' | 'analysis_complete' | 'in_progress' | 'completed' | 'failed' | 'error';

  /** Error details if status is 'error' or 'failed' */
  error?: {
    phase: string;
    message: string;
    timestamp: string;
  };

  /** Phase 1+ execution metadata (if complete) */
  phase_metadata?: {
    phase1_completed_at?: string;
    phase1_5_completed_at?: string;
    phase2_completed_at?: string;
    phase3_completed_at?: string;
    phase4_completed_at?: string;
    phase5_completed_at?: string;
  };
}

/**
 * Assessment index (collection of entries)
 */
export interface AssessmentIndex {
  /** Index version */
  version: string;

  /** Last updated timestamp */
  last_updated: string;

  /** All assessment entries keyed by assessment_run_id */
  entries: Record<string, AssessmentIndexEntry>;
}

// ============================================================================
// Phase 0 Output Bundle
// ============================================================================

/**
 * Complete Phase 0 output bundle for Phase 1+ consumption
 */
export interface Phase0Output {
  /** Assessment run ID */
  assessment_run_id: string;

  /** Normalized company profile */
  companyProfile: NormalizedCompanyProfile;

  /** Normalized questionnaire responses */
  questionnaireResponses: NormalizedQuestionnaireResponses;

  /** Benchmark data */
  benchmarkData: NormalizedBenchmarkData;

  /** Index entry for this assessment */
  indexEntry: AssessmentIndexEntry;
}

// ============================================================================
// Transformation Result Types
// ============================================================================

/**
 * Result of company profile transformation
 */
export interface CompanyProfileTransformResult {
  success: boolean;
  profile?: NormalizedCompanyProfile;
  error?: string;
  validationErrors?: string[];
}

/**
 * Result of questionnaire response transformation
 */
export interface QuestionnaireTransformResult {
  success: boolean;
  responses?: NormalizedQuestionnaireResponses;
  error?: string;
  validationErrors?: string[];
  missingQuestions?: string[];
}

/**
 * Versioning constants for Phase 0
 */
export const PHASE0_VERSIONS = {
  CP_TRANSFORMATION: 'v1.0.0',
  QR_TRANSFORMATION: 'v1.0.0',
  QUESTIONNAIRE: 'v2025-09-16',
  CP_SCHEMA: 'v2025-09-16',
  INDEX: 'v1.0.0',
} as const;
