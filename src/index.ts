/**
 * BizHealth Report Pipeline - Main Entry Point
 *
 * This module provides the main API for processing BizHealth assessments
 * through all pipeline phases and generating reports.
 *
 * Key exports:
 * - processSubmission: Execute Phase 1 analysis
 * - ReportGenerator: Generate HTML reports from IDM
 * - ReportType: Enum of available report types
 * - createPhase4Orchestrator: Create Phase 4 orchestrator with report generation
 */

import { config } from 'dotenv';
import { createPhase1Orchestrator } from './orchestration/phase1-orchestrator.js';
import { db } from './database/index.js';
import { logger } from './utils/logger.js';
import { formatError } from './utils/errors.js';
import type { WebhookPayload } from './types/webhook.types.js';

// Load environment variables
config();

// Re-export key modules for external use
export { ReportGenerator, ReportType, REPORT_METADATA, createReportGenerator, getAvailableReportTypes } from './reports/index.js';
export { createPhase4Orchestrator, Phase4Orchestrator } from './orchestration/phase4-orchestrator.js';
export { consolidateIDM, IDMConsolidator } from './orchestration/idm-consolidator.js';
export { createReportAPIHandler, ReportAPIHandler, createExpressHandlers } from './api/report-endpoints.js';
export type { IDM, Chapter, Dimension, Finding, Recommendation, Risk } from './types/idm.types.js';

/**
 * Process a questionnaire submission through Phase 1
 */
export async function processSubmission(webhookPayload: WebhookPayload) {
  const startTime = Date.now();
  logger.info({
    submission_id: webhookPayload.submission_id,
    company: webhookPayload.business_overview.company_name,
    event: webhookPayload.event,
  }, 'Processing questionnaire submission');

  try {
    // Connect to database
    await db.connect();
    logger.info('Database connected');

    // Create orchestrator
    const orchestrator = createPhase1Orchestrator({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: process.env.DEFAULT_MODEL || 'claude-opus-4-20250514',
      pollIntervalMs: parseInt(process.env.BATCH_POLL_INTERVAL_MS || '30000'),
    });

    // Execute Phase 1
    logger.info('Starting Phase 1 execution');
    const results = await orchestrator.executePhase1(webhookPayload);

    // Log results
    const duration = Date.now() - startTime;
    logger.info({
      submission_id: webhookPayload.submission_id,
      status: results.status,
      successful_analyses: results.metadata.successful_analyses,
      failed_analyses: results.metadata.failed_analyses,
      duration_ms: duration,
    }, 'Phase 1 completed');

    // Log detailed results
    if (results.status === 'complete') {
      logger.info('All 10 analyses completed successfully');
    } else if (results.status === 'partial') {
      logger.warn({
        successful: results.metadata.successful_analyses,
        failed: results.metadata.failed_analyses,
      }, 'Phase 1 completed with partial results');
    } else {
      logger.error('Phase 1 failed');
    }

    return results;
  } catch (error) {
    logger.error({
      error: formatError(error),
      submission_id: webhookPayload.submission_id,
    }, 'Phase 1 execution failed');
    throw error;
  } finally {
    // Disconnect from database
    await db.disconnect();
    logger.info('Database disconnected');
  }
}

/**
 * Main function for CLI execution
 */
async function main() {
  try {
    // Check for required environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    // Load sample webhook data
    const sampleWebhookPath = process.argv[2] || './sample_webhook.json';
    logger.info({ path: sampleWebhookPath }, 'Loading webhook data');

    const { default: webhookData } = await import(sampleWebhookPath, {
      assert: { type: 'json' },
    });

    // Process submission
    const results = await processSubmission(webhookData as WebhookPayload);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1 EXECUTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status: ${results.status.toUpperCase()}`);
    console.log(`Successful Analyses: ${results.metadata.successful_analyses}/10`);
    console.log(`Failed Analyses: ${results.metadata.failed_analyses}/10`);
    console.log(`Total Duration: ${results.metadata.total_duration_ms}ms`);
    console.log(`Total Tokens: ${results.metadata.total_token_usage.total_tokens}`);
    console.log(`  - Input: ${results.metadata.total_token_usage.input_tokens}`);
    console.log(`  - Output: ${results.metadata.total_token_usage.output_tokens}`);
    console.log(`  - Thinking: ${results.metadata.total_token_usage.thinking_tokens}`);
    console.log('='.repeat(80));

    if (results.tier1) {
      console.log('\nTIER 1 ANALYSES:');
      const tier1Keys = Object.keys(results.tier1) as Array<keyof typeof results.tier1>;
      tier1Keys.forEach((key) => {
        const analysis = results.tier1[key];
        if (analysis) {
          console.log(`  ✓ ${key.replace(/_/g, ' ').toUpperCase()}`);
        }
      });
    }

    if (results.tier2) {
      console.log('\nTIER 2 ANALYSES:');
      const tier2Keys = Object.keys(results.tier2) as Array<keyof typeof results.tier2>;
      tier2Keys.forEach((key) => {
        const analysis = results.tier2[key];
        if (analysis) {
          console.log(`  ✓ ${key.replace(/_/g, ' ').toUpperCase()}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    logger.error({ error: formatError(error) }, 'Application error');
    console.error('\nERROR:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default { processSubmission };
