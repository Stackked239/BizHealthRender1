/**
 * BizHealth Content Validator
 *
 * Comprehensive report content validation with detailed logging.
 * Validates parsed HTML for quality compliance and tracks metrics.
 *
 * Features:
 * - Parse result aggregation
 * - Visual element counting
 * - Word count estimation
 * - Error and warning tracking
 * - Console logging with status icons
 *
 * @module content-validator
 * @since 2025-12-06
 */

import type { ValidationResult } from './markdown-parser.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Comprehensive content validation summary
 */
export interface ContentValidationSummary {
  /** Report display name */
  reportName: string;
  /** Report type identifier */
  reportType: string;
  /** Whether validation passed */
  isValid: boolean;
  /** Total errors across all sections */
  totalErrors: number;
  /** Total warnings across all sections */
  totalWarnings: number;
  /** Individual parse validation results */
  parseResults: ValidationResult[];
  /** Count of visual elements (SVG, charts, grids) */
  visualCount: number;
  /** Estimated word count */
  wordCount: number;
  /** Detailed element counts */
  elementCounts: {
    svgCharts: number;
    tables: number;
    scorecardGrids: number;
    findingsGrids: number;
    riskMatrices: number;
    boldElements: number;
    dividers: number;
    lists: number;
    codeBlocks: number;
  };
  /** Validation timestamp */
  timestamp: string;
}

/**
 * Quality thresholds for validation
 */
export interface QualityThresholds {
  /** Minimum SVG visualizations for comprehensive reports */
  minVisualizations: number;
  /** Maximum bold elements per report */
  maxBoldElements: number;
  /** Maximum section dividers per report */
  maxDividers: number;
  /** Maximum generation time in milliseconds */
  maxGenerationTimeMs: number;
}

/**
 * Default quality thresholds
 */
export const DEFAULT_THRESHOLDS: QualityThresholds = {
  minVisualizations: 50,
  maxBoldElements: 200,
  maxDividers: 30,
  maxGenerationTimeMs: 300
};

// ============================================================================
// ELEMENT COUNTING
// ============================================================================

/**
 * Count visual and structural elements in HTML
 */
function countElements(html: string): ContentValidationSummary['elementCounts'] {
  return {
    svgCharts: (html.match(/<svg[^>]*>/gi) || []).length,
    tables: (html.match(/<table[^>]*>/gi) || []).length,
    scorecardGrids: (html.match(/scorecard-grid/gi) || []).length,
    findingsGrids: (html.match(/findings-grid/gi) || []).length,
    riskMatrices: (html.match(/risk-matrix/gi) || []).length,
    boldElements: (html.match(/<strong[^>]*>/gi) || []).length +
                  (html.match(/<b[^>]*>/gi) || []).length +
                  (html.match(/bh-emphasis/gi) || []).length,
    dividers: (html.match(/<hr[^>]*>/gi) || []).length +
              (html.match(/bh-section-divider/gi) || []).length,
    lists: (html.match(/<[ou]l[^>]*>/gi) || []).length,
    codeBlocks: (html.match(/<pre[^>]*>/gi) || []).length
  };
}

/**
 * Calculate total visual element count
 */
function calculateVisualCount(counts: ContentValidationSummary['elementCounts']): number {
  return counts.svgCharts +
         counts.tables +
         counts.scorecardGrids +
         counts.findingsGrids +
         counts.riskMatrices;
}

/**
 * Estimate word count from HTML
 */
function estimateWordCount(html: string): number {
  const textContent = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return textContent.split(' ').filter(w => w.length > 0).length;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate HTML structure integrity
 */
function validateHtmlStructure(html: string): string[] {
  const errors: string[] = [];

  // Check for required structure
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    errors.push('Invalid HTML structure: missing html declaration');
  }

  // ═══════════════════════════════════════════════════════════
  // Data Mapping Bug Detection (Enhanced for Phase 5)
  // ═══════════════════════════════════════════════════════════

  // Check for undefined text in HTML tags (template binding accessing missing property)
  const undefinedInTagsMatches = html.match(/>undefined</g);
  if (undefinedInTagsMatches && undefinedInTagsMatches.length > 0) {
    errors.push(`DATA BUG: ${undefinedInTagsMatches.length} instances of ">undefined<" - template binding accessing missing property`);
  }

  // Check for standalone undefined (not in HTML context - might be valid text)
  const standaloneUndefined = html.match(/(?<![a-zA-Z])undefined(?![a-zA-Z])/g) || [];
  const undefinedInTags = undefinedInTagsMatches?.length || 0;
  if (standaloneUndefined.length > undefinedInTags) {
    // Only warn if there are more undefined instances than the tag-wrapped ones
    const extraCount = standaloneUndefined.length - undefinedInTags;
    if (extraCount > 0) {
      errors.push(`DATA BUG: ${extraCount} additional standalone "undefined" values detected`);
    }
  }

  // Check for null text in HTML tags
  const nullMatches = html.match(/>null</g);
  if (nullMatches && nullMatches.length > 0) {
    errors.push(`DATA WARNING: ${nullMatches.length} instances of ">null<" - possible missing data`);
  }

  // Check for [object Object] (serialization bug)
  if (html.includes('[object Object]')) {
    const count = (html.match(/\[object Object\]/g) || []).length;
    errors.push(`DATA BUG: ${count} instances of "[object Object]" - object not properly serialized`);
  }

  // Check for NaN in numeric contexts
  const nanMatches = html.match(/>NaN</g);
  if (nanMatches && nanMatches.length > 0) {
    errors.push(`DATA WARNING: ${nanMatches.length} instances of "NaN" - numeric calculation error`);
  }

  // Check for empty strong tags (common symptom of missing title)
  const emptyStrongMatches = html.match(/<strong[^>]*>\s*<\/strong>/g);
  if (emptyStrongMatches && emptyStrongMatches.length > 0) {
    errors.push(`DATA BUG: ${emptyStrongMatches.length} empty <strong> tags - missing title data`);
  }

  return errors;
}

/**
 * Generate warnings based on element counts
 */
function generateWarnings(
  counts: ContentValidationSummary['elementCounts'],
  thresholds: QualityThresholds = DEFAULT_THRESHOLDS
): string[] {
  const warnings: string[] = [];

  if (counts.boldElements > thresholds.maxBoldElements) {
    warnings.push(`High bold count: ${counts.boldElements} (target: <${thresholds.maxBoldElements})`);
  }

  if (counts.dividers > thresholds.maxDividers) {
    warnings.push(`High divider count: ${counts.dividers} (target: <${thresholds.maxDividers})`);
  }

  return warnings;
}

// ============================================================================
// MAIN VALIDATOR
// ============================================================================

/**
 * Validate complete report content before output
 *
 * @param html - The generated HTML content
 * @param reportName - Display name of the report
 * @param reportType - Type identifier for the report
 * @param parseResults - Array of validation results from markdown parsing
 * @param thresholds - Optional quality thresholds to use
 * @returns Comprehensive validation summary
 */
export function validateReportContent(
  html: string,
  reportName: string,
  reportType: string,
  parseResults: ValidationResult[] = [],
  thresholds: QualityThresholds = DEFAULT_THRESHOLDS
): ContentValidationSummary {
  // Validate structure
  const structureErrors = validateHtmlStructure(html);

  // Count elements
  const elementCounts = countElements(html);
  const visualCount = calculateVisualCount(elementCounts);
  const wordCount = estimateWordCount(html);

  // Generate warnings
  const structureWarnings = generateWarnings(elementCounts, thresholds);

  // Aggregate parse results
  const totalParseErrors = parseResults.reduce((sum, r) => sum + r.artifacts.length, 0);
  const totalParseWarnings = parseResults.reduce((sum, r) => sum + r.warnings.length, 0);

  // Calculate totals
  const totalErrors = structureErrors.length + totalParseErrors;
  const totalWarnings = structureWarnings.length + totalParseWarnings;

  // Add structure issues to parse results for unified reporting
  if (structureErrors.length > 0 || structureWarnings.length > 0) {
    parseResults.push({
      isValid: structureErrors.length === 0,
      artifacts: structureErrors,
      warnings: structureWarnings
    });
  }

  return {
    reportName,
    reportType,
    isValid: totalErrors === 0,
    totalErrors,
    totalWarnings,
    parseResults,
    visualCount,
    wordCount,
    elementCounts,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log validation results to console with formatting
 *
 * @param summary - The validation summary to log
 * @param verbose - Whether to include detailed element counts
 */
export function logValidationResults(summary: ContentValidationSummary, verbose = false): void {
  const status = summary.isValid ? '\u2705 PASS' : '\u274C FAIL';
  const statusColor = summary.isValid ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`\n${statusColor}${status}${reset} - ${summary.reportName} (${summary.reportType})`);
  console.log(`  Words: ${summary.wordCount.toLocaleString()} | Visuals: ${summary.visualCount}`);

  if (verbose) {
    console.log(`  SVGs: ${summary.elementCounts.svgCharts} | Tables: ${summary.elementCounts.tables} | Grids: ${summary.elementCounts.scorecardGrids + summary.elementCounts.findingsGrids}`);
    console.log(`  Bold: ${summary.elementCounts.boldElements} | Dividers: ${summary.elementCounts.dividers} | Lists: ${summary.elementCounts.lists}`);
  }

  if (summary.totalErrors > 0) {
    console.log(`  \x1b[31mErrors: ${summary.totalErrors}\x1b[0m`);
    summary.parseResults.forEach(r => {
      r.artifacts.forEach(e => console.log(`    - ${e}`));
    });
  }

  if (summary.totalWarnings > 0) {
    console.log(`  \x1b[33mWarnings: ${summary.totalWarnings}\x1b[0m`);
    summary.parseResults.forEach(r => {
      r.warnings.forEach(w => console.log(`    - ${w}`));
    });
  }
}

/**
 * Generate validation summary for all reports
 *
 * @param summaries - Array of validation summaries
 * @returns Aggregate summary string
 */
export function generateValidationReport(summaries: ContentValidationSummary[]): string {
  const passed = summaries.filter(s => s.isValid).length;
  const failed = summaries.filter(s => !s.isValid).length;
  const totalWords = summaries.reduce((sum, s) => sum + s.wordCount, 0);
  const totalVisuals = summaries.reduce((sum, s) => sum + s.visualCount, 0);

  const lines: string[] = [
    '',
    '═'.repeat(60),
    'PHASE 5 REPORT VALIDATION SUMMARY',
    '═'.repeat(60),
    `  Total Reports: ${summaries.length}`,
    `  Passed: ${passed}`,
    `  Failed: ${failed}`,
    `  Total Words: ${totalWords.toLocaleString()}`,
    `  Total Visuals: ${totalVisuals}`,
    '─'.repeat(60)
  ];

  if (failed > 0) {
    lines.push('Failed Reports:');
    summaries
      .filter(s => !s.isValid)
      .forEach(s => {
        lines.push(`  - ${s.reportName}: ${s.totalErrors} errors`);
      });
    lines.push('─'.repeat(60));
  }

  // Per-report summary
  lines.push('Report Details:');
  summaries.forEach(s => {
    const status = s.isValid ? '+' : '!';
    lines.push(`  ${status} ${s.reportName}: ${s.wordCount} words, ${s.visualCount} visuals`);
  });

  lines.push('═'.repeat(60));
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// QUALITY CHECKS
// ============================================================================

/**
 * Check if report meets quality thresholds
 *
 * @param summary - Validation summary to check
 * @param thresholds - Quality thresholds to apply
 * @returns Object with pass/fail status for each threshold
 */
export function checkQualityThresholds(
  summary: ContentValidationSummary,
  thresholds: QualityThresholds = DEFAULT_THRESHOLDS
): {
  visualizations: { passed: boolean; actual: number; target: number };
  boldElements: { passed: boolean; actual: number; target: number };
  dividers: { passed: boolean; actual: number; target: number };
  overall: boolean;
} {
  const visualizations = {
    passed: summary.visualCount >= thresholds.minVisualizations,
    actual: summary.visualCount,
    target: thresholds.minVisualizations
  };

  const boldElements = {
    passed: summary.elementCounts.boldElements <= thresholds.maxBoldElements,
    actual: summary.elementCounts.boldElements,
    target: thresholds.maxBoldElements
  };

  const dividers = {
    passed: summary.elementCounts.dividers <= thresholds.maxDividers,
    actual: summary.elementCounts.dividers,
    target: thresholds.maxDividers
  };

  return {
    visualizations,
    boldElements,
    dividers,
    overall: visualizations.passed && boldElements.passed && dividers.passed
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateReportContent,
  logValidationResults,
  generateValidationReport,
  checkQualityThresholds,
  DEFAULT_THRESHOLDS
};
