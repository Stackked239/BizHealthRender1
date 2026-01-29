/**
 * Common Database Queries and Helpers
 * Reusable query patterns and utility functions
 */

import { db } from './db-client.js';
import type { BatchJob, Phase } from './db-client.js';

// ================================================================
// Submission Query Helpers
// ================================================================

/**
 * Get submission with all related data
 */
export async function getSubmissionWithDetails(submissionId: string) {
  const [submission, jobs, outputs, auditEvents] = await Promise.all([
    db.getSubmissionById(submissionId),
    db.getBatchJobsBySubmission(submissionId),
    db.getAnalysisOutputsBySubmission(submissionId),
    db.getAuditEvents(submissionId),
  ]);

  return {
    submission,
    jobs,
    outputs,
    auditEvents,
  };
}

/**
 * Get submission progress statistics
 */
export async function getSubmissionProgress(submissionId: string) {
  const jobs = await db.getBatchJobsBySubmission(submissionId);

  const stats = {
    total_jobs: jobs.length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completion_percentage: 0,
  };

  stats.completion_percentage = stats.total_jobs > 0
    ? Math.round((stats.completed / stats.total_jobs) * 100)
    : 0;

  return stats;
}

/**
 * Check if a phase is complete
 */
export async function isPhaseComplete(submissionId: string, phase: Phase): Promise<boolean> {
  const jobs = await db.getBatchJobsBySubmission(submissionId);
  const phaseJobs = jobs.filter((j) => j.phase === phase);

  if (phaseJobs.length === 0) {
    return false;
  }

  return phaseJobs.every((j) => j.status === 'completed');
}

/**
 * Get failed jobs for a submission
 */
export async function getFailedJobs(submissionId: string): Promise<BatchJob[]> {
  const jobs = await db.getBatchJobsBySubmission(submissionId);
  return jobs.filter((j) => j.status === 'failed');
}

// ================================================================
// Token Usage Analytics
// ================================================================

/**
 * Calculate total token usage for a submission
 */
export async function getTokenUsageStats(submissionId: string) {
  const jobs = await db.getBatchJobsBySubmission(submissionId);

  const stats = {
    total_tokens: 0,
    input_tokens: 0,
    output_tokens: 0,
    thinking_tokens: 0,
    jobs_with_usage: 0,
    average_tokens_per_job: 0,
  };

  jobs.forEach((job) => {
    if (job.token_usage) {
      stats.total_tokens += job.token_usage.total_tokens;
      stats.input_tokens += job.token_usage.input_tokens;
      stats.output_tokens += job.token_usage.output_tokens;
      stats.thinking_tokens += job.token_usage.thinking_tokens || 0;
      stats.jobs_with_usage += 1;
    }
  });

  if (stats.jobs_with_usage > 0) {
    stats.average_tokens_per_job = Math.round(stats.total_tokens / stats.jobs_with_usage);
  }

  return stats;
}

/**
 * Get token usage by phase
 */
export async function getTokenUsageByPhase(submissionId: string) {
  const jobs = await db.getBatchJobsBySubmission(submissionId);

  const phaseStats: Record<Phase, { total_tokens: number; job_count: number }> = {
    phase_1_tier_1: { total_tokens: 0, job_count: 0 },
    phase_1_tier_2: { total_tokens: 0, job_count: 0 },
    phase_2: { total_tokens: 0, job_count: 0 },
    phase_3: { total_tokens: 0, job_count: 0 },
  };

  jobs.forEach((job) => {
    if (job.token_usage && phaseStats[job.phase]) {
      phaseStats[job.phase].total_tokens += job.token_usage.total_tokens;
      phaseStats[job.phase].job_count += 1;
    }
  });

  return phaseStats;
}

// ================================================================
// Performance Analytics
// ================================================================

/**
 * Calculate processing time statistics
 */
export async function getProcessingTimeStats(submissionId: string) {
  const jobs = await db.getBatchJobsBySubmission(submissionId);
  const completedJobs = jobs.filter((j) => j.processing_time_ms !== null);

  if (completedJobs.length === 0) {
    return {
      total_jobs: 0,
      total_time_ms: 0,
      average_time_ms: 0,
      min_time_ms: 0,
      max_time_ms: 0,
    };
  }

  const times = completedJobs.map((j) => j.processing_time_ms!);
  const totalTime = times.reduce((sum, t) => sum + t, 0);

  return {
    total_jobs: completedJobs.length,
    total_time_ms: totalTime,
    average_time_ms: Math.round(totalTime / completedJobs.length),
    min_time_ms: Math.min(...times),
    max_time_ms: Math.max(...times),
  };
}

/**
 * Get processing time by phase
 */
export async function getProcessingTimeByPhase(submissionId: string) {
  const jobs = await db.getBatchJobsBySubmission(submissionId);

  const phaseStats: Record<Phase, { total_time_ms: number; job_count: number; avg_time_ms: number }> = {
    phase_1_tier_1: { total_time_ms: 0, job_count: 0, avg_time_ms: 0 },
    phase_1_tier_2: { total_time_ms: 0, job_count: 0, avg_time_ms: 0 },
    phase_2: { total_time_ms: 0, job_count: 0, avg_time_ms: 0 },
    phase_3: { total_time_ms: 0, job_count: 0, avg_time_ms: 0 },
  };

  jobs.forEach((job) => {
    if (job.processing_time_ms !== null && phaseStats[job.phase]) {
      phaseStats[job.phase].total_time_ms += job.processing_time_ms;
      phaseStats[job.phase].job_count += 1;
    }
  });

  // Calculate averages
  Object.keys(phaseStats).forEach((phase) => {
    const stats = phaseStats[phase as Phase];
    if (stats.job_count > 0) {
      stats.avg_time_ms = Math.round(stats.total_time_ms / stats.job_count);
    }
  });

  return phaseStats;
}

// ================================================================
// Batch Management Helpers
// ================================================================

/**
 * Get jobs ready for submission to batch API
 */
export async function getPendingJobs(submissionId: string): Promise<BatchJob[]> {
  const jobs = await db.getBatchJobsBySubmission(submissionId);
  return jobs.filter((j) => j.status === 'pending');
}

/**
 * Get jobs currently processing
 */
export async function getProcessingJobs(submissionId: string): Promise<BatchJob[]> {
  const jobs = await db.getBatchJobsBySubmission(submissionId);
  return jobs.filter((j) => j.status === 'processing' || j.status === 'submitted');
}

/**
 * Check if all jobs in a batch are complete
 */
export async function isBatchComplete(submissionId: string, batchNumber: number): Promise<boolean> {
  const jobs = await db.getBatchJobsBySubmission(submissionId);
  const batchJobs = jobs.filter((j) => j.batch_number === batchNumber);

  if (batchJobs.length === 0) {
    return false;
  }

  return batchJobs.every((j) => j.status === 'completed' || j.status === 'failed');
}

/**
 * Get completion summary for all batches
 */
export async function getBatchCompletionSummary(submissionId: string) {
  const jobs = await db.getBatchJobsBySubmission(submissionId);

  const batches: Record<number, { total: number; completed: number; failed: number; pending: number }> = {};

  jobs.forEach((job) => {
    if (!batches[job.batch_number]) {
      batches[job.batch_number] = { total: 0, completed: 0, failed: 0, pending: 0 };
    }

    batches[job.batch_number].total += 1;

    if (job.status === 'completed') {
      batches[job.batch_number].completed += 1;
    } else if (job.status === 'failed') {
      batches[job.batch_number].failed += 1;
    } else if (job.status === 'pending') {
      batches[job.batch_number].pending += 1;
    }
  });

  return batches;
}

// ================================================================
// Analysis Output Helpers
// ================================================================

/**
 * Get all Tier 1 outputs (for use in Tier 2 analysis)
 */
export async function getTier1Outputs(submissionId: string) {
  return await db.getAnalysisOutputsByPhase(submissionId, 'phase_1_tier_1');
}

/**
 * Get all Tier 2 outputs (for use in Phase 2 synthesis)
 */
export async function getTier2Outputs(submissionId: string) {
  return await db.getAnalysisOutputsByPhase(submissionId, 'phase_1_tier_2');
}

/**
 * Get Phase 2 outputs (for use in Phase 3 synthesis)
 */
export async function getPhase2Outputs(submissionId: string) {
  return await db.getAnalysisOutputsByPhase(submissionId, 'phase_2');
}

/**
 * Check if we have all required outputs for next phase
 */
export async function hasRequiredOutputsForNextPhase(submissionId: string, currentPhase: Phase): Promise<boolean> {
  const outputs = await db.getAnalysisOutputsByPhase(submissionId, currentPhase);

  // Define expected output counts per phase
  const expectedOutputs: Record<Phase, number> = {
    phase_1_tier_1: 6, // 6 Tier 1 analyses
    phase_1_tier_2: 6, // 6 Tier 2 analyses
    phase_2: 5, // 5 deep dive analyses
    phase_3: 1, // 1 synthesis output
  };

  return outputs.length >= expectedOutputs[currentPhase];
}

// ================================================================
// Reporting Helpers
// ================================================================

/**
 * Generate comprehensive pipeline report
 */
export async function generatePipelineReport(submissionId: string) {
  const [
    submission,
    jobs,
    outputs,
    progressStats,
    tokenStats,
    timeStats,
    batchSummary,
  ] = await Promise.all([
    db.getSubmissionById(submissionId),
    db.getBatchJobsBySubmission(submissionId),
    db.getAnalysisOutputsBySubmission(submissionId),
    getSubmissionProgress(submissionId),
    getTokenUsageStats(submissionId),
    getProcessingTimeStats(submissionId),
    getBatchCompletionSummary(submissionId),
  ]);

  return {
    submission: {
      id: submission.submission_id,
      status: submission.status,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
    },
    progress: progressStats,
    tokens: tokenStats,
    performance: timeStats,
    batches: batchSummary,
    outputs: {
      total: outputs.length,
      by_phase: {
        phase_1_tier_1: outputs.filter((o) => o.phase === 'phase_1_tier_1').length,
        phase_1_tier_2: outputs.filter((o) => o.phase === 'phase_1_tier_2').length,
        phase_2: outputs.filter((o) => o.phase === 'phase_2').length,
        phase_3: outputs.filter((o) => o.phase === 'phase_3').length,
      },
    },
    cost_estimate: {
      total_tokens: tokenStats.total_tokens,
      estimated_cost_usd: calculateCostEstimate(tokenStats.total_tokens),
    },
  };
}

/**
 * Calculate cost estimate based on token usage
 * Note: Update pricing based on actual Anthropic rates
 */
function calculateCostEstimate(totalTokens: number): number {
  // Example pricing (update with actual rates)
  // Assume $15 per million input tokens, $75 per million output tokens
  // For simplicity, using average of $45 per million tokens
  const costPerMillionTokens = 45;
  return (totalTokens / 1_000_000) * costPerMillionTokens;
}

// ================================================================
// Exports
// ================================================================

export const queries = {
  // Submission queries
  getSubmissionWithDetails,
  getSubmissionProgress,
  isPhaseComplete,
  getFailedJobs,

  // Token usage
  getTokenUsageStats,
  getTokenUsageByPhase,

  // Performance
  getProcessingTimeStats,
  getProcessingTimeByPhase,

  // Batch management
  getPendingJobs,
  getProcessingJobs,
  isBatchComplete,
  getBatchCompletionSummary,

  // Analysis outputs
  getTier1Outputs,
  getTier2Outputs,
  getPhase2Outputs,
  hasRequiredOutputsForNextPhase,

  // Reporting
  generatePipelineReport,
};
