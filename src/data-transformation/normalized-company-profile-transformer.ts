/**
 * Normalized Company Profile Transformer
 *
 * Extends the base company profile transformer with Phase 0 features:
 * - Snapshot ID for frozen context at assessment time
 * - Transformation versioning
 * - Full audit metadata
 */

import { v4 as uuidv4 } from 'uuid';
import { transformToCompanyProfile } from './company-profile-transformer.js';
import type { WebhookPayload } from '../types/webhook.types.js';
import type { CompanyProfile } from '../types/company-profile.types.js';
import type {
  NormalizedCompanyProfile,
  NormalizedCPMetadata,
  CompanyProfileTransformResult,
  PHASE0_VERSIONS,
} from '../types/normalized.types.js';
import { createLogger } from '../utils/logger.js';
import { generateAuditTimestamp, computePayloadHash } from '../utils/security.js';

const logger = createLogger('normalized-cp-transformer');

// Current transformation version
const CP_TRANSFORMATION_VERSION = 'v1.0.0';
const CP_SCHEMA_VERSION = 'v2025-09-16';

/**
 * Options for normalized company profile transformation
 */
export interface NormalizedCPTransformOptions {
  /** Assessment run ID this snapshot belongs to */
  assessmentRunId: string;

  /** Override the snapshot ID (generates UUID if not provided) */
  snapshotId?: string;

  /** Override the transformation version */
  transformationVersion?: string;

  /** Override the schema version */
  schemaVersion?: string;
}

/**
 * Transform raw company profile data to normalized format with snapshot support
 *
 * @param rawCompanyProfile - The raw company profile payload (business_overview section)
 * @param rawQuestionnaire - The raw questionnaire data (for derived fields)
 * @param options - Transformation options including assessment run ID
 * @returns CompanyProfileTransformResult with success status and profile or errors
 */
export function transformToNormalizedCompanyProfile(
  rawCompanyProfile: unknown,
  rawQuestionnaire: unknown,
  options: NormalizedCPTransformOptions
): CompanyProfileTransformResult {
  const timestamp = generateAuditTimestamp();

  logger.info(
    {
      assessment_run_id: options.assessmentRunId,
      transformation_version: options.transformationVersion || CP_TRANSFORMATION_VERSION,
    },
    'Starting normalized company profile transformation'
  );

  try {
    // Reconstruct a webhook-like payload for the base transformer
    const webhookPayload = reconstructWebhookPayload(rawCompanyProfile, rawQuestionnaire);

    // Use base transformer to create CompanyProfile
    const baseProfile = transformToCompanyProfile(webhookPayload);

    // Extract the profile_id from base transformer
    const profileId = baseProfile.metadata.profile_id;

    // Create extended normalized metadata
    const normalizedMetadata: NormalizedCPMetadata = {
      profile_id: profileId,
      snapshot_id: options.snapshotId || uuidv4(),
      assessment_run_id: options.assessmentRunId,
      created_at: timestamp,
      last_updated: timestamp,
      cp_version: options.schemaVersion || CP_SCHEMA_VERSION,
      cp_transformation_version: options.transformationVersion || CP_TRANSFORMATION_VERSION,
      assessment_version: baseProfile.metadata.assessment_version,
    };

    // Build normalized company profile
    const normalizedProfile: NormalizedCompanyProfile = {
      ...baseProfile,
      metadata: normalizedMetadata,
    };

    logger.info(
      {
        assessment_run_id: options.assessmentRunId,
        profile_id: profileId,
        snapshot_id: normalizedMetadata.snapshot_id,
      },
      'Normalized company profile transformation completed'
    );

    return {
      success: true,
      profile: normalizedProfile,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(
      {
        assessment_run_id: options.assessmentRunId,
        error: errorMessage,
      },
      'Normalized company profile transformation failed'
    );

    return {
      success: false,
      error: errorMessage,
      validationErrors:
        error instanceof Error && 'field' in error
          ? [(error as { field?: string }).field || errorMessage]
          : [errorMessage],
    };
  }
}

/**
 * Reconstruct a WebhookPayload-like object from raw parts
 *
 * This allows reuse of the existing transformer while keeping raw data separate.
 */
function reconstructWebhookPayload(
  rawCompanyProfile: unknown,
  rawQuestionnaire: unknown
): WebhookPayload {
  // Type guard for the raw data
  if (typeof rawCompanyProfile !== 'object' || rawCompanyProfile === null) {
    throw new Error('Invalid raw company profile: expected object');
  }

  if (typeof rawQuestionnaire !== 'object' || rawQuestionnaire === null) {
    throw new Error('Invalid raw questionnaire: expected object');
  }

  // Cast with type assertion after validation
  const businessOverview = rawCompanyProfile as Record<string, unknown>;
  const questionnaire = rawQuestionnaire as Record<string, unknown>;

  // Reconstruct the webhook payload structure
  return {
    event: 'phase0_reconstruction',
    timestamp: new Date().toISOString(),
    submission_id: 'reconstructed',
    created_at: new Date().toISOString(),
    business_overview: businessOverview as WebhookPayload['business_overview'],
    strategy: (questionnaire.strategy || {}) as WebhookPayload['strategy'],
    sales: (questionnaire.sales || {}) as WebhookPayload['sales'],
    marketing: (questionnaire.marketing || {}) as WebhookPayload['marketing'],
    customer_experience: (questionnaire.customer_experience || {}) as WebhookPayload['customer_experience'],
    operations: (questionnaire.operations || {}) as WebhookPayload['operations'],
    financials: (questionnaire.financials || {}) as WebhookPayload['financials'],
    human_resources: (questionnaire.human_resources || {}) as WebhookPayload['human_resources'],
    leadership: (questionnaire.leadership || {}) as WebhookPayload['leadership'],
    technology: (questionnaire.technology || {}) as WebhookPayload['technology'],
    it_infrastructure: (questionnaire.it_infrastructure || {}) as WebhookPayload['it_infrastructure'],
    risk_management: (questionnaire.risk_management || {}) as WebhookPayload['risk_management'],
    compliance: (questionnaire.compliance || {}) as WebhookPayload['compliance'],
  };
}

/**
 * Transform directly from a WebhookPayload to NormalizedCompanyProfile
 *
 * Convenience function when working with the full webhook payload.
 */
export function transformWebhookToNormalizedCP(
  webhookPayload: WebhookPayload,
  options: NormalizedCPTransformOptions
): CompanyProfileTransformResult {
  const { business_overview, ...questionnaire } = webhookPayload;

  return transformToNormalizedCompanyProfile(
    business_overview,
    questionnaire,
    options
  );
}

/**
 * Validate a normalized company profile structure
 */
export function validateNormalizedCompanyProfile(
  profile: NormalizedCompanyProfile
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate metadata
  if (!profile.metadata.profile_id) {
    errors.push('Missing profile_id in metadata');
  }
  if (!profile.metadata.snapshot_id) {
    errors.push('Missing snapshot_id in metadata');
  }
  if (!profile.metadata.assessment_run_id) {
    errors.push('Missing assessment_run_id in metadata');
  }
  if (!profile.metadata.cp_transformation_version) {
    errors.push('Missing cp_transformation_version in metadata');
  }

  // Validate basic information
  if (!profile.basic_information.company_name) {
    errors.push('Missing company_name in basic_information');
  }

  // Validate size metrics
  if (profile.size_metrics.workforce.total_workforce < 0) {
    errors.push('Invalid total_workforce: must be non-negative');
  }
  if (profile.size_metrics.revenue.last_year_total < 0) {
    errors.push('Invalid last_year_total: must be non-negative');
  }

  // Validate benchmark selectors
  if (!profile.benchmark_selectors.primary_industry_code) {
    errors.push('Missing primary_industry_code in benchmark_selectors');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compare two company profile snapshots to detect changes
 */
export function compareProfileSnapshots(
  oldProfile: NormalizedCompanyProfile,
  newProfile: NormalizedCompanyProfile
): {
  hasChanges: boolean;
  changes: Record<string, { old: unknown; new: unknown }>;
} {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  // Compare key fields
  const fieldsToCompare = [
    'basic_information.company_name',
    'basic_information.location.city',
    'basic_information.location.state_province',
    'basic_information.industry.primary_industry',
    'size_metrics.workforce.total_workforce',
    'size_metrics.revenue.last_year_total',
    'size_metrics.revenue.projected_this_year',
    'growth_context.growth_phase',
    'growth_context.strategic_intent',
  ];

  for (const field of fieldsToCompare) {
    const oldValue = getNestedValue(oldProfile, field);
    const newValue = getNestedValue(newProfile, field);

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[field] = { old: oldValue, new: newValue };
    }
  }

  return {
    hasChanges: Object.keys(changes).length > 0,
    changes,
  };
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export {
  CP_TRANSFORMATION_VERSION,
  CP_SCHEMA_VERSION,
};
