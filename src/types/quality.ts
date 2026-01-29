/**
 * BizHealth Pipeline Data Quality Types
 * Tracks validation issues and audit status for IDM consolidation
 *
 * This module provides comprehensive data quality tracking for the BizHealth
 * pipeline's Phase 4 (IDM Consolidation). It ensures graceful degradation is
 * accompanied by full visibility, severity-based issue tracking, and persistent
 * audit records.
 */

/** Severity levels for validation issues */
export type IssueSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

/** Component types that can have validation issues */
export type IssueComponent = 'CHAPTER' | 'DIMENSION' | 'INDICATOR' | 'QUESTION';

/** Overall audit status */
export type AuditStatus = 'PASS' | 'FAIL' | 'NEEDS_REVIEW';

/** Individual validation issue record */
export interface ValidationIssue {
  severity: IssueSeverity;
  component: IssueComponent;
  code: string;              // e.g., "STR", "FIN-03"
  message: string;
  details?: string;          // Additional context for debugging
  timestamp: string;         // ISO format
}

/** Per-dimension status tracking */
export interface DimensionStatus {
  dimensionCode: string;
  dimensionName: string;
  status: 'complete' | 'partial' | 'skipped';
  questionsExpected: number;
  questionsFound: number;
  subIndicatorsExpected: number;
  subIndicatorsGenerated: number;
  issues: ValidationIssue[];
}

/** Complete pipeline quality audit record */
export interface PipelineQualityAudit {
  // Identification
  runId: string;                    // Format: BH-YYYY-MMDD-HHMMSS
  companyName: string;
  timestamp: string;                // ISO format

  // Summary metrics
  totalQuestionsExpected: number;
  totalQuestionsProcessed: number;
  totalDimensionsExpected: number;
  totalDimensionsProcessed: number;
  totalDimensionsSkipped: number;
  totalSubIndicatorsExpected: number;
  totalSubIndicatorsGenerated: number;

  // Detailed tracking
  dimensionStatus: Record<string, DimensionStatus>;
  issues: ValidationIssue[];

  // Final assessment
  status: AuditStatus;
  criticalIssueCount: number;
  warningCount: number;
  infoCount: number;

  // Recommendations
  recommendations: string[];
}

/** Configuration for quality tracker */
export interface QualityTrackerConfig {
  strictMode?: boolean;              // If true, throws on CRITICAL issues
  criticalDimensions?: string[];     // Dimensions that trigger FAIL if missing
  outputDir?: string;                // Where to save audit files
}

/**
 * Default critical dimensions - missing any of these = FAIL
 * Uses canonical dimension codes from the BizHealth framework
 */
export const DEFAULT_CRITICAL_DIMENSIONS = ['STR', 'SAL', 'FIN', 'OPS'];

/**
 * All 12 BizHealth dimensions using canonical codes
 *
 * Chapter mapping:
 * - GE (Growth Engine): STR, SAL, MKT, CXP
 * - PH (Performance & Health): OPS, FIN
 * - PL (People & Leadership): HRS, LDG
 * - RS (Resilience & Safeguards): TIN, ITD, RMS, CMP
 *
 * Note: ITD is the canonical code for IT & Data Security (Phase 1.5+).
 * Legacy code IDS is handled by the IDM consolidator for backward compatibility.
 */
export const ALL_DIMENSION_CODES = [
  'STR',  // Strategy
  'SAL',  // Sales
  'MKT',  // Marketing
  'CXP',  // Customer Experience
  'OPS',  // Operations
  'FIN',  // Financials
  'HRS',  // Human Resources
  'LDG',  // Leadership & Governance
  'TIN',  // Technology & Innovation
  'ITD',  // IT & Data Security (canonical code)
  'RMS',  // Risk Management & Sustainability
  'CMP'   // Compliance
] as const;

export type DimensionCode = typeof ALL_DIMENSION_CODES[number];

/**
 * Dimension names for display
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
  RMS: 'Risk Management & Sustainability',
  CMP: 'Compliance'
};
