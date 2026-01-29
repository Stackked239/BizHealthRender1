/**
 * Anthropic Batch API Integration Module
 *
 * Handles all interactions with the Anthropic Batch API for Claude Opus 4.1
 * including batch job creation, status polling, result retrieval, and cancellation.
 *
 * Features:
 * - Comprehensive error handling with retry logic
 * - Rate limiting with exponential backoff
 * - Automatic polling until completion
 * - Type-safe interfaces
 * - Structured logging with pino
 */

import Anthropic from '@anthropic-ai/sdk';
import pino from 'pino';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Individual batch request for processing
 */
export interface BatchRequest {
  /** Unique identifier for this request within the batch */
  custom_id: string;
  /** Request parameters */
  params: {
    /** Model to use for processing */
    model: string;
    /** Maximum tokens to generate */
    max_tokens: number;
    /** Messages to send to the model */
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
    /** Temperature setting for response generation */
    temperature?: number;
    /** Extended thinking configuration */
    thinking?: {
      type: 'enabled';
      budget_tokens: number;
    };
    /** System prompt (optional) */
    system?: string;
  };
}

/**
 * Batch job metadata returned from API
 */
export interface BatchJob {
  /** Unique batch job identifier */
  id: string;
  /** Job type (always 'message_batch') */
  type: 'message_batch';
  /** Current processing status */
  processing_status: 'in_progress' | 'canceling' | 'ended';
  /** Request counts by status */
  request_counts: {
    processing: number;
    succeeded: number;
    errored: number;
    canceled: number;
    expired: number;
  };
  /** When the batch expires */
  expires_at: string;
  /** When the batch was created */
  created_at: string;
  /** When the batch processing ended (if complete) */
  ended_at: string | null;
  /** URL to retrieve results */
  results_url: string | null;
  /** When cancellation was initiated (if applicable) */
  cancel_initiated_at?: string | null;
  /** When the batch was archived (if applicable) */
  archived_at?: string | null;
}

/**
 * Detailed batch job status information
 */
export interface BatchJobStatus {
  /** Batch job identifier */
  id: string;
  /** Current processing status */
  processing_status: 'in_progress' | 'canceling' | 'ended';
  /** Request counts by status */
  request_counts: {
    processing: number;
    succeeded: number;
    errored: number;
    canceled: number;
    expired: number;
  };
  /** Whether the batch is complete */
  is_complete: boolean;
  /** Percentage of requests completed (0-100) */
  completion_percentage: number;
  /** Estimated time remaining in milliseconds (if available) */
  estimated_time_remaining_ms?: number;
  /** When the batch expires */
  expires_at: string;
  /** When the batch was created */
  created_at: string;
  /** When the batch processing ended (if complete) */
  ended_at: string | null;
}

/**
 * Individual result from a batch request
 */
export interface BatchResult {
  /** Custom ID from the original request */
  custom_id: string;
  /** Result type */
  result: {
    /** Result type indicator */
    type: 'succeeded' | 'errored' | 'canceled' | 'expired';
    /** Response message (if succeeded) */
    message?: {
      id: string;
      type: 'message';
      role: 'assistant';
      content: Array<{
        type: 'text' | 'thinking';
        text: string;
      }>;
      model: string;
      stop_reason: string | null;
      stop_sequence: string | null;
      usage: {
        input_tokens: number;
        output_tokens: number;
      };
    };
    /** Error details (if errored) */
    error?: {
      type: string;
      message: string;
    };
  };
}

/**
 * Configuration options for the Anthropic client
 */
export interface AnthropicClientConfig {
  /** Anthropic API key */
  apiKey: string;
  /** Default model to use */
  model?: string;
  /** Default max tokens */
  maxTokens?: number;
  /** Default thinking budget tokens */
  thinkingBudgetTokens?: number;
  /** Default temperature */
  temperature?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Default poll interval in milliseconds */
  pollIntervalMs?: number;
  /** Maximum wait time in milliseconds */
  maxWaitTimeMs?: number;
  /** Custom logger instance */
  logger?: pino.Logger;
}

/**
 * Error details for batch operation failures
 */
export class BatchAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BatchAPIError';
  }
}

// ============================================================================
// Anthropic Batch API Client
// ============================================================================

/**
 * Client for interacting with the Anthropic Batch API
 */
export class AnthropicBatchClient {
  private client: Anthropic;
  private logger: pino.Logger;
  private config: Required<
    Omit<AnthropicClientConfig, 'apiKey' | 'logger'>
  >;

  /**
   * Creates a new Anthropic Batch API client
   */
  constructor(config: AnthropicClientConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    this.logger = config.logger || pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
    });

    this.config = {
      model: config.model || 'claude-opus-4-20250514',
      maxTokens: config.maxTokens || 64000,
      thinkingBudgetTokens: config.thinkingBudgetTokens || 32000,
      temperature: config.temperature || 0.3,
      maxRetries: config.maxRetries || 3,
      pollIntervalMs: config.pollIntervalMs || 30000,
      maxWaitTimeMs: config.maxWaitTimeMs || 3600000, // 1 hour
    };

    this.logger.info({
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      thinkingBudgetTokens: this.config.thinkingBudgetTokens,
      temperature: this.config.temperature,
    }, 'AnthropicBatchClient initialized');
  }

  // ==========================================================================
  // Core Batch Operations
  // ==========================================================================

  /**
   * Creates a new batch job with the provided requests
   *
   * @param requests - Array of batch requests to process
   * @returns Promise resolving to batch job metadata
   * @throws {BatchAPIError} If batch creation fails
   */
  async createBatchJob(requests: BatchRequest[]): Promise<BatchJob> {
    this.logger.info({
      requestCount: requests.length,
    }, 'Creating batch job');

    if (requests.length === 0) {
      throw new BatchAPIError(
        'Cannot create batch job with empty request array',
        'EMPTY_REQUESTS',
        400
      );
    }

    // Validate all requests have unique custom_ids
    const customIds = requests.map(r => r.custom_id);
    const uniqueIds = new Set(customIds);
    if (customIds.length !== uniqueIds.size) {
      throw new BatchAPIError(
        'All custom_id values must be unique within a batch',
        'DUPLICATE_CUSTOM_IDS',
        400
      );
    }

    return this.executeWithRetry(async () => {
      try {
        const batch = await this.client.beta.messages.batches.create({
          requests: requests.map(req => ({
            custom_id: req.custom_id,
            params: {
              model: req.params.model || this.config.model,
              max_tokens: req.params.max_tokens || this.config.maxTokens,
              messages: req.params.messages,
              temperature: req.params.temperature ?? this.config.temperature,
              thinking: req.params.thinking || {
                type: 'enabled',
                budget_tokens: this.config.thinkingBudgetTokens,
              },
              ...(req.params.system && { system: req.params.system }),
            },
          })),
        });

        this.logger.info({
          batchId: batch.id,
          requestCount: requests.length,
          expiresAt: batch.expires_at,
        }, 'Batch job created successfully');

        return batch as BatchJob;
      } catch (error) {
        this.logger.error({
          error,
          requestCount: requests.length,
        }, 'Failed to create batch job');

        throw this.handleAPIError(error, 'CREATE_BATCH_FAILED');
      }
    }, 'createBatchJob');
  }

  /**
   * Retrieves the current status of a batch job
   *
   * @param batchId - Unique batch job identifier
   * @returns Promise resolving to batch job status
   * @throws {BatchAPIError} If status retrieval fails
   */
  async getBatchJobStatus(batchId: string): Promise<BatchJobStatus> {
    this.logger.debug({ batchId }, 'Retrieving batch job status');

    return this.executeWithRetry(async () => {
      try {
        const batch = await this.client.beta.messages.batches.retrieve(batchId);

        const totalRequests = Object.values(batch.request_counts).reduce(
          (sum: number, count) => sum + count,
          0
        );

        const completedRequests =
          batch.request_counts.succeeded +
          batch.request_counts.errored +
          batch.request_counts.canceled +
          batch.request_counts.expired;

        const isComplete = batch.processing_status === 'ended';
        const completionPercentage = totalRequests > 0
          ? Math.round((completedRequests / totalRequests) * 100)
          : 0;

        const status: BatchJobStatus = {
          id: batch.id,
          processing_status: batch.processing_status,
          request_counts: batch.request_counts,
          is_complete: isComplete,
          completion_percentage: completionPercentage,
          expires_at: batch.expires_at,
          created_at: batch.created_at,
          ended_at: batch.ended_at,
        };

        this.logger.debug({
          batchId,
          status: status.processing_status,
          completionPercentage,
          requestCounts: status.request_counts,
        }, 'Batch job status retrieved');

        return status;
      } catch (error) {
        this.logger.error({
          error,
          batchId,
        }, 'Failed to retrieve batch job status');

        throw this.handleAPIError(error, 'GET_STATUS_FAILED');
      }
    }, 'getBatchJobStatus');
  }

  /**
   * Retrieves all results from a completed batch job
   *
   * @param batchId - Unique batch job identifier
   * @returns Promise resolving to array of batch results
   * @throws {BatchAPIError} If result retrieval fails or batch is incomplete
   */
  async retrieveBatchResults(batchId: string): Promise<BatchResult[]> {
    this.logger.info({ batchId }, 'Retrieving batch results');

    return this.executeWithRetry(async () => {
      try {
        // First check if batch is complete
        const status = await this.getBatchJobStatus(batchId);

        if (!status.is_complete) {
          throw new BatchAPIError(
            `Batch job ${batchId} is not complete yet (${status.completion_percentage}% complete)`,
            'BATCH_INCOMPLETE',
            400,
            { status }
          );
        }

        // Retrieve results using the SDK's results method
        const results: BatchResult[] = [];
        const resultsDecoder = await this.client.beta.messages.batches.results(batchId);

        for await (const result of resultsDecoder) {
          results.push(result as BatchResult);
        }

        this.logger.info({
          batchId,
          resultCount: results.length,
          succeeded: results.filter(r => r.result.type === 'succeeded').length,
          errored: results.filter(r => r.result.type === 'errored').length,
        }, 'Batch results retrieved successfully');

        return results;
      } catch (error) {
        if (error instanceof BatchAPIError) {
          throw error;
        }

        this.logger.error({
          error,
          batchId,
        }, 'Failed to retrieve batch results');

        throw this.handleAPIError(error, 'RETRIEVE_RESULTS_FAILED');
      }
    }, 'retrieveBatchResults');
  }

  /**
   * Cancels a batch job that is in progress
   *
   * @param batchId - Unique batch job identifier
   * @throws {BatchAPIError} If cancellation fails
   */
  async cancelBatchJob(batchId: string): Promise<void> {
    this.logger.warn({ batchId }, 'Canceling batch job');

    return this.executeWithRetry(async () => {
      try {
        await this.client.beta.messages.batches.cancel(batchId);

        this.logger.info({ batchId }, 'Batch job canceled successfully');
      } catch (error) {
        this.logger.error({
          error,
          batchId,
        }, 'Failed to cancel batch job');

        throw this.handleAPIError(error, 'CANCEL_BATCH_FAILED');
      }
    }, 'cancelBatchJob');
  }

  // ==========================================================================
  // Polling & Waiting
  // ==========================================================================

  /**
   * Polls a batch job until it completes, then returns results
   *
   * @param batchId - Unique batch job identifier
   * @param pollInterval - Interval between status checks in milliseconds
   * @returns Promise resolving to array of batch results
   * @throws {BatchAPIError} If polling times out or batch fails
   */
  async pollUntilComplete(
    batchId: string,
    pollInterval?: number
  ): Promise<BatchResult[]> {
    const interval = pollInterval ?? this.config.pollIntervalMs;
    const maxWaitTime = this.config.maxWaitTimeMs;
    const startTime = Date.now();

    this.logger.info({
      batchId,
      pollInterval: interval,
      maxWaitTime,
    }, 'Starting batch job polling');

    let lastLoggedPercentage = 0;

    while (true) {
      const elapsedTime = Date.now() - startTime;

      // Check timeout
      if (elapsedTime >= maxWaitTime) {
        throw new BatchAPIError(
          `Batch job ${batchId} exceeded maximum wait time of ${maxWaitTime}ms`,
          'POLLING_TIMEOUT',
          408,
          { elapsedTime, maxWaitTime }
        );
      }

      // Get current status
      const status = await this.getBatchJobStatus(batchId);

      // Log progress updates at 10% intervals
      if (status.completion_percentage >= lastLoggedPercentage + 10) {
        this.logger.info({
          batchId,
          completionPercentage: status.completion_percentage,
          elapsedTimeMs: elapsedTime,
          requestCounts: status.request_counts,
        }, 'Batch job progress update');
        lastLoggedPercentage = status.completion_percentage;
      }

      // Check if complete
      if (status.is_complete) {
        this.logger.info({
          batchId,
          totalTimeMs: elapsedTime,
          finalStatus: status.request_counts,
        }, 'Batch job completed');

        return this.retrieveBatchResults(batchId);
      }

      // Wait before next poll
      await this.sleep(interval);
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Executes a function with retry logic and exponential backoff
   *
   * @param fn - Async function to execute
   * @param operation - Operation name for logging
   * @returns Promise resolving to function result
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operation: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof BatchAPIError && error.statusCode) {
          if (error.statusCode >= 400 && error.statusCode < 500) {
            throw error;
          }
        }

        if (attempt < this.config.maxRetries) {
          const backoffMs = this.calculateBackoff(attempt);

          this.logger.warn({
            operation,
            attempt,
            maxRetries: this.config.maxRetries,
            backoffMs,
            error: lastError.message,
          }, 'Retrying operation after error');

          await this.sleep(backoffMs);
        }
      }
    }

    this.logger.error({
      operation,
      attempts: this.config.maxRetries,
      error: lastError,
    }, 'Operation failed after all retry attempts');

    throw lastError;
  }

  /**
   * Calculates exponential backoff delay
   *
   * @param attempt - Current attempt number (1-indexed)
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    const baseDelay = 1000;
    const maxDelay = 30000; // Cap at 30 seconds
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Handles API errors and converts them to BatchAPIError
   *
   * @param error - Error from API call
   * @param code - Error code to use
   * @returns BatchAPIError instance
   */
  private handleAPIError(error: unknown, code: string): BatchAPIError {
    if (error instanceof BatchAPIError) {
      return error;
    }

    if (error instanceof Anthropic.APIError) {
      return new BatchAPIError(
        error.message,
        code,
        error.status,
        {
          headers: error.headers,
        }
      );
    }

    if (error instanceof Error) {
      return new BatchAPIError(
        error.message,
        code,
        undefined,
        error
      );
    }

    return new BatchAPIError(
      'Unknown error occurred',
      code,
      undefined,
      error
    );
  }

  /**
   * Sleeps for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Convenience Methods
  // ==========================================================================

  /**
   * Creates a batch job and polls until completion
   *
   * @param requests - Array of batch requests to process
   * @param pollInterval - Interval between status checks in milliseconds
   * @returns Promise resolving to array of batch results
   */
  async createAndWaitForCompletion(
    requests: BatchRequest[],
    pollInterval?: number
  ): Promise<BatchResult[]> {
    const batch = await this.createBatchJob(requests);
    return this.pollUntilComplete(batch.id, pollInterval);
  }

  /**
   * Gets the underlying Anthropic SDK client
   *
   * @returns Anthropic client instance
   */
  getClient(): Anthropic {
    return this.client;
  }

  /**
   * Gets the current configuration
   *
   * @returns Client configuration
   */
  getConfig(): Required<Omit<AnthropicClientConfig, 'apiKey' | 'logger'>> {
    return { ...this.config };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new AnthropicBatchClient with environment-based configuration
 *
 * @param overrides - Optional configuration overrides
 * @returns Configured AnthropicBatchClient instance
 */
export function createAnthropicBatchClient(
  overrides?: Partial<AnthropicClientConfig>
): AnthropicBatchClient {
  const apiKey = overrides?.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY must be provided in config or environment variables'
    );
  }

  return new AnthropicBatchClient({
    apiKey,
    model: overrides?.model || process.env.DEFAULT_MODEL,
    maxTokens: overrides?.maxTokens
      ? Number(overrides.maxTokens)
      : Number(process.env.DEFAULT_MAX_TOKENS),
    thinkingBudgetTokens: overrides?.thinkingBudgetTokens
      ? Number(overrides.thinkingBudgetTokens)
      : Number(process.env.DEFAULT_THINKING_TOKENS),
    temperature: overrides?.temperature
      ? Number(overrides.temperature)
      : Number(process.env.DEFAULT_TEMPERATURE),
    pollIntervalMs: overrides?.pollIntervalMs
      ? Number(overrides.pollIntervalMs)
      : Number(process.env.BATCH_POLL_INTERVAL_MS),
    maxWaitTimeMs: overrides?.maxWaitTimeMs
      ? Number(overrides.maxWaitTimeMs)
      : Number(process.env.BATCH_TIMEOUT_MS),
    ...overrides,
  });
}
