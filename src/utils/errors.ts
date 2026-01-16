/**
 * Custom error classes for the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class TransformationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'TRANSFORMATION_ERROR', 500, { field });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, { resource, id });
  }
}

export class BatchAPIError extends AppError {
  constructor(message: string, code: string, details?: unknown) {
    super(message, code, 500, details);
  }
}

export class OrchestrationError extends AppError {
  constructor(message: string, phase: string, details?: unknown) {
    super(message, 'ORCHESTRATION_ERROR', 500, { phase, ...details });
  }
}

/**
 * DataContaminationError - Thrown when cross-client data contamination is detected
 *
 * This is a CRITICAL error for a $20,000+ deliverable - contamination must halt
 * the pipeline, not be silently patched.
 */
export class DataContaminationError extends AppError {
  public readonly runId: string;
  public readonly reportType?: string;
  public readonly foundTerms?: string[];
  public readonly occurrences?: number;
  public readonly validationErrors?: string[];
  public readonly expectedPath?: string;
  public readonly sources?: Record<string, string>;
  public readonly recommendation?: string;

  constructor(params: {
    runId: string;
    message: string;
    reportType?: string;
    foundTerms?: string[];
    occurrences?: number;
    errors?: string[];
    expectedPath?: string;
    sources?: Record<string, string>;
    recommendation?: string;
  }) {
    super(params.message, 'DATA_CONTAMINATION_ERROR', 500, {
      runId: params.runId,
      reportType: params.reportType,
      foundTerms: params.foundTerms,
      occurrences: params.occurrences,
      errors: params.errors,
      expectedPath: params.expectedPath,
      sources: params.sources,
      recommendation: params.recommendation,
    });

    this.runId = params.runId;
    this.reportType = params.reportType;
    this.foundTerms = params.foundTerms;
    this.occurrences = params.occurrences;
    this.validationErrors = params.errors;
    this.expectedPath = params.expectedPath;
    this.sources = params.sources;
    this.recommendation = params.recommendation;

    // Log CRITICAL event - this should be highly visible in logs
    console.error('========================================');
    console.error('CRITICAL: DATA CONTAMINATION DETECTED');
    console.error('========================================');
    console.error(`Run ID: ${this.runId}`);
    if (this.reportType) {
      console.error(`Report Type: ${this.reportType}`);
    }
    if (this.foundTerms && this.foundTerms.length > 0) {
      console.error(`Found Terms: ${this.foundTerms.join(', ')}`);
    }
    if (this.occurrences) {
      console.error(`Occurrences: ${this.occurrences}`);
    }
    console.error(`Message: ${params.message}`);
    if (this.recommendation) {
      console.error(`Recommendation: ${this.recommendation}`);
    }
    console.error('========================================');
    console.error('PIPELINE HALTED - Investigate and retry');
    console.error('========================================');
  }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is DataContaminationError
 */
export function isDataContaminationError(error: unknown): error is DataContaminationError {
  return error instanceof DataContaminationError;
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): Record<string, unknown> {
  // Handle DataContaminationError with full details
  if (isDataContaminationError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      runId: error.runId,
      reportType: error.reportType,
      foundTerms: error.foundTerms,
      occurrences: error.occurrences,
      validationErrors: error.validationErrors,
      expectedPath: error.expectedPath,
      sources: error.sources,
      recommendation: error.recommendation,
      stack: error.stack,
    };
  }

  if (isAppError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
