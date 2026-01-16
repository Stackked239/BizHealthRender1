/**
 * Database Module Entry Point
 * Exports database client, query helpers, and all related types
 */

export { db, DatabaseError, NotFoundError } from './db-client.js';
export { queries } from './queries.js';

export type {
  Submission,
  BatchJob,
  AnalysisOutput,
  AuditEvent,
  TokenUsage,
  SubmissionStatus,
  BatchJobStatus,
  Phase,
  Tier,
} from './db-client.js';
