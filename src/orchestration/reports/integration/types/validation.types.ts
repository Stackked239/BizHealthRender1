/**
 * Validation framework types for integration quality assurance.
 */

import type {
  ClientDeliverableType,
  IntermediateFileType,
  ValidationSeverity,
  IntegrationPattern
} from './content.types.js';

// ============================================================================
// VALIDATION CHECK
// ============================================================================

export interface ValidationCheck {
  /** Check identifier */
  id: string;

  /** Check name */
  name: string;

  /** Whether check passed */
  passed: boolean;

  /** Check message (explanation) */
  message: string;

  /** Severity if failed */
  severity: ValidationSeverity;

  /** Related source file */
  source?: IntermediateFileType;

  /** Related target section */
  targetSection?: string;

  /** Actual value (for comparison checks) */
  actualValue?: unknown;

  /** Expected value (for comparison checks) */
  expectedValue?: unknown;
}

// ============================================================================
// COVERAGE REPORT
// ============================================================================

export interface CoverageReport {
  /** Expected number of integrations */
  expectedIntegrations: number;

  /** Actually applied integrations */
  appliedIntegrations: number;

  /** Coverage percentage (0-100) */
  coveragePercentage: number;

  /** Missing integrations */
  missingIntegrations: IntegrationGap[];

  /** Extra integrations (unexpected) */
  unexpectedIntegrations: string[];
}

export interface IntegrationGap {
  /** Source file */
  source: IntermediateFileType;

  /** Target section */
  targetSection: string;

  /** Reason for gap */
  reason: string;

  /** Whether this is critical */
  critical: boolean;
}

// ============================================================================
// VALIDATION RESULT (For one deliverable)
// ============================================================================

export interface DeliverableValidationResult {
  /** Deliverable validated */
  deliverable: ClientDeliverableType;

  /** Overall pass/fail */
  passed: boolean;

  /** All validation checks */
  checks: ValidationCheck[];

  /** Coverage report */
  coverage: CoverageReport;

  /** Summary counts */
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    criticalFailures: number;
    highFailures: number;
    mediumFailures: number;
    lowFailures: number;
  };

  /** Recommendations for improvement */
  recommendations: string[];
}

// ============================================================================
// FULL VALIDATION RESULT (All deliverables)
// ============================================================================

export interface FullValidationResult {
  /** Timestamp */
  validatedAt: string;

  /** Overall pass/fail */
  overallPassed: boolean;

  /** Results by deliverable */
  byDeliverable: Partial<Record<ClientDeliverableType, DeliverableValidationResult>>;

  /** Summary statistics */
  summary: {
    totalDeliverables: number;
    passedDeliverables: number;
    failedDeliverables: number;
    totalIntegrationsExpected: number;
    totalIntegrationsApplied: number;
    overallCoveragePercent: number;
    criticalIssueCount: number;
  };

  /** All critical issues (for fail-hard logic) */
  criticalIssues: ValidationCheck[];

  /** All high-priority issues */
  highIssues: ValidationCheck[];

  /** Global recommendations */
  recommendations: string[];
}

// ============================================================================
// VALIDATION ERROR (For throwing)
// ============================================================================

export class IntegrationValidationError extends Error {
  public readonly criticalIssues: ValidationCheck[];
  public readonly validationResult: FullValidationResult;

  constructor(
    message: string,
    criticalIssues: ValidationCheck[],
    validationResult: FullValidationResult
  ) {
    super(message);
    this.name = 'IntegrationValidationError';
    this.criticalIssues = criticalIssues;
    this.validationResult = validationResult;

    // Maintain proper stack trace (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IntegrationValidationError);
    }
  }
}

// ============================================================================
// VALIDATION CONFIG
// ============================================================================

export interface ValidationConfig {
  /** Whether to fail on critical issues */
  failOnCritical: boolean;

  /** Whether to fail on high-priority issues */
  failOnHigh: boolean;

  /** Minimum coverage percentage required */
  minCoveragePercent: number;

  /** Whether to log warnings */
  logWarnings: boolean;

  /** Whether to generate recommendations */
  generateRecommendations: boolean;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  failOnCritical: true,
  failOnHigh: false,
  minCoveragePercent: 80,
  logWarnings: true,
  generateRecommendations: true
};
