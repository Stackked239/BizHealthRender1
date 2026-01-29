/**
 * Zod Validation Schemas for Phase 0B - Normalized Types
 *
 * These schemas validate the normalized data structures
 * produced by the Phase 0 transformers.
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

const DateTimeSchema = z.string().datetime();
const UuidSchema = z.string().uuid();

// ============================================================================
// Dimension and Chapter Codes
// ============================================================================

// NOTE: Both ITD (canonical) and IDS (legacy) are accepted for backward compatibility
export const DimensionCodeSchema = z.enum([
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'ITD', 'IDS', 'RMS', 'CMP',
]);

export const ChapterCodeSchema = z.enum(['GE', 'PH', 'PL', 'RS']);

// ============================================================================
// Normalized Company Profile Schemas
// ============================================================================

export const NormalizedCPMetadataSchema = z.object({
  profile_id: z.string().min(1),
  snapshot_id: UuidSchema,
  assessment_run_id: UuidSchema,
  created_at: DateTimeSchema,
  last_updated: DateTimeSchema,
  cp_version: z.string().min(1),
  cp_transformation_version: z.string().min(1),
  assessment_version: z.string().min(1),
});

// ============================================================================
// Normalized Questionnaire Response Schemas
// ============================================================================

export const NormalizedQuestionResponseSchema = z.object({
  question_id: z.string().min(1),
  question_number: z.number().int().positive(),
  original_prompt_text: z.string().min(1),
  raw_response: z.unknown(),
  normalized_value: z.number().optional(),
  normalization_method: z.enum([
    'scale_1_5', 'percentage', 'currency', 'numeric', 'boolean', 'text', 'composite',
  ]).optional(),
  dimension_code: DimensionCodeSchema,
  sub_indicator_id: z.string().min(1),
  derived_metrics: z.record(z.number()).optional(),
  response_type: z.string().min(1),
  response_unit: z.string().optional(),
  is_estimate: z.boolean().optional(),
  not_applicable: z.boolean().optional(),
  question_weight: z.number().nonnegative(),
});

export const DimensionMetricsSchema = z.object({
  avg_scale_score: z.number().optional(),
  avg_normalized_score: z.number().optional(),
  total_questions: z.number().int().nonnegative(),
  questions_answered: z.number().int().nonnegative(),
  completion_rate: z.number().min(0).max(100),
});

export const NormalizedDimensionSchema = z.object({
  dimension_code: DimensionCodeSchema,
  name: z.string().min(1),
  questions: z.array(NormalizedQuestionResponseSchema),
  dimension_metrics: DimensionMetricsSchema,
  derived_metrics: z.record(z.union([z.number(), z.string(), z.null()])).optional(),
});

export const ChapterMetricsSchema = z.object({
  avg_score: z.number(),
  total_questions: z.number().int().nonnegative(),
  questions_answered: z.number().int().nonnegative(),
  completion_rate: z.number().min(0).max(100),
});

export const NormalizedChapterSchema = z.object({
  chapter_code: ChapterCodeSchema,
  name: z.string().min(1),
  dimensions: z.array(NormalizedDimensionSchema),
  chapter_metrics: ChapterMetricsSchema,
});

export const NormalizedQRMetadataSchema = z.object({
  response_id: UuidSchema,
  assessment_run_id: UuidSchema,
  company_profile_id: z.string().min(1),
  questionnaire_version: z.string().min(1),
  qr_transformation_version: z.string().min(1),
  completion_date: DateTimeSchema,
  completion_status: z.enum(['complete', 'partial']),
  total_questions: z.number().int().nonnegative(),
  questions_answered: z.number().int().nonnegative(),
  transformed_at: DateTimeSchema,
});

export const OverallMetricsSchema = z.object({
  total_questions: z.number().int().nonnegative(),
  total_answered: z.number().int().nonnegative(),
  completion_rate: z.number().min(0).max(100),
  overall_avg_scale_score: z.number(),
  overall_avg_normalized_score: z.number(),
  chapter_scores: z.record(ChapterCodeSchema, z.number()),
  dimension_scores: z.record(DimensionCodeSchema, z.number()),
});

export const NormalizedQuestionnaireResponsesSchema = z.object({
  meta: NormalizedQRMetadataSchema,
  chapters: z.array(NormalizedChapterSchema),
  overall_metrics: OverallMetricsSchema,
  derived_metrics: z.record(z.number().optional()),
});

// ============================================================================
// Assessment Index Schemas
// ============================================================================

export const AssessmentIndexEntryPathsSchema = z.object({
  raw_assessment: z.string().min(1),
  normalized_company_profile: z.string(),
  normalized_questionnaire_responses: z.string(),
  benchmark_data: z.string().optional(),
});

export const AssessmentIndexEntryStatusSchema = z.enum([
  'raw_captured',
  'normalized',
  'ready_for_analysis',
  'analysis_complete',
  'error',
]);

export const AssessmentIndexEntryErrorSchema = z.object({
  phase: z.string().min(1),
  message: z.string().min(1),
  timestamp: DateTimeSchema,
});

export const PhaseMetadataSchema = z.object({
  phase1_completed_at: DateTimeSchema.optional(),
  phase2_completed_at: DateTimeSchema.optional(),
  phase3_completed_at: DateTimeSchema.optional(),
  phase4_completed_at: DateTimeSchema.optional(),
});

export const AssessmentIndexEntrySchema = z.object({
  assessment_run_id: UuidSchema,
  company_profile_id: z.string().min(1),
  cp_snapshot_id: UuidSchema,
  created_at: DateTimeSchema,
  questionnaire_version: z.string().min(1),
  cp_version: z.string().min(1),
  cp_transformation_version: z.string().min(1),
  qr_transformation_version: z.string().min(1),
  paths: AssessmentIndexEntryPathsSchema,
  status: AssessmentIndexEntryStatusSchema,
  error: AssessmentIndexEntryErrorSchema.optional(),
  phase_metadata: PhaseMetadataSchema.optional(),
});

export const AssessmentIndexSchema = z.object({
  version: z.string().min(1),
  last_updated: DateTimeSchema,
  entries: z.record(AssessmentIndexEntrySchema),
});

// ============================================================================
// Validation Functions
// ============================================================================

export function validateNormalizedQR(data: unknown) {
  return NormalizedQuestionnaireResponsesSchema.parse(data);
}

export function safeValidateNormalizedQR(data: unknown) {
  return NormalizedQuestionnaireResponsesSchema.safeParse(data);
}

export function validateAssessmentIndexEntry(data: unknown) {
  return AssessmentIndexEntrySchema.parse(data);
}

export function validateAssessmentIndex(data: unknown) {
  return AssessmentIndexSchema.parse(data);
}

// ============================================================================
// Type Inference
// ============================================================================

export type NormalizedQuestionResponse = z.infer<typeof NormalizedQuestionResponseSchema>;
export type NormalizedDimension = z.infer<typeof NormalizedDimensionSchema>;
export type NormalizedChapter = z.infer<typeof NormalizedChapterSchema>;
export type NormalizedQRMetadata = z.infer<typeof NormalizedQRMetadataSchema>;
export type NormalizedQuestionnaireResponses = z.infer<typeof NormalizedQuestionnaireResponsesSchema>;
export type AssessmentIndexEntry = z.infer<typeof AssessmentIndexEntrySchema>;
export type AssessmentIndex = z.infer<typeof AssessmentIndexSchema>;
