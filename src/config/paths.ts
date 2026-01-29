/**
 * BizHealth Pipeline Output Path Configuration
 *
 * Directory Structure:
 * output/
 * ├── reports/           ← Client deliverables
 * ├── data/              ← Pipeline state (phase outputs)
 * └── system-audit/      ← Internal diagnostics (QA, errors, validation)
 */

import * as path from 'path';

/** Root output directory */
export const OUTPUT_ROOT = 'output';

/**
 * Centralized path constants for all pipeline outputs
 * Use these throughout the codebase for consistent file placement
 */
export const PATHS = {
  // ============================================
  // CLIENT DELIVERABLES
  // ============================================
  /** Final reports for client delivery */
  REPORTS: path.join(OUTPUT_ROOT, 'reports'),

  // ============================================
  // PIPELINE DATA STATE
  // ============================================
  /** Intermediate pipeline data */
  DATA: path.join(OUTPUT_ROOT, 'data'),
  DATA_PHASE0: path.join(OUTPUT_ROOT, 'data', 'phase0'),
  DATA_PHASE1: path.join(OUTPUT_ROOT, 'data', 'phase1'),
  DATA_PHASE2: path.join(OUTPUT_ROOT, 'data', 'phase2'),
  DATA_PHASE3: path.join(OUTPUT_ROOT, 'data', 'phase3'),
  DATA_PHASE4: path.join(OUTPUT_ROOT, 'data', 'phase4'),
  DATA_PHASE5: path.join(OUTPUT_ROOT, 'data', 'phase5'),

  // ============================================
  // SYSTEM AUDIT (Internal QA/QC)
  // ============================================
  /** Root for all internal diagnostic outputs */
  SYSTEM_AUDIT: path.join(OUTPUT_ROOT, 'system-audit'),

  /** Data quality audits (IDM consolidation, completeness checks) */
  AUDIT_QUALITY: path.join(OUTPUT_ROOT, 'system-audit', 'quality'),

  /** Error logs from pipeline execution */
  AUDIT_ERRORS: path.join(OUTPUT_ROOT, 'system-audit', 'errors'),

  /** Validation results (schema, data integrity, cross-contamination) */
  AUDIT_VALIDATION: path.join(OUTPUT_ROOT, 'system-audit', 'validation'),

  /** Performance metrics (timing, API costs, token usage) */
  AUDIT_PERFORMANCE: path.join(OUTPUT_ROOT, 'system-audit', 'performance'),
} as const;

/**
 * File naming convention helpers
 * Format: [TYPE]_[CATEGORY]_[TIMESTAMP].json
 *
 * Using timestamp format: YYYY-MM-DD_HH-MM-SS for sortability
 */
export const AUDIT_FILENAMES = {
  /** Generate quality audit filename */
  quality: (category: string, runId?: string): string => {
    const timestamp = formatTimestamp();
    const suffix = runId ? `_${runId}` : '';
    return `AUDIT_${category.toUpperCase()}_${timestamp}${suffix}.json`;
  },

  /** Generate error log filename */
  error: (phase: string): string => {
    const timestamp = formatTimestamp();
    return `ERROR_${phase.toUpperCase()}_${timestamp}.json`;
  },

  /** Generate validation result filename */
  validation: (checkType: string, runId?: string): string => {
    const timestamp = formatTimestamp();
    const suffix = runId ? `_${runId}` : '';
    return `VALIDATION_${checkType.toUpperCase()}_${timestamp}${suffix}.json`;
  },

  /** Generate performance metrics filename */
  performance: (runId: string): string => {
    const timestamp = formatTimestamp();
    return `PERF_${timestamp}_${runId}.json`;
  },
};

/**
 * Format current timestamp for filenames
 * Output: YYYY-MM-DD_HH-MM-SS (filesystem-safe, sortable)
 */
function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
}

/**
 * Generate company-specific report path
 */
export function getCompanyReportPath(companyName: string): string {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return path.join(PATHS.REPORTS, slug);
}

/**
 * Generate phase-specific data path
 */
export function getPhaseDataPath(phase: number): string {
  const key = `DATA_PHASE${phase}` as keyof typeof PATHS;
  return PATHS[key] || path.join(PATHS.DATA, `phase${phase}`);
}
