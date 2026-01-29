/**
 * Raw Assessment Storage Service
 *
 * Handles immutable storage of raw assessment data with write-once semantics.
 * Implements the storage requirements from Phase 0A:
 * - Write-once semantics (no overwrite operations)
 * - Structured storage: raw/{company_profile_id}/{assessment_run_id}.json
 * - Logging of write operations
 * - Integrity verification via SHA-256 hashing
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';
import {
  computePayloadHash,
  computeContentHash,
  generateCompanyProfileId,
  sanitizeForPath,
  generateAuditTimestamp,
} from '../utils/security.js';
import type {
  RawAssessment,
  RawAssessmentMeta,
  RawAssessmentPath,
  RawAssessmentWriteResult,
  WriteOperationLog,
  IntegrityLogEntry,
  CreateRawAssessmentOptions,
} from '../types/raw-input.types.js';
import {
  validateRawAssessment,
  RawAssessmentSchema,
} from '../validation/raw-input.schemas.js';
import type { WebhookPayload } from '../types/webhook.types.js';

const logger = createLogger('raw-assessment-storage');

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default configuration for raw assessment storage
 */
export interface RawStorageConfig {
  /** Base directory for raw data storage */
  baseDir: string;

  /** Directory for write operation logs */
  logsDir: string;

  /** Directory for integrity logs */
  integrityLogsDir: string;

  /** Actor identifier for write operations */
  actor: string;

  /** Current questionnaire version */
  questionnaireVersion: string;

  /** Current company profile version */
  cpVersion: string;
}

const DEFAULT_CONFIG: RawStorageConfig = {
  baseDir: './data/raw',
  logsDir: './data/logs/writes',
  integrityLogsDir: './data/logs/integrity',
  actor: 'phase0-storage-service',
  questionnaireVersion: 'v2025-09-16',
  cpVersion: 'v2025-09-16',
};

// ============================================================================
// Storage Service Class
// ============================================================================

/**
 * Raw Assessment Storage Service
 *
 * Provides methods for storing and retrieving raw assessment data
 * with write-once semantics and full audit trail.
 */
export class RawAssessmentStorageService {
  private config: RawStorageConfig;

  constructor(config: Partial<RawStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureDirectories();
  }

  /**
   * Ensure all required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      this.config.baseDir,
      this.config.logsDir,
      this.config.integrityLogsDir,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info({ directory: dir }, 'Created storage directory');
      }
    }
  }

  /**
   * Generate storage path for a raw assessment
   */
  private getAssessmentPath(
    companyProfileId: string,
    assessmentRunId: string
  ): RawAssessmentPath {
    const safeCpId = sanitizeForPath(companyProfileId);
    const companyDir = path.join(this.config.baseDir, safeCpId);
    const fileName = `${assessmentRunId}.json`;
    const fullPath = path.join(companyDir, fileName);

    return {
      base_dir: this.config.baseDir,
      company_dir: companyDir,
      file_name: fileName,
      full_path: fullPath,
    };
  }

  /**
   * Check if an assessment already exists (for write-once enforcement)
   */
  public assessmentExists(
    companyProfileId: string,
    assessmentRunId: string
  ): boolean {
    const assessmentPath = this.getAssessmentPath(companyProfileId, assessmentRunId);
    return fs.existsSync(assessmentPath.full_path);
  }

  /**
   * Create and store a raw assessment from a webhook payload
   *
   * This is the main entry point for capturing raw data.
   * Implements write-once semantics - will fail if assessment already exists.
   */
  public async captureRawAssessment(
    webhookPayload: WebhookPayload,
    options: CreateRawAssessmentOptions = {}
  ): Promise<RawAssessmentWriteResult> {
    const timestamp = generateAuditTimestamp();

    // Generate or use provided IDs
    const assessmentRunId = options.assessment_run_id || uuidv4();
    const companyProfileId =
      options.company_profile_id ||
      generateCompanyProfileId(webhookPayload.business_overview.company_name);

    logger.info(
      {
        assessment_run_id: assessmentRunId,
        company_profile_id: companyProfileId,
        company_name: webhookPayload.business_overview.company_name,
      },
      'Capturing raw assessment'
    );

    // Check for existing assessment (write-once enforcement)
    if (this.assessmentExists(companyProfileId, assessmentRunId)) {
      const error = `Assessment already exists: ${assessmentRunId}`;
      logger.error({ assessment_run_id: assessmentRunId }, error);
      throw new Error(error);
    }

    // Separate company profile and questionnaire data
    const {
      business_overview,
      ...questionnaireData
    } = webhookPayload;

    // Compute payload hash for integrity
    const payloadHash = computePayloadHash(webhookPayload);

    // Build raw assessment object
    const rawAssessment: RawAssessment = {
      id: assessmentRunId,
      company_profile_id: companyProfileId,
      raw_company_profile: business_overview,
      raw_questionnaire: questionnaireData,
      meta: {
        received_at: timestamp,
        questionnaire_version:
          options.questionnaire_version || this.config.questionnaireVersion,
        cp_version: options.cp_version || this.config.cpVersion,
        source: options.source || 'web',
        payload_hash: payloadHash,
        original_submission_id: webhookPayload.submission_id,
        client_identifier: options.client_identifier,
      },
    };

    // Validate the raw assessment structure
    try {
      validateRawAssessment(rawAssessment);
    } catch (validationError) {
      logger.error(
        { error: validationError, assessment_run_id: assessmentRunId },
        'Raw assessment validation failed'
      );
      throw validationError;
    }

    // Write the assessment
    return this.writeRawAssessment(rawAssessment);
  }

  /**
   * Write a raw assessment to storage
   *
   * Implements write-once semantics with full audit logging.
   */
  private async writeRawAssessment(
    assessment: RawAssessment
  ): Promise<RawAssessmentWriteResult> {
    const assessmentPath = this.getAssessmentPath(
      assessment.company_profile_id,
      assessment.id
    );

    // Ensure company directory exists
    if (!fs.existsSync(assessmentPath.company_dir)) {
      fs.mkdirSync(assessmentPath.company_dir, { recursive: true });
      logger.info(
        { directory: assessmentPath.company_dir },
        'Created company directory'
      );
    }

    // Serialize the assessment
    const content = JSON.stringify(assessment, null, 2);
    const contentHash = computeContentHash(content);
    const sizeBytes = Buffer.byteLength(content, 'utf8');

    // Write-once check (double-check before write)
    if (fs.existsSync(assessmentPath.full_path)) {
      throw new Error(
        `Write-once violation: File already exists at ${assessmentPath.full_path}`
      );
    }

    try {
      // Write the file atomically (write to temp, then rename)
      const tempPath = `${assessmentPath.full_path}.tmp`;
      fs.writeFileSync(tempPath, content, 'utf8');
      fs.renameSync(tempPath, assessmentPath.full_path);

      logger.info(
        {
          assessment_run_id: assessment.id,
          company_profile_id: assessment.company_profile_id,
          path: assessmentPath.full_path,
          size_bytes: sizeBytes,
        },
        'Raw assessment written successfully'
      );

      // Create log entries
      const logEntry = this.createWriteLog(
        assessment,
        assessmentPath,
        contentHash,
        sizeBytes
      );
      const integrityEntry = this.createIntegrityLog(assessment);

      // Persist log entries
      await this.persistWriteLog(logEntry);
      await this.persistIntegrityLog(integrityEntry);

      return {
        success: true,
        assessment,
        path: assessmentPath,
        log_entry: logEntry,
        integrity_entry: integrityEntry,
      };
    } catch (error) {
      // Clean up temp file if it exists
      const tempPath = `${assessmentPath.full_path}.tmp`;
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      logger.error(
        {
          assessment_run_id: assessment.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to write raw assessment'
      );

      throw error;
    }
  }

  /**
   * Create a write operation log entry
   */
  private createWriteLog(
    assessment: RawAssessment,
    assessmentPath: RawAssessmentPath,
    contentHash: string,
    sizeBytes: number
  ): WriteOperationLog {
    return {
      timestamp: generateAuditTimestamp(),
      operation: 'create',
      file_path: assessmentPath.full_path,
      assessment_run_id: assessment.id,
      company_profile_id: assessment.company_profile_id,
      content_hash: contentHash,
      actor: this.config.actor,
      size_bytes: sizeBytes,
    };
  }

  /**
   * Create an integrity log entry
   */
  private createIntegrityLog(assessment: RawAssessment): IntegrityLogEntry {
    return {
      assessment_run_id: assessment.id,
      company_profile_id: assessment.company_profile_id,
      payload_hash: assessment.meta.payload_hash,
      computed_at: generateAuditTimestamp(),
      algorithm: 'sha256',
      verified: true,
      last_verified_at: generateAuditTimestamp(),
    };
  }

  /**
   * Persist write log entry
   */
  private async persistWriteLog(logEntry: WriteOperationLog): Promise<void> {
    const logFileName = `${logEntry.timestamp.replace(/[:.]/g, '-')}_${logEntry.assessment_run_id}.json`;
    const logPath = path.join(this.config.logsDir, logFileName);

    fs.writeFileSync(logPath, JSON.stringify(logEntry, null, 2), 'utf8');

    logger.debug(
      { log_path: logPath, assessment_run_id: logEntry.assessment_run_id },
      'Write log persisted'
    );
  }

  /**
   * Persist integrity log entry
   */
  private async persistIntegrityLog(entry: IntegrityLogEntry): Promise<void> {
    const logFileName = `${entry.computed_at.replace(/[:.]/g, '-')}_${entry.assessment_run_id}.json`;
    const logPath = path.join(this.config.integrityLogsDir, logFileName);

    fs.writeFileSync(logPath, JSON.stringify(entry, null, 2), 'utf8');

    logger.debug(
      { log_path: logPath, assessment_run_id: entry.assessment_run_id },
      'Integrity log persisted'
    );
  }

  /**
   * Read a raw assessment from storage
   */
  public readRawAssessment(
    companyProfileId: string,
    assessmentRunId: string
  ): RawAssessment | null {
    const assessmentPath = this.getAssessmentPath(companyProfileId, assessmentRunId);

    if (!fs.existsSync(assessmentPath.full_path)) {
      logger.warn(
        {
          company_profile_id: companyProfileId,
          assessment_run_id: assessmentRunId,
        },
        'Raw assessment not found'
      );
      return null;
    }

    const content = fs.readFileSync(assessmentPath.full_path, 'utf8');
    const assessment = JSON.parse(content) as RawAssessment;

    logger.debug(
      {
        company_profile_id: companyProfileId,
        assessment_run_id: assessmentRunId,
      },
      'Raw assessment read'
    );

    return assessment;
  }

  /**
   * Verify integrity of a stored raw assessment
   */
  public verifyAssessmentIntegrity(
    companyProfileId: string,
    assessmentRunId: string
  ): { valid: boolean; expectedHash: string; actualHash: string; details: Record<string, unknown> } {
    const assessment = this.readRawAssessment(companyProfileId, assessmentRunId);

    if (!assessment) {
      throw new Error(`Assessment not found: ${assessmentRunId}`);
    }

    // Reconstruct the original payload for hash verification
    // The original webhook structure has properties in this order:
    // event, timestamp, submission_id, created_at, business_overview, ...rest
    const questionnaire = assessment.raw_questionnaire as Record<string, unknown>;
    const reconstructedPayload: Record<string, unknown> = {};

    // Preserve original property order: event, timestamp, submission_id, created_at come first
    const orderedKeys = ['event', 'timestamp', 'submission_id', 'created_at'];
    for (const key of orderedKeys) {
      if (key in questionnaire) {
        reconstructedPayload[key] = questionnaire[key];
      }
    }

    // Then business_overview
    reconstructedPayload.business_overview = assessment.raw_company_profile;

    // Then remaining properties from questionnaire
    for (const key of Object.keys(questionnaire)) {
      if (!orderedKeys.includes(key)) {
        reconstructedPayload[key] = questionnaire[key];
      }
    }

    const actualHash = computePayloadHash(reconstructedPayload);
    const expectedHash = assessment.meta.payload_hash;

    const valid = actualHash === expectedHash;

    if (!valid) {
      logger.error(
        {
          assessment_run_id: assessmentRunId,
          expected_hash: expectedHash,
          actual_hash: actualHash,
        },
        'Integrity verification failed'
      );
    }

    return { valid, expectedHash, actualHash, details: { reconstructed: true } };
  }

  /**
   * List all assessments for a company
   */
  public listCompanyAssessments(companyProfileId: string): string[] {
    const assessmentPath = this.getAssessmentPath(companyProfileId, 'dummy');
    const companyDir = assessmentPath.company_dir;

    if (!fs.existsSync(companyDir)) {
      return [];
    }

    return fs
      .readdirSync(companyDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Get the latest assessment for a company
   */
  public getLatestAssessment(companyProfileId: string): RawAssessment | null {
    const assessmentIds = this.listCompanyAssessments(companyProfileId);

    if (assessmentIds.length === 0) {
      return null;
    }

    // Load all assessments and sort by received_at
    const assessments = assessmentIds
      .map(id => this.readRawAssessment(companyProfileId, id))
      .filter((a): a is RawAssessment => a !== null)
      .sort((a, b) =>
        new Date(b.meta.received_at).getTime() -
        new Date(a.meta.received_at).getTime()
      );

    return assessments[0] || null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageServiceInstance: RawAssessmentStorageService | null = null;

/**
 * Get the singleton storage service instance
 */
export function getRawAssessmentStorage(
  config?: Partial<RawStorageConfig>
): RawAssessmentStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new RawAssessmentStorageService(config);
  }
  return storageServiceInstance;
}

/**
 * Create a new storage service instance (for testing or custom config)
 */
export function createRawAssessmentStorage(
  config: Partial<RawStorageConfig> = {}
): RawAssessmentStorageService {
  return new RawAssessmentStorageService(config);
}

export default RawAssessmentStorageService;
