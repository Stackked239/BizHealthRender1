/**
 * DataQualityTracker - Encapsulates quality tracking for IDM consolidation
 *
 * This class provides comprehensive data quality tracking for the BizHealth
 * pipeline's Phase 4 (IDM Consolidation). It ensures graceful degradation is
 * accompanied by full visibility, severity-based issue tracking, and persistent
 * audit records.
 *
 * Usage:
 *   const tracker = new DataQualityTracker(companyName, config);
 *   tracker.initializeDimension('STR', 'Strategy', 7, 5);
 *   tracker.recordQuestionsFound('STR', 7);
 *   tracker.recordSubIndicators('STR', 5);
 *   // ... or on issues:
 *   tracker.logIssue('WARNING', 'DIMENSION', 'RMS', 'Only 5/8 questions found');
 *   const audit = tracker.finalize();
 *   await tracker.saveAndReport(audit);
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  PipelineQualityAudit,
  ValidationIssue,
  DimensionStatus,
  IssueSeverity,
  IssueComponent,
  AuditStatus,
  QualityTrackerConfig,
  DEFAULT_CRITICAL_DIMENSIONS,
  ALL_DIMENSION_CODES
} from '../types/quality.js';
import { PATHS, AUDIT_FILENAMES } from '../config/paths.js';
import { ensureDir } from '../utils/ensure-directories.js';

/**
 * DataQualityTracker class for tracking data quality during IDM consolidation
 */
export class DataQualityTracker {
  private runId: string;
  private companyName: string;
  private config: Required<QualityTrackerConfig>;
  private dimensionStatus: Map<string, DimensionStatus>;
  private issues: ValidationIssue[];
  private startTime: Date;

  /**
   * Create a new DataQualityTracker instance
   * @param companyName - Name of the company being assessed
   * @param config - Configuration options for the tracker
   */
  constructor(companyName: string, config: QualityTrackerConfig = {}) {
    this.startTime = new Date();
    this.runId = this.generateRunId();
    this.companyName = companyName;
    this.config = {
      strictMode: config.strictMode ?? false,
      criticalDimensions: config.criticalDimensions ?? DEFAULT_CRITICAL_DIMENSIONS,
      outputDir: config.outputDir ?? PATHS.AUDIT_QUALITY
    };
    this.dimensionStatus = new Map();
    this.issues = [];

    console.log(`[DataQualityTracker] Initialized for ${companyName} | Run ID: ${this.runId}`);
  }

  /**
   * Generate unique run ID in format BH-YYYYMMDD-HHMMSS
   */
  private generateRunId(): string {
    const now = this.startTime;
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `BH-${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Initialize tracking for a dimension
   * @param dimensionCode - The dimension code (e.g., 'STR', 'SAL')
   * @param dimensionName - Human-readable dimension name
   * @param expectedQuestions - Number of questions expected for this dimension
   * @param expectedSubIndicators - Number of sub-indicators expected for this dimension
   */
  initializeDimension(
    dimensionCode: string,
    dimensionName: string,
    expectedQuestions: number,
    expectedSubIndicators: number
  ): void {
    this.dimensionStatus.set(dimensionCode, {
      dimensionCode,
      dimensionName,
      status: 'complete',  // Assume complete until issues found
      questionsExpected: expectedQuestions,
      questionsFound: 0,
      subIndicatorsExpected: expectedSubIndicators,
      subIndicatorsGenerated: 0,
      issues: []
    });
  }

  /**
   * Record questions found for a dimension
   * @param dimensionCode - The dimension code
   * @param count - Number of questions found
   */
  recordQuestionsFound(dimensionCode: string, count: number): void {
    const status = this.dimensionStatus.get(dimensionCode);
    if (status) {
      status.questionsFound = count;
      if (count < status.questionsExpected) {
        status.status = 'partial';
        this.logIssue(
          'WARNING',
          'DIMENSION',
          dimensionCode,
          `Only ${count}/${status.questionsExpected} questions found`,
          `Missing ${status.questionsExpected - count} questions for ${status.dimensionName}`
        );
      }
    }
  }

  /**
   * Record sub-indicators generated for a dimension
   * @param dimensionCode - The dimension code
   * @param count - Number of sub-indicators generated
   */
  recordSubIndicators(dimensionCode: string, count: number): void {
    const status = this.dimensionStatus.get(dimensionCode);
    if (status) {
      status.subIndicatorsGenerated = count;
      if (count < status.subIndicatorsExpected && count > 0) {
        status.status = 'partial';
      } else if (count === 0) {
        status.status = 'skipped';
      }
    }
  }

  /**
   * Mark a dimension as skipped entirely
   * @param dimensionCode - The dimension code
   * @param reason - Reason for skipping the dimension
   */
  markDimensionSkipped(dimensionCode: string, reason: string): void {
    const status = this.dimensionStatus.get(dimensionCode);
    if (status) {
      status.status = 'skipped';
    }

    // Determine severity based on criticality
    const severity: IssueSeverity = this.config.criticalDimensions.includes(dimensionCode)
      ? 'CRITICAL'
      : 'WARNING';

    this.logIssue(severity, 'DIMENSION', dimensionCode, reason);
  }

  /**
   * Log a validation issue
   * @param severity - Issue severity (CRITICAL, WARNING, INFO)
   * @param component - Component type (CHAPTER, DIMENSION, INDICATOR, QUESTION)
   * @param code - Component code or identifier
   * @param message - Issue description
   * @param details - Additional context for debugging (optional)
   */
  logIssue(
    severity: IssueSeverity,
    component: IssueComponent,
    code: string,
    message: string,
    details?: string
  ): void {
    const issue: ValidationIssue = {
      severity,
      component,
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.issues.push(issue);

    // Also add to dimension-specific issues if applicable
    const dimensionStatus = this.dimensionStatus.get(code);
    if (dimensionStatus) {
      dimensionStatus.issues.push(issue);
    }

    // Console output with severity-appropriate formatting
    const prefix = severity === 'CRITICAL' ? '[X]' : severity === 'WARNING' ? '[!]' : '[i]';
    console.warn(`[DataQualityTracker] ${prefix} ${severity} [${code}]: ${message}`);

    // In strict mode, throw on critical issues
    if (this.config.strictMode && severity === 'CRITICAL') {
      throw new Error(`CRITICAL data quality issue: [${code}] ${message}`);
    }
  }

  /**
   * Calculate final audit status based on issues found
   */
  private calculateStatus(): AuditStatus {
    const criticalCount = this.issues.filter(i => i.severity === 'CRITICAL').length;
    const warningCount = this.issues.filter(i => i.severity === 'WARNING').length;

    if (criticalCount > 0) return 'FAIL';
    if (warningCount > 0) return 'NEEDS_REVIEW';
    return 'PASS';
  }

  /**
   * Generate recommendations based on issues found
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const status = this.calculateStatus();

    if (status === 'FAIL') {
      recommendations.push('DO NOT deliver report until critical issues are resolved');
      recommendations.push('Review source questionnaire data for missing dimensions');
    }

    if (status === 'NEEDS_REVIEW') {
      recommendations.push('Manual review required before report delivery');
      recommendations.push('Verify partial dimensions have sufficient data for meaningful analysis');
    }

    // Specific recommendations based on issue patterns
    const skippedDimensions = Array.from(this.dimensionStatus.values())
      .filter(d => d.status === 'skipped')
      .map(d => d.dimensionCode);

    if (skippedDimensions.length > 0) {
      recommendations.push(`Re-run Phase 0-3 to regenerate data for: ${skippedDimensions.join(', ')}`);
    }

    // Check for partial dimensions
    const partialDimensions = Array.from(this.dimensionStatus.values())
      .filter(d => d.status === 'partial')
      .map(d => d.dimensionCode);

    if (partialDimensions.length > 0) {
      recommendations.push(`Review questionnaire responses for incomplete dimensions: ${partialDimensions.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Finalize tracking and generate complete audit report
   * @returns Complete pipeline quality audit record
   */
  finalize(): PipelineQualityAudit {
    const dimensionStatusObj: Record<string, DimensionStatus> = {};
    this.dimensionStatus.forEach((status, code) => {
      dimensionStatusObj[code] = status;
    });

    const criticalCount = this.issues.filter(i => i.severity === 'CRITICAL').length;
    const warningCount = this.issues.filter(i => i.severity === 'WARNING').length;
    const infoCount = this.issues.filter(i => i.severity === 'INFO').length;

    const audit: PipelineQualityAudit = {
      runId: this.runId,
      companyName: this.companyName,
      timestamp: this.startTime.toISOString(),

      totalQuestionsExpected: Array.from(this.dimensionStatus.values())
        .reduce((sum, d) => sum + d.questionsExpected, 0),
      totalQuestionsProcessed: Array.from(this.dimensionStatus.values())
        .reduce((sum, d) => sum + d.questionsFound, 0),
      totalDimensionsExpected: ALL_DIMENSION_CODES.length,
      totalDimensionsProcessed: Array.from(this.dimensionStatus.values())
        .filter(d => d.status !== 'skipped').length,
      totalDimensionsSkipped: Array.from(this.dimensionStatus.values())
        .filter(d => d.status === 'skipped').length,
      totalSubIndicatorsExpected: Array.from(this.dimensionStatus.values())
        .reduce((sum, d) => sum + d.subIndicatorsExpected, 0),
      totalSubIndicatorsGenerated: Array.from(this.dimensionStatus.values())
        .reduce((sum, d) => sum + d.subIndicatorsGenerated, 0),

      dimensionStatus: dimensionStatusObj,
      issues: this.issues,

      status: this.calculateStatus(),
      criticalIssueCount: criticalCount,
      warningCount: warningCount,
      infoCount: infoCount,

      recommendations: this.generateRecommendations()
    };

    return audit;
  }

  /**
   * Save audit report to file and print console summary
   * @param audit - The completed audit record
   * @returns Path to the saved audit file
   */
  async saveAndReport(audit: PipelineQualityAudit): Promise<string> {
    // Ensure output directory exists using centralized utility
    await ensureDir(this.config.outputDir);

    // Generate filename using centralized naming convention
    const filename = AUDIT_FILENAMES.quality('IDM', this.runId);
    const filepath = path.join(this.config.outputDir, filename);

    // Write audit file
    await fs.writeFile(filepath, JSON.stringify(audit, null, 2), 'utf-8');

    // Print console summary
    this.printConsoleSummary(audit, filepath);

    return filepath;
  }

  /**
   * Print formatted console summary
   */
  private printConsoleSummary(audit: PipelineQualityAudit, filepath: string): void {
    const width = 68;
    const line = '='.repeat(width);
    const thinLine = '-'.repeat(width);

    console.log('');
    console.log(`+${line}+`);
    console.log(`|${'IDM DATA INTEGRITY AUDIT'.padStart(46).padEnd(width)}|`);
    console.log(`|${'Run ID: ' + audit.runId.padStart(38).padEnd(width)}|`);
    console.log(`+${line}+`);

    // Status line
    const statusIcon = audit.status === 'PASS' ? '[OK]' : audit.status === 'FAIL' ? '[FAIL]' : '[REVIEW]';
    const statusText = audit.status === 'PASS'
      ? 'DATA INTEGRITY CHECK PASSED'
      : audit.status === 'FAIL'
        ? 'DATA INTEGRITY FAILURE'
        : 'NEEDS MANUAL REVIEW';
    console.log(`|  ${statusIcon} ${statusText.padEnd(width - 9)}|`);
    console.log(`+${thinLine}+`);

    // Metrics
    const dimText = `Dimensions:     ${audit.totalDimensionsProcessed}/${audit.totalDimensionsExpected} complete`;
    const subText = `Sub-indicators: ${audit.totalSubIndicatorsGenerated}/${audit.totalSubIndicatorsExpected} generated`;
    const qText = `Questions:      ${audit.totalQuestionsProcessed}/${audit.totalQuestionsExpected} processed`;
    const issueText = `Issues:         ${audit.criticalIssueCount} critical, ${audit.warningCount} warnings`;

    console.log(`|  ${dimText.padEnd(width - 3)}|`);
    console.log(`|  ${subText.padEnd(width - 3)}|`);
    console.log(`|  ${qText.padEnd(width - 3)}|`);
    console.log(`|  ${issueText.padEnd(width - 3)}|`);

    // Critical issues detail
    if (audit.criticalIssueCount > 0) {
      console.log(`+${thinLine}+`);
      console.log(`|  ${'CRITICAL ISSUES:'.padEnd(width - 3)}|`);
      audit.issues
        .filter(i => i.severity === 'CRITICAL')
        .forEach(issue => {
          const issueStr = `* [${issue.code}] ${issue.message}`.slice(0, width - 5);
          console.log(`|  ${issueStr.padEnd(width - 3)}|`);
        });
    }

    // Warnings detail
    if (audit.warningCount > 0) {
      console.log(`+${thinLine}+`);
      console.log(`|  ${'WARNINGS:'.padEnd(width - 3)}|`);
      audit.issues
        .filter(i => i.severity === 'WARNING')
        .slice(0, 5)  // Limit to 5 warnings in console
        .forEach(issue => {
          const issueStr = `* [${issue.code}] ${issue.message}`.slice(0, width - 5);
          console.log(`|  ${issueStr.padEnd(width - 3)}|`);
        });
      if (audit.warningCount > 5) {
        console.log(`|  ${'... and ' + (audit.warningCount - 5) + ' more warnings (see audit file)'.padEnd(width - 3)}|`);
      }
    }

    // File location and recommendations
    console.log(`+${thinLine}+`);
    const fileText = `Audit saved: ${filepath}`.slice(0, width - 3);
    console.log(`|  ${fileText.padEnd(width - 3)}|`);

    if (audit.status !== 'PASS' && audit.recommendations.length > 0) {
      console.log(`|  ${'[!] ' + audit.recommendations[0].slice(0, width - 8).padEnd(width - 6)}|`);
    }

    console.log(`+${line}+`);
    console.log('');
  }

  /**
   * Get current run ID
   */
  getRunId(): string {
    return this.runId;
  }

  /**
   * Get audit status without finalizing
   */
  getCurrentStatus(): AuditStatus {
    return this.calculateStatus();
  }

  /**
   * Check if a dimension has been initialized
   */
  isDimensionInitialized(dimensionCode: string): boolean {
    return this.dimensionStatus.has(dimensionCode);
  }

  /**
   * Get current issue count by severity
   */
  getIssueCounts(): { critical: number; warning: number; info: number } {
    return {
      critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
      warning: this.issues.filter(i => i.severity === 'WARNING').length,
      info: this.issues.filter(i => i.severity === 'INFO').length
    };
  }
}

/**
 * Create a DataQualityTracker instance with default configuration
 */
export function createDataQualityTracker(
  companyName: string,
  config?: QualityTrackerConfig
): DataQualityTracker {
  return new DataQualityTracker(companyName, config);
}
