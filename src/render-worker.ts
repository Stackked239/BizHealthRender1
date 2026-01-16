/**
 * BizHealth Pipeline - Render Background Worker
 * 
 * This worker runs on Render and processes pipeline jobs from the Supabase queue.
 * It polls the pipeline_queue table for pending jobs and executes the full pipeline.
 */

import { config as dotenvConfig } from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { runPipeline } from './run-pipeline.js';
import { logger } from './utils/logger.js';
import { formatError } from './utils/errors.js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenvConfig();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '10000'); // 10 seconds
const PORT = parseInt(process.env.PORT || '3000');

// Track if we're currently processing a job
let isProcessing = false;
let currentJobId: string | null = null;

/**
 * Convert questionnaire responses to webhook payload format
 */
function convertToWebhookPayload(questionnaire: any): any {
  const companyProfile = questionnaire.company_profile || {};
  const responses = questionnaire.responses || {};

  return {
    event: 'questionnaire_completed',
    submission_id: questionnaire.id,
    timestamp: new Date().toISOString(),
    business_overview: {
      company_name: companyProfile.company_name || 'Unknown Company',
      industry: companyProfile.industry || 'General Business',
      business_type: companyProfile.business_type || 'LLC',
      years_in_business: parseInt(companyProfile.years_in_business) || 5,
      employee_count: parseInt(companyProfile.employee_count) || 10,
      annual_revenue: companyProfile.annual_revenue || '$1M-$5M',
      location: {
        city: companyProfile.city || 'Unknown',
        state: companyProfile.state || 'Unknown',
        country: companyProfile.country || 'USA',
      },
      primary_market: companyProfile.primary_market || 'Local',
      growth_stage: companyProfile.growth_stage || 'Growth',
    },
    questionnaire_responses: {
      strategy: extractDimensionResponses(responses, 'strategy'),
      sales: extractDimensionResponses(responses, 'sales'),
      marketing: extractDimensionResponses(responses, 'marketing'),
      customer_experience: extractDimensionResponses(responses, 'customer_experience'),
      operations: extractDimensionResponses(responses, 'operations'),
      financials: extractDimensionResponses(responses, 'financials'),
      human_resources: extractDimensionResponses(responses, 'human_resources'),
      leadership: extractDimensionResponses(responses, 'leadership'),
      technology: extractDimensionResponses(responses, 'technology'),
      it_infrastructure: extractDimensionResponses(responses, 'it_infrastructure'),
      risk_management: extractDimensionResponses(responses, 'risk_management'),
      compliance: extractDimensionResponses(responses, 'compliance'),
    },
  };
}

/**
 * Extract responses for a specific dimension
 */
function extractDimensionResponses(responses: Record<string, any>, dimension: string): Record<string, any> {
  const dimensionResponses: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(responses)) {
    if (key.startsWith(`${dimension}_`) || key.startsWith(dimension)) {
      // Remove dimension prefix for cleaner keys
      const cleanKey = key.replace(`${dimension}_`, '');
      dimensionResponses[cleanKey] = value;
    }
  }
  
  return dimensionResponses;
}

/**
 * Process a single job from the queue
 */
async function processJob(job: any): Promise<void> {
  const jobId = job.id;
  const questionnaireId = job.questionnaire_id;
  const userId = job.user_id;

  logger.info({ jobId, questionnaireId, userId }, 'Starting job processing');

  try {
    // Update job status to processing
    await supabase
      .from('pipeline_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: (job.attempts || 0) + 1,
      })
      .eq('id', jobId);

    // Fetch the questionnaire data
    const { data: questionnaire, error: fetchError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', questionnaireId)
      .single();

    if (fetchError || !questionnaire) {
      throw new Error(`Failed to fetch questionnaire: ${fetchError?.message || 'Not found'}`);
    }

    // Convert to webhook payload format
    const webhookPayload = convertToWebhookPayload(questionnaire);

    // Create a temporary file for the webhook payload
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const payloadPath = path.join(tempDir, `${jobId}_payload.json`);
    fs.writeFileSync(payloadPath, JSON.stringify(webhookPayload, null, 2));

    logger.info({ jobId, payloadPath }, 'Running pipeline');

    // Run the full pipeline
    const outputDir = path.join(process.cwd(), 'output', jobId);
    await runPipeline({
      inputFile: payloadPath,
      outputDir: outputDir,
      startPhase: 0,
      endPhase: 5,
      skipPhase15: false,
      skipPhase45: false,
    });

    // Find generated reports
    const reportsDir = path.join(outputDir, 'phase5');
    const reports: any[] = [];

    if (fs.existsSync(reportsDir)) {
      const reportFiles = fs.readdirSync(reportsDir).filter(f => f.endsWith('.html'));
      
      for (const file of reportFiles) {
        const filePath = path.join(reportsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Determine report type from filename
        let reportType = 'comprehensive';
        if (file.includes('executive')) reportType = 'executive_summary';
        else if (file.includes('action')) reportType = 'action_plan';
        else if (file.includes('benchmark')) reportType = 'benchmark';

        reports.push({
          type: reportType,
          filename: file,
          content: content,
        });
      }
    }

    // Save reports to database
    for (const report of reports) {
      await supabase.from('reports').insert({
        user_id: userId,
        questionnaire_id: questionnaireId,
        report_type: report.type,
        title: `${report.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Report`,
        content: report.content,
        format: 'html',
        status: 'completed',
        generated_at: new Date().toISOString(),
      });
    }

    // Update questionnaire status
    await supabase
      .from('questionnaires')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', questionnaireId);

    // Mark job as completed
    await supabase
      .from('pipeline_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: {
          reports_generated: reports.length,
          report_types: reports.map(r => r.type),
        },
      })
      .eq('id', jobId);

    logger.info({ jobId, reportsGenerated: reports.length }, 'Job completed successfully');

    // Clean up temp file
    if (fs.existsSync(payloadPath)) {
      fs.unlinkSync(payloadPath);
    }

  } catch (error) {
    logger.error({ jobId, error: formatError(error) }, 'Job processing failed');

    // Update job status to failed
    await supabase
      .from('pipeline_queue')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Update questionnaire status
    await supabase
      .from('questionnaires')
      .update({
        status: 'failed',
      })
      .eq('id', job.questionnaire_id);
  }
}

/**
 * Poll for pending jobs and process them
 */
async function pollForJobs(): Promise<void> {
  if (isProcessing) {
    return;
  }

  try {
    // Fetch the oldest pending job
    const { data: jobs, error } = await supabase
      .from('pipeline_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      logger.error({ error }, 'Failed to fetch pending jobs');
      return;
    }

    if (jobs && jobs.length > 0) {
      isProcessing = true;
      currentJobId = jobs[0].id;

      try {
        await processJob(jobs[0]);
      } finally {
        isProcessing = false;
        currentJobId = null;
      }
    }
  } catch (error) {
    logger.error({ error: formatError(error) }, 'Error in job polling');
    isProcessing = false;
    currentJobId = null;
  }
}

/**
 * Start the worker
 */
async function startWorker(): Promise<void> {
  logger.info({ pollInterval: POLL_INTERVAL_MS }, 'Starting BizHealth Pipeline Worker');

  // Start polling for jobs
  setInterval(pollForJobs, POLL_INTERVAL_MS);

  // Also poll immediately on startup
  pollForJobs();
}

// Create Express app for health checks (required by Render)
const app = express();

app.get('/', (req, res) => {
  res.json({
    service: 'BizHealth Pipeline Worker',
    status: 'running',
    isProcessing,
    currentJobId,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API endpoint to manually trigger a job (for testing)
app.post('/trigger', express.json(), async (req, res) => {
  const { questionnaire_id, user_id } = req.body;

  if (!questionnaire_id || !user_id) {
    return res.status(400).json({ error: 'questionnaire_id and user_id required' });
  }

  try {
    const { data, error } = await supabase
      .from('pipeline_queue')
      .insert({
        questionnaire_id,
        user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, job: data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Start the server
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Worker HTTP server started');
  startWorker();
});
