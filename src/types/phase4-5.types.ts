/**
 * Phase 4.5 BLUF (Bottom Line Up Front) Generation Types
 *
 * This module defines the types for Phase 4.5 which generates executive summaries
 * (BLUFs) for all report types using AI-powered content creation.
 *
 * Architecture:
 * - Phase 4.5A: BLUF Orchestration & Generation (AI-powered content creation)
 * - Phase 4.5B: BLUF Rendering & Injection (report integration)
 */

import { z } from 'zod';
import type { ChapterCode, DimensionCode } from './idm.types.js';

// ===== BLUF PARAGRAPH STRUCTURE =====

/**
 * Schema for a single paragraph within a BLUF
 * Each paragraph has a specific purpose in the executive summary structure
 */
export const BLUFParagraphSchema = z.object({
  /** Paragraph text content (25-100 words) */
  content: z.string().min(1),
  /** Purpose of this paragraph in the BLUF structure */
  purpose: z.enum([
    'diagnosis',        // Overall health + trajectory
    'critical_risk',    // Most urgent issue
    'top_opportunity',  // Highest-impact improvement
    'strategic_framing' // What's at stake (action vs. inaction)
  ]).optional(),
  /** References to IDM findings/metrics that support this paragraph */
  evidence_citations: z.array(z.string()).optional(),
  /** Actual word count of this paragraph */
  word_count: z.number().min(1)
});

export type BLUFParagraph = z.infer<typeof BLUFParagraphSchema>;

// ===== MULTI-PARAGRAPH BLUF (Executive Reports) =====

/**
 * Executive BLUF schema for comprehensive and owner reports
 * Contains 2-4 structured paragraphs totaling 150-300 words
 */
export const ExecutiveBLUFSchema = z.object({
  /** Discriminator for BLUF type */
  type: z.literal('executive'),
  /** Number of paragraphs (2-4 for executive BLUFs) */
  paragraph_count: z.number().min(2).max(4),
  /** Total word count across all paragraphs (150-300 words) */
  total_word_count: z.number().min(50).max(500), // Allow some flexibility
  /** The structured paragraphs */
  paragraphs: z.array(BLUFParagraphSchema).min(1).max(6),
  /** Combined text of all paragraphs */
  full_text: z.string(),
  /** ISO timestamp when this BLUF was generated */
  generated_at: z.string(),
  /** Model used to generate this BLUF */
  model: z.string(),
  /** Quality score from 0-100 */
  quality_score: z.number().min(0).max(100).optional(),
  /** Time taken to generate this BLUF in milliseconds */
  generation_time_ms: z.number().optional()
});

export type ExecutiveBLUF = z.infer<typeof ExecutiveBLUFSchema>;

// ===== SECTION BLUF (Chapter/Dimension Reports) =====

/**
 * Section BLUF schema for chapter and dimension reports
 * Contains 1-2 paragraphs totaling 50-150 words
 */
export const SectionBLUFSchema = z.object({
  /** Discriminator for BLUF type */
  type: z.literal('section'),
  /** Number of paragraphs (1-2 for section BLUFs) */
  paragraph_count: z.number().min(1).max(4),
  /** Total word count across all paragraphs (50-150 words) */
  total_word_count: z.number().min(20).max(300), // Allow some flexibility
  /** The structured paragraphs */
  paragraphs: z.array(BLUFParagraphSchema).min(1).max(4),
  /** Combined text of all paragraphs */
  full_text: z.string(),
  /** ISO timestamp when this BLUF was generated */
  generated_at: z.string(),
  /** Model used to generate this BLUF */
  model: z.string(),
  /** Quality score from 0-100 */
  quality_score: z.number().min(0).max(100).optional(),
  /** Time taken to generate this BLUF in milliseconds */
  generation_time_ms: z.number().optional()
});

export type SectionBLUF = z.infer<typeof SectionBLUFSchema>;

// ===== CHAPTER CODES FOR BLUF GENERATION =====

export const ChapterCodeBlufSchema = z.enum(['GE', 'PH', 'PL', 'RS']);
export type ChapterCodeBluf = z.infer<typeof ChapterCodeBlufSchema>;

// ===== DIMENSION CODES FOR BLUF GENERATION =====

export const DimensionCodeBlufSchema = z.enum([
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
]);
export type DimensionCodeBluf = z.infer<typeof DimensionCodeBlufSchema>;

// ===== PHASE 4.5A OUTPUT (Generation) =====

/**
 * Phase 4.5A Output Schema
 * Contains all generated BLUFs organized by report type
 */
export const Phase4_5A_OutputSchema = z.object({
  /** Metadata about the Phase 4.5A execution */
  meta: z.object({
    /** Phase identifier */
    phase: z.literal('4.5A'),
    /** Run ID from pipeline execution */
    assessment_run_id: z.string(),
    /** Company name for the assessment */
    company_name: z.string(),
    /** ISO timestamp when generation completed */
    generated_at: z.string(),
    /** Model used for generation */
    model: z.string().default('claude-sonnet-4-20250514'),
    /** Total number of BLUFs generated */
    total_blufs_generated: z.number(),
    /** Total processing time in milliseconds */
    total_processing_time_ms: z.number(),
    /** Number of cache hits */
    cache_hits: z.number().default(0),
    /** Number of cache misses */
    cache_misses: z.number().default(0),
    /** Number of retry attempts */
    retry_count: z.number().default(0),
    /** Whether all BLUFs passed validation */
    validation_passed: z.boolean(),
    /** Average quality score across all BLUFs */
    average_quality_score: z.number().min(0).max(100).optional()
  }),

  /** Executive-level BLUFs */
  executive_blufs: z.object({
    comprehensive_report: ExecutiveBLUFSchema,
    owner_report: ExecutiveBLUFSchema,
    executive_brief: SectionBLUFSchema
  }),

  /** Chapter-level BLUFs (4 chapters) */
  chapter_blufs: z.record(
    ChapterCodeBlufSchema,
    SectionBLUFSchema
  ),

  /** Dimension-level BLUFs (12 dimensions) */
  dimension_blufs: z.record(
    DimensionCodeBlufSchema,
    SectionBLUFSchema
  ),

  /** Focused report BLUFs */
  focused_report_blufs: z.object({
    quick_wins: SectionBLUFSchema,
    risk_assessment: SectionBLUFSchema,
    roadmap: SectionBLUFSchema,
    financial_opportunities: SectionBLUFSchema,
    employees_report: SectionBLUFSchema
  }),

  /** Manager report BLUFs (5 functional areas) */
  manager_report_blufs: z.object({
    financials_manager: SectionBLUFSchema,
    operations_manager: SectionBLUFSchema,
    sales_marketing_manager: SectionBLUFSchema,
    strategy_manager: SectionBLUFSchema,
    it_technology_manager: SectionBLUFSchema
  }),

  /** Validation summary */
  validation_summary: z.object({
    /** Total number of BLUFs in output */
    total_blufs: z.number(),
    /** Number that passed validation */
    passed_validation: z.number(),
    /** Number that failed validation */
    failed_validation: z.number(),
    /** Warning messages */
    warnings: z.array(z.string()),
    /** Error messages */
    errors: z.array(z.string()),
    /** Quality scores by BLUF type */
    quality_scores_by_type: z.object({
      executive_avg: z.number().min(0).max(100).optional(),
      section_avg: z.number().min(0).max(100).optional()
    }).optional()
  }),

  /** Performance metrics */
  performance_metrics: z.object({
    /** Total API calls made */
    total_api_calls: z.number(),
    /** Total tokens used (if tracked) */
    total_tokens_used: z.number().optional(),
    /** Average generation time per BLUF */
    avg_generation_time_ms: z.number(),
    /** Maximum generation time for any BLUF */
    max_generation_time_ms: z.number(),
    /** Minimum generation time for any BLUF */
    min_generation_time_ms: z.number()
  }).optional()
});

export type Phase4_5A_Output = z.infer<typeof Phase4_5A_OutputSchema>;

// ===== VALIDATION UTILITIES =====

/**
 * Result of validating a single BLUF
 */
export interface BLUFValidationResult {
  /** Whether the BLUF is valid */
  isValid: boolean;
  /** Validation errors (must be fixed) */
  errors: string[];
  /** Validation warnings (should be addressed) */
  warnings: string[];
  /** Quality score from 0-100 */
  quality_score: number;
  /** Detailed metrics about the BLUF */
  metrics: {
    word_count: number;
    paragraph_count: number;
    has_quantitative_evidence: boolean;
    has_company_specific_content: boolean;
    evidence_density: number;      // 0-1 (ratio of sentences with numbers)
    readability_score: number;     // 0-100 (Flesch Reading Ease approximation)
  };
}

/** BLUF type discriminator */
export type BLUFType = 'executive' | 'section';

/** Report context for BLUF generation */
export type ReportContext =
  | 'comprehensive'
  | 'owner'
  | 'chapter'
  | 'dimension'
  | 'focused'
  | 'manager';

// ===== CACHING TYPES =====

/**
 * Cache entry for a generated BLUF
 */
export interface BLUFCacheEntry {
  /** The cached BLUF */
  bluf: ExecutiveBLUF | SectionBLUF;
  /** ISO timestamp when this was cached */
  cached_at: string;
  /** ISO timestamp when this cache entry expires */
  ttl_expires_at: string;
  /** Cache key used to store this entry */
  cache_key: string;
  /** Hash of IDM version used to generate this BLUF */
  idm_version: string;
}

/**
 * Configuration for the BLUF cache
 */
export interface BLUFCacheConfig {
  /** Whether caching is enabled */
  enabled: boolean;
  /** Time-to-live in hours */
  ttl_hours: number;
  /** Maximum number of entries in cache */
  max_entries: number;
  /** Whether to track IDM version changes */
  version_tracking: boolean;
}

// ===== GENERATION OPTIONS =====

/**
 * Options for Phase 4.5A execution
 */
export interface Phase4_5A_Options {
  /** Anthropic API key override */
  apiKey?: string;
  /** Output directory for writing results */
  outputDir?: string;
  /** Run ID for this pipeline execution */
  runId?: string;
  /** Whether to use caching */
  useCache?: boolean;
  /** Whether to skip certain BLUF types */
  skipTypes?: ('executive' | 'chapter' | 'dimension' | 'focused' | 'manager')[];
  /** Quality threshold for auto-approval */
  qualityThreshold?: number;
}

// ===== BLUF RENDERING TYPES =====

/**
 * Context for rendering BLUFs into reports
 */
export interface BLUFRenderContext {
  /** The source IDM */
  idm: unknown; // Actual IDM type imported where needed
  /** Phase 4.5A output with all generated BLUFs */
  phase45Output: Phase4_5A_Output;
  /** Type of report being rendered */
  reportType: string;
  /** Whether to include metadata in rendered output */
  includeMetadata?: boolean;
}

/**
 * Result of Phase 4.5 execution
 */
export interface Phase4_5_Result {
  /** Phase number */
  phase: 4.5;
  /** Execution status */
  status: 'success' | 'failed' | 'partial';
  /** Duration in milliseconds */
  duration_ms: number;
  /** Path to output file */
  output_path?: string;
  /** Error message if failed */
  error?: string;
  /** Detailed results */
  details?: {
    total_blufs: number;
    validation_passed: boolean;
    average_quality_score?: number;
    cache_hit_rate?: string;
  };
}
