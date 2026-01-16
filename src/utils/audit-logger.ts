/**
 * System Audit Logger
 * Centralized utilities for logging errors, validation results, and performance metrics
 */

import * as fs from 'fs/promises';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import * as path from 'path';
import { PATHS, AUDIT_FILENAMES } from '../config/paths.js';
import { ensureDir } from './ensure-directories.js';

// ============================================
// ERROR LOGGING
// ============================================

export interface ErrorLogPayload {
  timestamp: string;
  phase: string;
  errorType: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  runId?: string;
}

/**
 * Log a system error to the audit directory
 * Use in try/catch blocks throughout the pipeline
 */
export async function logSystemError(
  phase: string,
  error: Error,
  context?: Record<string, unknown>,
  runId?: string
): Promise<string> {
  await ensureDir(PATHS.AUDIT_ERRORS);

  const filename = AUDIT_FILENAMES.error(phase);
  const filepath = path.join(PATHS.AUDIT_ERRORS, filename);

  const payload: ErrorLogPayload = {
    timestamp: new Date().toISOString(),
    phase,
    errorType: error.constructor.name,
    message: error.message,
    stack: error.stack,
    context,
    runId,
  };

  await fs.writeFile(filepath, JSON.stringify(payload, null, 2), 'utf-8');
  console.error(`[AuditLogger] Error logged: ${filepath}`);

  return filepath;
}

// ============================================
// VALIDATION LOGGING
// ============================================

export interface ValidationResult {
  timestamp: string;
  checkType: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: Record<string, unknown>;
  runId?: string;
}

/**
 * Log a validation check result
 */
export async function logValidationResult(
  checkType: string,
  status: 'PASS' | 'FAIL' | 'WARNING',
  details: Record<string, unknown>,
  runId?: string
): Promise<string> {
  await ensureDir(PATHS.AUDIT_VALIDATION);

  const filename = AUDIT_FILENAMES.validation(checkType, runId);
  const filepath = path.join(PATHS.AUDIT_VALIDATION, filename);

  const payload: ValidationResult = {
    timestamp: new Date().toISOString(),
    checkType,
    status,
    details,
    runId,
  };

  await fs.writeFile(filepath, JSON.stringify(payload, null, 2), 'utf-8');

  const icon = status === 'PASS' ? '[OK]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
  console.log(`[AuditLogger] ${icon} Validation logged: ${filepath}`);

  return filepath;
}

// ============================================
// PERFORMANCE LOGGING
// ============================================

export interface PerformanceMetrics {
  timestamp: string;
  runId: string;
  companyName: string;
  totalDurationMs: number;
  phases: {
    phase: number;
    durationMs: number;
    apiCalls?: number;
    tokensUsed?: number;
    estimatedCost?: number;
  }[];
  summary: {
    totalApiCalls: number;
    totalTokens: number;
    estimatedTotalCost: number;
  };
}

/**
 * Log performance metrics for a pipeline run
 */
export async function logPerformanceMetrics(
  metrics: PerformanceMetrics
): Promise<string> {
  await ensureDir(PATHS.AUDIT_PERFORMANCE);

  const filename = AUDIT_FILENAMES.performance(metrics.runId);
  const filepath = path.join(PATHS.AUDIT_PERFORMANCE, filename);

  await fs.writeFile(filepath, JSON.stringify(metrics, null, 2), 'utf-8');
  console.log(`[AuditLogger] Performance logged: ${filepath}`);

  return filepath;
}

// ============================================
// GENERIC AUDIT FILE WRITER
// ============================================

/**
 * Write a generic audit file to the quality directory
 * Use for custom audit types not covered by specific functions
 */
export async function writeQualityAudit(
  category: string,
  data: unknown,
  runId?: string
): Promise<string> {
  await ensureDir(PATHS.AUDIT_QUALITY);

  const filename = AUDIT_FILENAMES.quality(category, runId);
  const filepath = path.join(PATHS.AUDIT_QUALITY, filename);

  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[AuditLogger] Quality audit logged: ${filepath}`);

  return filepath;
}

// ============================================
// PIPELINE ERROR LOGGING (Synchronous)
// ============================================

export interface PipelineErrorPayload {
  runId: string;
  phase: number | string;
  errorType: string;
  errorMessage: string;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Log a critical pipeline error to the audit infrastructure (synchronous version)
 * Use this in catch blocks where async operations may not be safe
 */
export function logPipelineError(error: PipelineErrorPayload): string {
  const { existsSync, mkdirSync, writeFileSync, appendFileSync } = require('fs');

  // Ensure directories exist (synchronous)
  [PATHS.SYSTEM_AUDIT, PATHS.AUDIT_ERRORS].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  const timestamp = new Date().toISOString();
  const errorRecord = {
    timestamp,
    ...error,
    severity: 'CRITICAL',
    pipeline: 'bizhealth-report-pipeline',
  };

  // Write to errors directory with unique filename
  const errorFilename = `error_${error.runId}_phase${error.phase}_${Date.now()}.json`;
  const errorPath = path.join(PATHS.AUDIT_ERRORS, errorFilename);
  writeFileSync(errorPath, JSON.stringify(errorRecord, null, 2));

  // Also append to daily error log for easy scanning
  const dailyLogFilename = `errors_${timestamp.split('T')[0]}.jsonl`;
  const dailyLogPath = path.join(PATHS.AUDIT_ERRORS, dailyLogFilename);
  appendFileSync(dailyLogPath, JSON.stringify(errorRecord) + '\n');

  console.error(`[AuditLogger] Critical error logged: ${errorPath}`);
  return errorPath;
}

// ============================================
// QUALITY GATE FAILURE LOGGING (Synchronous)
// ============================================

export interface QualityGateFailurePayload {
  runId: string;
  phase: number | string;
  gateName: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  validationErrors?: string[];
  recommendation?: string;
}

/**
 * Log a quality gate failure to the audit infrastructure (synchronous version)
 * Use when validation checks fail but pipeline may continue with warnings
 */
export function logQualityGateFailure(failure: QualityGateFailurePayload): string {
  const { existsSync, mkdirSync, writeFileSync, appendFileSync } = require('fs');

  // Ensure directories exist (synchronous)
  [PATHS.SYSTEM_AUDIT, PATHS.AUDIT_QUALITY].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  const timestamp = new Date().toISOString();
  const qualityRecord = {
    timestamp,
    ...failure,
    severity: 'QUALITY_GATE_FAILURE',
    pipeline: 'bizhealth-report-pipeline',
  };

  // Write to quality directory
  const qualityFilename = `qc_${failure.runId}_phase${failure.phase}_${Date.now()}.json`;
  const qualityPath = path.join(PATHS.AUDIT_QUALITY, qualityFilename);
  writeFileSync(qualityPath, JSON.stringify(qualityRecord, null, 2));

  // Also append to daily quality log
  const dailyLogFilename = `quality_${timestamp.split('T')[0]}.jsonl`;
  const dailyLogPath = path.join(PATHS.AUDIT_QUALITY, dailyLogFilename);
  appendFileSync(dailyLogPath, JSON.stringify(qualityRecord) + '\n');

  console.warn(`[AuditLogger] Quality gate failure logged: ${qualityPath}`);
  return qualityPath;
}

// ============================================
// PHASE COMPLETION LOGGING (Synchronous)
// ============================================

export interface PhaseCompletionPayload {
  runId: string;
  phase: number | string;
  duration_ms: number;
  outputPath?: string;
  metrics?: Record<string, unknown>;
}

/**
 * Log successful phase completion for audit trail (synchronous version)
 * Use at the end of each phase to track successful pipeline progression
 */
export function logPhaseCompletion(completion: PhaseCompletionPayload): void {
  // Ensure directory exists (synchronous)
  if (!existsSync(PATHS.SYSTEM_AUDIT)) {
    mkdirSync(PATHS.SYSTEM_AUDIT, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const completionRecord = {
    timestamp,
    ...completion,
    status: 'SUCCESS',
    pipeline: 'bizhealth-report-pipeline',
  };

  // Append to daily completion log
  const dailyLogFilename = `completions_${timestamp.split('T')[0]}.jsonl`;
  const dailyLogPath = path.join(PATHS.SYSTEM_AUDIT, dailyLogFilename);
  appendFileSync(dailyLogPath, JSON.stringify(completionRecord) + '\n');

  console.log(`[AuditLogger] Phase ${completion.phase} completion logged`);
}
