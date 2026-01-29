/**
 * Database Persistence Layer
 * Production-ready PostgreSQL client with connection pooling, error handling, and audit logging
 */

import { config } from 'dotenv';
config(); // Load environment variables

import { Pool, PoolClient, QueryResult } from 'pg';
import { CompanyProfile } from '../types/company-profile.types.js';
import { QuestionnaireResponses } from '../types/questionnaire.types.js';
import { WebhookPayload } from '../types/webhook.types.js';

// ================================================================
// Type Definitions
// ================================================================

export type SubmissionStatus =
  | 'pending'
  | 'processing'
  | 'phase1_complete'
  | 'phase2_complete'
  | 'phase3_complete'
  | 'completed'
  | 'failed';

export type BatchJobStatus =
  | 'pending'
  | 'submitted'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type Phase = 'phase_1_tier_1' | 'phase_1_tier_2' | 'phase_2' | 'phase_3';
export type Tier = 'tier_1' | 'tier_2' | null;

export interface Submission {
  submission_id: string;
  webhook_data: WebhookPayload;
  company_profile: CompanyProfile | null;
  questionnaire_responses: QuestionnaireResponses | null;
  created_at: Date;
  updated_at: Date;
  status: SubmissionStatus;
  error_message: string | null;
}

export interface BatchJob {
  job_id: string;
  submission_id: string;
  batch_number: number;
  call_number: number;
  analysis_type: string;
  phase: Phase;
  tier: Tier;
  status: BatchJobStatus;
  submitted_at: Date | null;
  completed_at: Date | null;
  input_payload: Record<string, unknown>;
  output_result: Record<string, unknown> | null;
  error_message: string | null;
  token_usage: TokenUsage | null;
  processing_time_ms: number | null;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  thinking_tokens?: number;
  total_tokens: number;
}

export interface AnalysisOutput {
  output_id: string;
  submission_id: string;
  job_id: string;
  phase: Phase;
  tier: Tier;
  analysis_name: string;
  output_json: Record<string, unknown>;
  created_at: Date;
}

export interface AuditEvent {
  log_id: string;
  submission_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: Date;
}

// ================================================================
// Database Configuration
// ================================================================

interface DatabaseConfig {
  connectionString: string;
  ssl: boolean;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

function getDatabaseConfig(): DatabaseConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true',
    max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10000', 10),
  };
}

// ================================================================
// Database Client Class
// ================================================================

class DatabaseClient {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    const config = getDatabaseConfig();
    this.pool = new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  /**
   * Initialize database connection and verify connectivity
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close database connection pool
   */
  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Execute query with error handling
   */
  private async query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(text, params);
    } catch (error) {
      console.error('Database query error:', {
        query: text,
        params,
        error: error instanceof Error ? error.message : error,
      });
      throw new DatabaseError(
        `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ================================================================
  // Submission Operations
  // ================================================================

  /**
   * Create new questionnaire submission
   * @returns submission_id
   */
  async createSubmission(
    webhookData: WebhookPayload,
    companyProfile: CompanyProfile | null = null,
    questionnaireResponses: QuestionnaireResponses | null = null
  ): Promise<string> {
    const query = `
      INSERT INTO questionnaire_submissions (
        webhook_data,
        company_profile,
        questionnaire_responses,
        status
      ) VALUES ($1, $2, $3, $4)
      RETURNING submission_id
    `;

    const params = [
      JSON.stringify(webhookData),
      companyProfile ? JSON.stringify(companyProfile) : null,
      questionnaireResponses ? JSON.stringify(questionnaireResponses) : null,
      'pending' as SubmissionStatus,
    ];

    try {
      const result = await this.query<{ submission_id: string }>(query, params);
      const submissionId = result.rows[0].submission_id;

      await this.logAuditEvent(submissionId, 'submission_received', {
        webhook_event: webhookData.event,
        timestamp: webhookData.timestamp,
      });

      return submissionId;
    } catch (error) {
      throw new DatabaseError('Failed to create submission', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Update submission status
   */
  async updateSubmissionStatus(
    submissionId: string,
    status: SubmissionStatus,
    errorMessage?: string
  ): Promise<void> {
    const query = `
      UPDATE questionnaire_submissions
      SET status = $1, error_message = $2, updated_at = NOW()
      WHERE submission_id = $3
    `;

    const params = [status, errorMessage || null, submissionId];

    try {
      await this.query(query, params);

      await this.logAuditEvent(submissionId, 'status_updated', {
        new_status: status,
        error_message: errorMessage || null,
      });
    } catch (error) {
      throw new DatabaseError('Failed to update submission status', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(submissionId: string): Promise<Submission> {
    const query = `
      SELECT
        submission_id,
        webhook_data,
        company_profile,
        questionnaire_responses,
        created_at,
        updated_at,
        status,
        error_message
      FROM questionnaire_submissions
      WHERE submission_id = $1
    `;

    try {
      const result = await this.query<Submission>(query, [submissionId]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`Submission not found: ${submissionId}`);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get submission', error instanceof Error ? error : undefined);
    }
  }

  // ================================================================
  // Batch Job Operations
  // ================================================================

  /**
   * Create new batch job
   * @returns job_id
   */
  async createBatchJob(
    submissionId: string,
    batchNumber: number,
    callNumber: number,
    analysisType: string,
    phase: Phase,
    tier: Tier,
    inputPayload: Record<string, unknown>
  ): Promise<string> {
    // Generate job_id in format: batch_{submissionId}_{batchNumber}_{callNumber}
    const jobId = `batch_${submissionId}_${batchNumber}_${callNumber}`;

    const query = `
      INSERT INTO batch_jobs (
        job_id,
        submission_id,
        batch_number,
        call_number,
        analysis_type,
        phase,
        tier,
        status,
        input_payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING job_id
    `;

    const params = [
      jobId,
      submissionId,
      batchNumber,
      callNumber,
      analysisType,
      phase,
      tier,
      'pending' as BatchJobStatus,
      JSON.stringify(inputPayload),
    ];

    try {
      const result = await this.query<{ job_id: string }>(query, params);

      await this.logAuditEvent(submissionId, 'batch_job_created', {
        job_id: jobId,
        batch_number: batchNumber,
        call_number: callNumber,
        analysis_type: analysisType,
        phase,
      });

      return result.rows[0].job_id;
    } catch (error) {
      throw new DatabaseError('Failed to create batch job', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Update batch job status
   */
  async updateBatchJobStatus(
    jobId: string,
    status: BatchJobStatus,
    outputResult?: Record<string, unknown>,
    tokenUsage?: TokenUsage,
    processingTimeMs?: number
  ): Promise<void> {
    const now = new Date();
    const isCompleted = status === 'completed';
    const isFailed = status === 'failed';

    const query = `
      UPDATE batch_jobs
      SET
        status = $1,
        output_result = $2,
        token_usage = $3,
        processing_time_ms = $4,
        submitted_at = COALESCE(submitted_at, $5),
        completed_at = $6
      WHERE job_id = $7
    `;

    const params = [
      status,
      outputResult ? JSON.stringify(outputResult) : null,
      tokenUsage ? JSON.stringify(tokenUsage) : null,
      processingTimeMs || null,
      status === 'submitted' ? now : null,
      isCompleted || isFailed ? now : null,
      jobId,
    ];

    try {
      await this.query(query, params);

      // Get submission_id for audit log
      const job = await this.getBatchJobById(jobId);

      await this.logAuditEvent(job.submission_id, 'batch_job_updated', {
        job_id: jobId,
        new_status: status,
        token_usage: tokenUsage || null,
        processing_time_ms: processingTimeMs || null,
      });
    } catch (error) {
      throw new DatabaseError('Failed to update batch job status', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get batch job by ID
   */
  private async getBatchJobById(jobId: string): Promise<BatchJob> {
    const query = `
      SELECT
        job_id,
        submission_id,
        batch_number,
        call_number,
        analysis_type,
        phase,
        tier,
        status,
        submitted_at,
        completed_at,
        input_payload,
        output_result,
        error_message,
        token_usage,
        processing_time_ms
      FROM batch_jobs
      WHERE job_id = $1
    `;

    const result = await this.query<BatchJob>(query, [jobId]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Batch job not found: ${jobId}`);
    }

    return result.rows[0];
  }

  /**
   * Get all batch jobs for a submission
   */
  async getBatchJobsBySubmission(submissionId: string): Promise<BatchJob[]> {
    const query = `
      SELECT
        job_id,
        submission_id,
        batch_number,
        call_number,
        analysis_type,
        phase,
        tier,
        status,
        submitted_at,
        completed_at,
        input_payload,
        output_result,
        error_message,
        token_usage,
        processing_time_ms
      FROM batch_jobs
      WHERE submission_id = $1
      ORDER BY batch_number ASC, call_number ASC
    `;

    try {
      const result = await this.query<BatchJob>(query, [submissionId]);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get batch jobs', error instanceof Error ? error : undefined);
    }
  }

  // ================================================================
  // Analysis Output Operations
  // ================================================================

  /**
   * Save analysis output
   * @returns output_id
   */
  async saveAnalysisOutput(
    submissionId: string,
    jobId: string,
    phase: Phase,
    tier: Tier,
    analysisName: string,
    outputJson: Record<string, unknown>
  ): Promise<string> {
    const query = `
      INSERT INTO analysis_outputs (
        submission_id,
        job_id,
        phase,
        tier,
        analysis_name,
        output_json
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING output_id
    `;

    const params = [
      submissionId,
      jobId,
      phase,
      tier,
      analysisName,
      JSON.stringify(outputJson),
    ];

    try {
      const result = await this.query<{ output_id: string }>(query, params);
      const outputId = result.rows[0].output_id;

      await this.logAuditEvent(submissionId, 'analysis_output_saved', {
        output_id: outputId,
        job_id: jobId,
        phase,
        analysis_name: analysisName,
      });

      return outputId;
    } catch (error) {
      throw new DatabaseError('Failed to save analysis output', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get all analysis outputs for a submission
   */
  async getAnalysisOutputsBySubmission(submissionId: string): Promise<AnalysisOutput[]> {
    const query = `
      SELECT
        output_id,
        submission_id,
        job_id,
        phase,
        tier,
        analysis_name,
        output_json,
        created_at
      FROM analysis_outputs
      WHERE submission_id = $1
      ORDER BY created_at ASC
    `;

    try {
      const result = await this.query<AnalysisOutput>(query, [submissionId]);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get analysis outputs', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get analysis outputs by phase
   */
  async getAnalysisOutputsByPhase(submissionId: string, phase: Phase): Promise<AnalysisOutput[]> {
    const query = `
      SELECT
        output_id,
        submission_id,
        job_id,
        phase,
        tier,
        analysis_name,
        output_json,
        created_at
      FROM analysis_outputs
      WHERE submission_id = $1 AND phase = $2
      ORDER BY created_at ASC
    `;

    try {
      const result = await this.query<AnalysisOutput>(query, [submissionId, phase]);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get analysis outputs by phase', error instanceof Error ? error : undefined);
    }
  }

  // ================================================================
  // Audit Log Operations
  // ================================================================

  /**
   * Log audit event
   */
  async logAuditEvent(
    submissionId: string,
    eventType: string,
    eventData?: Record<string, unknown>
  ): Promise<void> {
    const query = `
      INSERT INTO audit_log (
        submission_id,
        event_type,
        event_data
      ) VALUES ($1, $2, $3)
    `;

    const params = [
      submissionId,
      eventType,
      eventData ? JSON.stringify(eventData) : null,
    ];

    try {
      await this.query(query, params);
    } catch (error) {
      // Log but don't throw - audit failures shouldn't break operations
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get audit events for a submission
   */
  async getAuditEvents(submissionId: string): Promise<AuditEvent[]> {
    const query = `
      SELECT
        log_id,
        submission_id,
        event_type,
        event_data,
        created_at
      FROM audit_log
      WHERE submission_id = $1
      ORDER BY created_at ASC
    `;

    try {
      const result = await this.query<AuditEvent>(query, [submissionId]);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get audit events', error instanceof Error ? error : undefined);
    }
  }

  // ================================================================
  // Health Check
  // ================================================================

  /**
   * Check database health
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      await this.query('SELECT 1 as health_check');
      return { healthy: true, message: 'Database connection healthy' };
    } catch (error) {
      return {
        healthy: false,
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// ================================================================
// Custom Error Classes
// ================================================================

export class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ================================================================
// Singleton Export
// ================================================================

export const db = new DatabaseClient();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await db.disconnect();
  process.exit(0);
});
