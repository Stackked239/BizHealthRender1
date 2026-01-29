/**
 * Raw Input Types for Phase 0A - Immutable Raw Data Capture
 *
 * These types define the structure for capturing raw assessment data
 * from webhooks before any transformation or normalization occurs.
 *
 * Key Principles:
 * - Raw data is immutable after capture
 * - All payloads are hashed for integrity verification
 * - Full audit trail with metadata
 */

/**
 * Metadata for raw assessment capture
 */
export interface RawAssessmentMeta {
  /** ISO 8601 timestamp when the assessment was received */
  received_at: string;

  /** Version of the questionnaire used (e.g., 'v2025-09-16') */
  questionnaire_version: string;

  /** Version of the company profile schema (e.g., 'v2025-09-16') */
  cp_version: string;

  /** Source of the submission */
  source: 'web' | 'partner' | 'api' | 'migration' | string;

  /** SHA-256 hash of the full raw payload for integrity verification */
  payload_hash: string;

  /** Original submission ID from the form/webhook */
  original_submission_id?: string;

  /** IP address or client identifier (for audit) */
  client_identifier?: string;
}

/**
 * Raw Assessment - Immutable capture of all client inputs
 *
 * This is the primary data structure for Phase 0A.
 * It captures the exact payload received from the webhook
 * without any transformation or normalization.
 */
export interface RawAssessment {
  /** Unique identifier for this assessment run (UUID v4) */
  id: string;

  /** Reference to the company profile (stable across assessments) */
  company_profile_id: string;

  /**
   * Full company profile payload from form/webhook
   * Type is 'unknown' to preserve exact original data structure
   */
  raw_company_profile: unknown;

  /**
   * Full questionnaire payload from form/webhook
   * Type is 'unknown' to preserve exact original data structure
   */
  raw_questionnaire: unknown;

  /** Capture metadata */
  meta: RawAssessmentMeta;
}

/**
 * Write operation log entry for audit trail
 */
export interface WriteOperationLog {
  /** ISO 8601 timestamp of the write operation */
  timestamp: string;

  /** Type of operation */
  operation: 'create' | 'archive';

  /** Path where data was written */
  file_path: string;

  /** Assessment run ID */
  assessment_run_id: string;

  /** Company profile ID */
  company_profile_id: string;

  /** Hash of the written data */
  content_hash: string;

  /** Service or user that performed the write */
  actor: string;

  /** Size of the written data in bytes */
  size_bytes: number;
}

/**
 * Integrity log entry for verification
 */
export interface IntegrityLogEntry {
  /** Assessment run ID */
  assessment_run_id: string;

  /** Company profile ID */
  company_profile_id: string;

  /** SHA-256 hash of the full payload */
  payload_hash: string;

  /** ISO 8601 timestamp when hash was computed */
  computed_at: string;

  /** Algorithm used for hashing */
  algorithm: 'sha256';

  /** Verification status (for re-verification checks) */
  verified?: boolean;

  /** Last verification timestamp */
  last_verified_at?: string;
}

/**
 * PII field identifier for sensitive data handling
 */
export interface PIIFieldIdentifier {
  /** Path to the field in the payload (dot notation) */
  field_path: string;

  /** Type of PII */
  pii_type: 'name' | 'email' | 'phone' | 'address' | 'url' | 'ip' | 'financial' | 'other';

  /** Description of the field */
  description: string;

  /** Whether this field should be redacted in logs/analytics */
  redact_in_logs: boolean;

  /** Whether this field should be excluded from analytics */
  exclude_from_analytics: boolean;
}

/**
 * Known PII fields in the BizHealth webhook payload
 */
export const KNOWN_PII_FIELDS: PIIFieldIdentifier[] = [
  {
    field_path: 'business_overview.company_name',
    pii_type: 'name',
    description: 'Legal company name',
    redact_in_logs: false,
    exclude_from_analytics: false,
  },
  {
    field_path: 'business_overview.company_website',
    pii_type: 'url',
    description: 'Company website URL',
    redact_in_logs: false,
    exclude_from_analytics: false,
  },
  {
    field_path: 'business_overview.location',
    pii_type: 'address',
    description: 'Company location (city, state)',
    redact_in_logs: false,
    exclude_from_analytics: false,
  },
  {
    field_path: 'business_overview.competitors.*.website',
    pii_type: 'url',
    description: 'Competitor website URLs',
    redact_in_logs: false,
    exclude_from_analytics: false,
  },
];

/**
 * Raw assessment file path structure
 */
export interface RawAssessmentPath {
  /** Base directory for raw storage */
  base_dir: string;

  /** Company profile ID directory */
  company_dir: string;

  /** Assessment file name (includes assessment_run_id) */
  file_name: string;

  /** Full path to the assessment file */
  full_path: string;
}

/**
 * Result of a raw assessment write operation
 */
export interface RawAssessmentWriteResult {
  /** Whether the write was successful */
  success: boolean;

  /** The raw assessment that was written */
  assessment: RawAssessment;

  /** Path where the assessment was stored */
  path: RawAssessmentPath;

  /** Write operation log entry */
  log_entry: WriteOperationLog;

  /** Integrity log entry */
  integrity_entry: IntegrityLogEntry;

  /** Error message if write failed */
  error?: string;
}

/**
 * Options for creating a raw assessment
 */
export interface CreateRawAssessmentOptions {
  /** Source of the submission */
  source?: RawAssessmentMeta['source'];

  /** Questionnaire version (auto-detected if not provided) */
  questionnaire_version?: string;

  /** Company profile version (auto-detected if not provided) */
  cp_version?: string;

  /** Client identifier for audit */
  client_identifier?: string;

  /** Custom assessment run ID (generates UUID if not provided) */
  assessment_run_id?: string;

  /** Custom company profile ID (generates from company name if not provided) */
  company_profile_id?: string;
}
