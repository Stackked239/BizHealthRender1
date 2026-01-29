/**
 * Assessment Index Service
 *
 * Maintains the index structure linking raw and normalized data
 * for each assessment run. Provides:
 * - Index creation and updates
 * - Query by assessment_run_id or company_profile_id
 * - Status tracking across phases
 * - Version history management
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger.js';
import { generateAuditTimestamp, sanitizeForPath } from '../utils/security.js';
import type {
  AssessmentIndex,
  AssessmentIndexEntry,
  NormalizedCompanyProfile,
  NormalizedQuestionnaireResponses,
  NormalizedBenchmarkData,
  PHASE0_VERSIONS,
} from '../types/normalized.types.js';

const logger = createLogger('assessment-index');

// Index version
const INDEX_VERSION = 'v1.0.0';

// ============================================================================
// Configuration
// ============================================================================

export interface AssessmentIndexConfig {
  /** Base directory for all data storage */
  baseDir: string;

  /** Directory for index files */
  indexDir: string;

  /** Directory for normalized data */
  normalizedDir: string;

  /** File name for the main index */
  indexFileName: string;
}

const DEFAULT_CONFIG: AssessmentIndexConfig = {
  baseDir: './data',
  indexDir: './data/index',
  normalizedDir: './data/normalized',
  indexFileName: 'assessment-index.json',
};

// ============================================================================
// Assessment Index Service
// ============================================================================

export class AssessmentIndexService {
  private config: AssessmentIndexConfig;
  private index: AssessmentIndex | null = null;

  constructor(config: Partial<AssessmentIndexConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureDirectories();
  }

  /**
   * Ensure all required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      this.config.baseDir,
      this.config.indexDir,
      this.config.normalizedDir,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info({ directory: dir }, 'Created index directory');
      }
    }
  }

  /**
   * Get path to the main index file
   */
  private getIndexPath(): string {
    return path.join(this.config.indexDir, this.config.indexFileName);
  }

  /**
   * Load the index from disk
   */
  private loadIndex(): AssessmentIndex {
    if (this.index) {
      return this.index;
    }

    const indexPath = this.getIndexPath();

    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      this.index = JSON.parse(content) as AssessmentIndex;
      logger.debug({ entries_count: Object.keys(this.index.entries).length }, 'Index loaded');
    } else {
      this.index = {
        version: INDEX_VERSION,
        last_updated: generateAuditTimestamp(),
        entries: {},
      };
      logger.info('Created new empty index');
    }

    return this.index;
  }

  /**
   * Save the index to disk
   */
  private saveIndex(): void {
    if (!this.index) {
      return;
    }

    this.index.last_updated = generateAuditTimestamp();

    const indexPath = this.getIndexPath();
    const content = JSON.stringify(this.index, null, 2);

    // Atomic write
    const tempPath = `${indexPath}.tmp`;
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, indexPath);

    logger.debug({ path: indexPath }, 'Index saved');
  }

  /**
   * Create a new index entry for an assessment
   */
  public createEntry(params: {
    assessmentRunId: string;
    companyProfileId: string;
    cpSnapshotId: string;
    questionnaireVersion: string;
    cpVersion: string;
    cpTransformationVersion: string;
    qrTransformationVersion: string;
    rawAssessmentPath: string;
  }): AssessmentIndexEntry {
    const index = this.loadIndex();
    const timestamp = generateAuditTimestamp();

    const entry: AssessmentIndexEntry = {
      assessment_run_id: params.assessmentRunId,
      company_profile_id: params.companyProfileId,
      cp_snapshot_id: params.cpSnapshotId,
      created_at: timestamp,
      questionnaire_version: params.questionnaireVersion,
      cp_version: params.cpVersion,
      cp_transformation_version: params.cpTransformationVersion,
      qr_transformation_version: params.qrTransformationVersion,
      paths: {
        raw_assessment: params.rawAssessmentPath,
        normalized_company_profile: '',
        normalized_questionnaire_responses: '',
      },
      status: 'raw_captured',
    };

    index.entries[params.assessmentRunId] = entry;
    this.saveIndex();

    logger.info(
      {
        assessment_run_id: params.assessmentRunId,
        company_profile_id: params.companyProfileId,
      },
      'Index entry created'
    );

    return entry;
  }

  /**
   * Update an existing index entry
   */
  public updateEntry(
    assessmentRunId: string,
    updates: Partial<AssessmentIndexEntry>
  ): AssessmentIndexEntry | null {
    const index = this.loadIndex();

    const entry = index.entries[assessmentRunId];
    if (!entry) {
      logger.warn({ assessment_run_id: assessmentRunId }, 'Entry not found for update');
      return null;
    }

    // Merge updates
    Object.assign(entry, updates);

    this.saveIndex();

    logger.debug(
      { assessment_run_id: assessmentRunId, updates: Object.keys(updates) },
      'Index entry updated'
    );

    return entry;
  }

  /**
   * Update the status of an entry
   */
  public updateStatus(
    assessmentRunId: string,
    status: AssessmentIndexEntry['status'],
    error?: { phase: string; message: string }
  ): AssessmentIndexEntry | null {
    const updates: Partial<AssessmentIndexEntry> = { status };

    if (error) {
      updates.error = {
        ...error,
        timestamp: generateAuditTimestamp(),
      };
    }

    return this.updateEntry(assessmentRunId, updates);
  }

  /**
   * Set the normalized company profile path
   */
  public setNormalizedCPPath(
    assessmentRunId: string,
    filePath: string
  ): AssessmentIndexEntry | null {
    const index = this.loadIndex();
    const entry = index.entries[assessmentRunId];

    if (!entry) {
      return null;
    }

    entry.paths.normalized_company_profile = filePath;
    this.saveIndex();

    return entry;
  }

  /**
   * Set the normalized questionnaire responses path
   */
  public setNormalizedQRPath(
    assessmentRunId: string,
    filePath: string
  ): AssessmentIndexEntry | null {
    const index = this.loadIndex();
    const entry = index.entries[assessmentRunId];

    if (!entry) {
      return null;
    }

    entry.paths.normalized_questionnaire_responses = filePath;
    this.saveIndex();

    return entry;
  }

  /**
   * Set the benchmark data path
   */
  public setBenchmarkPath(
    assessmentRunId: string,
    filePath: string
  ): AssessmentIndexEntry | null {
    const index = this.loadIndex();
    const entry = index.entries[assessmentRunId];

    if (!entry) {
      return null;
    }

    entry.paths.benchmark_data = filePath;
    this.saveIndex();

    return entry;
  }

  /**
   * Mark phase completion
   */
  public markPhaseComplete(
    assessmentRunId: string,
    phase: 'phase1' | 'phase1_5' | 'phase2' | 'phase3' | 'phase4' | 'phase5'
  ): AssessmentIndexEntry | null {
    const index = this.loadIndex();
    const entry = index.entries[assessmentRunId];

    if (!entry) {
      return null;
    }

    if (!entry.phase_metadata) {
      entry.phase_metadata = {};
    }

    const timestamp = generateAuditTimestamp();
    switch (phase) {
      case 'phase1':
        entry.phase_metadata.phase1_completed_at = timestamp;
        break;
      case 'phase1_5':
        entry.phase_metadata.phase1_5_completed_at = timestamp;
        break;
      case 'phase2':
        entry.phase_metadata.phase2_completed_at = timestamp;
        break;
      case 'phase3':
        entry.phase_metadata.phase3_completed_at = timestamp;
        break;
      case 'phase4':
        entry.phase_metadata.phase4_completed_at = timestamp;
        break;
      case 'phase5':
        entry.phase_metadata.phase5_completed_at = timestamp;
        break;
    }

    this.saveIndex();

    logger.info(
      { assessment_run_id: assessmentRunId, phase },
      'Phase marked complete'
    );

    return entry;
  }

  // ============================================================================
  // Run ID Isolation Support
  // ============================================================================

  /**
   * Set the run ID for directory isolation
   */
  public setRunId(assessmentRunId: string, runId: string): AssessmentIndexEntry | null {
    const index = this.loadIndex();
    const entry = index.entries[assessmentRunId];

    if (!entry) {
      logger.warn({ assessment_run_id: assessmentRunId }, 'Entry not found for setRunId');
      return null;
    }

    entry.run_id = runId;
    this.saveIndex();

    logger.info(
      { assessment_run_id: assessmentRunId, run_id: runId },
      'Run ID set for isolation'
    );

    return entry;
  }

  /**
   * Get an entry by run ID (for directory isolation)
   */
  public getByRunId(runId: string): AssessmentIndexEntry | null {
    const index = this.loadIndex();

    for (const entry of Object.values(index.entries)) {
      if (entry.run_id === runId) {
        return entry;
      }
    }

    return null;
  }

  /**
   * Update run-isolated output paths
   */
  public updateOutputPaths(
    runId: string,
    paths: Partial<NonNullable<AssessmentIndexEntry['output_paths']>>
  ): AssessmentIndexEntry | null {
    const entry = this.getByRunId(runId);

    if (!entry) {
      logger.warn({ run_id: runId }, 'Entry not found for updateOutputPaths');
      return null;
    }

    if (!entry.output_paths) {
      entry.output_paths = {};
    }

    entry.output_paths = { ...entry.output_paths, ...paths };
    this.saveIndex();

    logger.info(
      { run_id: runId, paths: Object.keys(paths) },
      'Output paths updated'
    );

    return entry;
  }

  /**
   * Mark run as completed
   */
  public markCompleted(runId: string): AssessmentIndexEntry | null {
    const entry = this.getByRunId(runId);

    if (!entry) {
      logger.warn({ run_id: runId }, 'Entry not found for markCompleted');
      return null;
    }

    entry.status = 'completed';
    entry.completed_at = generateAuditTimestamp();
    this.saveIndex();

    logger.info(
      { run_id: runId, assessment_run_id: entry.assessment_run_id },
      'Run marked as completed'
    );

    return entry;
  }

  /**
   * Mark run as failed
   */
  public markFailed(
    runId: string,
    phase: string,
    message: string
  ): AssessmentIndexEntry | null {
    const entry = this.getByRunId(runId);

    if (!entry) {
      logger.warn({ run_id: runId }, 'Entry not found for markFailed');
      return null;
    }

    entry.status = 'failed';
    entry.error = {
      phase,
      message,
      timestamp: generateAuditTimestamp(),
    };
    this.saveIndex();

    logger.error(
      { run_id: runId, phase, message },
      'Run marked as failed'
    );

    return entry;
  }

  /**
   * Set company name for quick lookups
   */
  public setCompanyName(assessmentRunId: string, companyName: string): AssessmentIndexEntry | null {
    const index = this.loadIndex();
    const entry = index.entries[assessmentRunId];

    if (!entry) {
      return null;
    }

    entry.company_name = companyName;
    this.saveIndex();

    return entry;
  }

  /**
   * Get an entry by assessment run ID
   */
  public getEntry(assessmentRunId: string): AssessmentIndexEntry | null {
    const index = this.loadIndex();
    return index.entries[assessmentRunId] || null;
  }

  /**
   * Get all entries for a company
   */
  public getEntriesForCompany(companyProfileId: string): AssessmentIndexEntry[] {
    const index = this.loadIndex();

    return Object.values(index.entries)
      .filter(entry => entry.company_profile_id === companyProfileId)
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  /**
   * Get the latest entry for a company
   */
  public getLatestEntryForCompany(companyProfileId: string): AssessmentIndexEntry | null {
    const entries = this.getEntriesForCompany(companyProfileId);
    return entries[0] || null;
  }

  /**
   * Get all entries with a specific status
   */
  public getEntriesByStatus(
    status: AssessmentIndexEntry['status']
  ): AssessmentIndexEntry[] {
    const index = this.loadIndex();

    return Object.values(index.entries)
      .filter(entry => entry.status === status)
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  /**
   * Get all entries ready for analysis
   */
  public getReadyForAnalysis(): AssessmentIndexEntry[] {
    return this.getEntriesByStatus('ready_for_analysis');
  }

  /**
   * Check if an entry exists
   */
  public hasEntry(assessmentRunId: string): boolean {
    const index = this.loadIndex();
    return assessmentRunId in index.entries;
  }

  /**
   * Get index statistics
   */
  public getStats(): {
    totalEntries: number;
    byStatus: Record<AssessmentIndexEntry['status'], number>;
    byCompany: Record<string, number>;
  } {
    const index = this.loadIndex();
    const entries = Object.values(index.entries);

    const byStatus: Record<string, number> = {
      raw_captured: 0,
      normalized: 0,
      ready_for_analysis: 0,
      analysis_complete: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      error: 0,
    };

    const byCompany: Record<string, number> = {};

    for (const entry of entries) {
      byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
      byCompany[entry.company_profile_id] =
        (byCompany[entry.company_profile_id] || 0) + 1;
    }

    return {
      totalEntries: entries.length,
      byStatus: byStatus as Record<AssessmentIndexEntry['status'], number>,
      byCompany,
    };
  }

  /**
   * Export index for backup
   */
  public exportIndex(): AssessmentIndex {
    return this.loadIndex();
  }

  /**
   * Clear the index cache (force reload from disk)
   */
  public clearCache(): void {
    this.index = null;
  }
}

// ============================================================================
// Normalized Data Storage
// ============================================================================

export class NormalizedDataStorage {
  private config: AssessmentIndexConfig;

  constructor(config: Partial<AssessmentIndexConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.config.normalizedDir)) {
      fs.mkdirSync(this.config.normalizedDir, { recursive: true });
    }
  }

  /**
   * Get the path for normalized company profile
   */
  private getCPPath(companyProfileId: string, snapshotId: string): string {
    const safeCpId = sanitizeForPath(companyProfileId);
    const dir = path.join(this.config.normalizedDir, safeCpId);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return path.join(dir, `cp-${snapshotId}.json`);
  }

  /**
   * Get the path for normalized questionnaire responses
   */
  private getQRPath(companyProfileId: string, assessmentRunId: string): string {
    const safeCpId = sanitizeForPath(companyProfileId);
    const dir = path.join(this.config.normalizedDir, safeCpId);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return path.join(dir, `qr-${assessmentRunId}.json`);
  }

  /**
   * Get the path for benchmark data
   */
  private getBenchmarkPath(companyProfileId: string, assessmentRunId: string): string {
    const safeCpId = sanitizeForPath(companyProfileId);
    const dir = path.join(this.config.normalizedDir, safeCpId);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return path.join(dir, `benchmark-${assessmentRunId}.json`);
  }

  /**
   * Store normalized company profile
   */
  public storeCompanyProfile(profile: NormalizedCompanyProfile): string {
    const filePath = this.getCPPath(
      profile.metadata.profile_id,
      profile.metadata.snapshot_id
    );

    const content = JSON.stringify(profile, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');

    logger.debug(
      {
        profile_id: profile.metadata.profile_id,
        snapshot_id: profile.metadata.snapshot_id,
        path: filePath,
      },
      'Stored normalized company profile'
    );

    return filePath;
  }

  /**
   * Store normalized questionnaire responses
   */
  public storeQuestionnaireResponses(responses: NormalizedQuestionnaireResponses): string {
    const filePath = this.getQRPath(
      responses.meta.company_profile_id,
      responses.meta.assessment_run_id
    );

    const content = JSON.stringify(responses, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');

    logger.debug(
      {
        assessment_run_id: responses.meta.assessment_run_id,
        company_profile_id: responses.meta.company_profile_id,
        path: filePath,
      },
      'Stored normalized questionnaire responses'
    );

    return filePath;
  }

  /**
   * Store benchmark data
   */
  public storeBenchmarkData(
    benchmarkData: NormalizedBenchmarkData,
    companyProfileId: string,
    assessmentRunId: string
  ): string {
    const filePath = this.getBenchmarkPath(companyProfileId, assessmentRunId);

    const content = JSON.stringify(benchmarkData, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');

    logger.debug(
      {
        assessment_run_id: assessmentRunId,
        company_profile_id: companyProfileId,
        path: filePath,
      },
      'Stored benchmark data'
    );

    return filePath;
  }

  /**
   * Load normalized company profile
   */
  public loadCompanyProfile(
    companyProfileId: string,
    snapshotId: string
  ): NormalizedCompanyProfile | null {
    const filePath = this.getCPPath(companyProfileId, snapshotId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as NormalizedCompanyProfile;
  }

  /**
   * Load normalized questionnaire responses
   */
  public loadQuestionnaireResponses(
    companyProfileId: string,
    assessmentRunId: string
  ): NormalizedQuestionnaireResponses | null {
    const filePath = this.getQRPath(companyProfileId, assessmentRunId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as NormalizedQuestionnaireResponses;
  }

  /**
   * Load benchmark data
   */
  public loadBenchmarkData(
    companyProfileId: string,
    assessmentRunId: string
  ): NormalizedBenchmarkData | null {
    const filePath = this.getBenchmarkPath(companyProfileId, assessmentRunId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as NormalizedBenchmarkData;
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

let indexServiceInstance: AssessmentIndexService | null = null;
let dataStorageInstance: NormalizedDataStorage | null = null;

export function getAssessmentIndexService(
  config?: Partial<AssessmentIndexConfig>
): AssessmentIndexService {
  if (!indexServiceInstance) {
    indexServiceInstance = new AssessmentIndexService(config);
  }
  return indexServiceInstance;
}

export function getNormalizedDataStorage(
  config?: Partial<AssessmentIndexConfig>
): NormalizedDataStorage {
  if (!dataStorageInstance) {
    dataStorageInstance = new NormalizedDataStorage(config);
  }
  return dataStorageInstance;
}
