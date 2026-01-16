/**
 * Zod Validation Schemas for Phase 0A - Raw Input Capture
 *
 * These schemas validate the structure of raw assessment data
 * before persistence. The raw_company_profile and raw_questionnaire
 * fields are intentionally unvalidated (unknown) to preserve
 * exact original data.
 */

import { z } from 'zod';

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * ISO 8601 datetime string
 */
const DateTimeSchema = z.string().datetime({
  message: 'Must be a valid ISO 8601 datetime string',
});

/**
 * UUID v4 identifier
 */
const UuidSchema = z.string().uuid({
  message: 'Must be a valid UUID',
});

/**
 * SHA-256 hash (64 hex characters)
 */
const SHA256HashSchema = z.string().regex(/^[a-f0-9]{64}$/i, {
  message: 'Must be a valid SHA-256 hash (64 hex characters)',
});

/**
 * Source types for assessment submissions
 */
const SourceSchema = z.enum(['web', 'partner', 'api', 'migration']).or(z.string().min(1));

// ============================================================================
// Raw Assessment Metadata Schema
// ============================================================================

/**
 * Metadata for raw assessment capture
 */
export const RawAssessmentMetaSchema = z.object({
  received_at: DateTimeSchema,
  questionnaire_version: z.string().min(1, 'Questionnaire version is required'),
  cp_version: z.string().min(1, 'Company profile version is required'),
  source: SourceSchema,
  payload_hash: SHA256HashSchema,
  original_submission_id: z.string().optional(),
  client_identifier: z.string().optional(),
});

// ============================================================================
// Raw Assessment Schema
// ============================================================================

/**
 * Raw Assessment - Complete capture schema
 *
 * Note: raw_company_profile and raw_questionnaire are z.unknown()
 * intentionally to preserve exact original data structure without validation.
 */
export const RawAssessmentSchema = z.object({
  id: UuidSchema,
  company_profile_id: z.string().min(1, 'Company profile ID is required'),
  raw_company_profile: z.unknown(),
  raw_questionnaire: z.unknown(),
  meta: RawAssessmentMetaSchema,
});

// ============================================================================
// Write Operation Log Schema
// ============================================================================

/**
 * Write operation log entry schema
 */
export const WriteOperationLogSchema = z.object({
  timestamp: DateTimeSchema,
  operation: z.enum(['create', 'archive']),
  file_path: z.string().min(1, 'File path is required'),
  assessment_run_id: UuidSchema,
  company_profile_id: z.string().min(1, 'Company profile ID is required'),
  content_hash: SHA256HashSchema,
  actor: z.string().min(1, 'Actor is required'),
  size_bytes: z.number().int().nonnegative(),
});

// ============================================================================
// Integrity Log Schema
// ============================================================================

/**
 * Integrity log entry schema
 */
export const IntegrityLogEntrySchema = z.object({
  assessment_run_id: UuidSchema,
  company_profile_id: z.string().min(1, 'Company profile ID is required'),
  payload_hash: SHA256HashSchema,
  computed_at: DateTimeSchema,
  algorithm: z.literal('sha256'),
  verified: z.boolean().optional(),
  last_verified_at: DateTimeSchema.optional(),
});

// ============================================================================
// PII Field Identifier Schema
// ============================================================================

/**
 * PII field identifier schema
 */
export const PIIFieldIdentifierSchema = z.object({
  field_path: z.string().min(1, 'Field path is required'),
  pii_type: z.enum(['name', 'email', 'phone', 'address', 'url', 'ip', 'financial', 'other']),
  description: z.string().min(1, 'Description is required'),
  redact_in_logs: z.boolean(),
  exclude_from_analytics: z.boolean(),
});

// ============================================================================
// Raw Assessment Path Schema
// ============================================================================

/**
 * Raw assessment file path structure schema
 */
export const RawAssessmentPathSchema = z.object({
  base_dir: z.string().min(1, 'Base directory is required'),
  company_dir: z.string().min(1, 'Company directory is required'),
  file_name: z.string().min(1, 'File name is required'),
  full_path: z.string().min(1, 'Full path is required'),
});

// ============================================================================
// Raw Assessment Write Result Schema
// ============================================================================

/**
 * Result of a raw assessment write operation schema
 */
export const RawAssessmentWriteResultSchema = z.object({
  success: z.boolean(),
  assessment: RawAssessmentSchema,
  path: RawAssessmentPathSchema,
  log_entry: WriteOperationLogSchema,
  integrity_entry: IntegrityLogEntrySchema,
  error: z.string().optional(),
});

// ============================================================================
// Create Raw Assessment Options Schema
// ============================================================================

/**
 * Options for creating a raw assessment schema
 */
export const CreateRawAssessmentOptionsSchema = z.object({
  source: SourceSchema.optional(),
  questionnaire_version: z.string().optional(),
  cp_version: z.string().optional(),
  client_identifier: z.string().optional(),
  assessment_run_id: UuidSchema.optional(),
  company_profile_id: z.string().optional(),
});

// ============================================================================
// Type Inference Helpers
// ============================================================================

export type RawAssessment = z.infer<typeof RawAssessmentSchema>;
export type RawAssessmentMeta = z.infer<typeof RawAssessmentMetaSchema>;
export type WriteOperationLog = z.infer<typeof WriteOperationLogSchema>;
export type IntegrityLogEntry = z.infer<typeof IntegrityLogEntrySchema>;
export type PIIFieldIdentifier = z.infer<typeof PIIFieldIdentifierSchema>;
export type RawAssessmentPath = z.infer<typeof RawAssessmentPathSchema>;
export type RawAssessmentWriteResult = z.infer<typeof RawAssessmentWriteResultSchema>;
export type CreateRawAssessmentOptions = z.infer<typeof CreateRawAssessmentOptionsSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate raw assessment data
 */
export function validateRawAssessment(data: unknown): RawAssessment {
  return RawAssessmentSchema.parse(data);
}

/**
 * Safely validate raw assessment without throwing
 */
export function safeValidateRawAssessment(data: unknown) {
  return RawAssessmentSchema.safeParse(data);
}

/**
 * Validate raw assessment metadata
 */
export function validateRawAssessmentMeta(data: unknown): RawAssessmentMeta {
  return RawAssessmentMetaSchema.parse(data);
}

/**
 * Validate write operation log
 */
export function validateWriteOperationLog(data: unknown): WriteOperationLog {
  return WriteOperationLogSchema.parse(data);
}

/**
 * Validate integrity log entry
 */
export function validateIntegrityLogEntry(data: unknown): IntegrityLogEntry {
  return IntegrityLogEntrySchema.parse(data);
}

// ============================================================================
// Schema Exports
// ============================================================================

export {
  DateTimeSchema,
  UuidSchema,
  SHA256HashSchema,
  SourceSchema,
};
