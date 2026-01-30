/**
 * BizHealth Pipeline - Render Background Worker
 * 
 * This worker runs on Render and processes pipeline jobs from the Supabase queue.
 * It polls the pipeline_queue table for pending jobs and executes the appropriate pipeline:
 * - BIG Pipeline: Growth Plan ($299) - 87 questions, 17+ reports
 * - LIL Pipeline: Essentials Plan ($99) - 45 questions, 8 reports
 */

import { config as dotenvConfig } from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { runPipeline } from './run-pipeline.js';
import { runLILPipeline, validateLILInput } from './orchestration/lil/lil-pipeline-orchestrator.js';
import { logger } from './utils/logger.js';
import { formatError } from './utils/errors.js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenvConfig();

// Initialize Supabase client with service role (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuration
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '10000'); // 10 seconds
const PORT = parseInt(process.env.PORT || '3000');

// Track if we're currently processing a job
let isProcessing = false;
let currentJobId: string | null = null;
let currentPipelineType: string | null = null;

/**
 * Determine pipeline type from job data
 */
function determinePipelineType(job: any): 'BIG' | 'LIL' {
  // Check explicit pipeline_type field
  if (job.pipeline_type === 'LIL') return 'LIL';
  if (job.pipeline_type === 'BIG') return 'BIG';
  
  // Check payload for pipeline type
  if (job.payload?.pipelineType === 'LIL') return 'LIL';
  
  // Check response count (LIL has ~45 questions, BIG has ~87)
  const responseCount = job.payload?.responses?.length || 0;
  if (responseCount > 0 && responseCount <= 50) return 'LIL';
  
  // Default to BIG pipeline
  return 'BIG';
}

/**
 * Convert questionnaire responses to webhook payload format (for BIG pipeline)
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
      const cleanKey = key.replace(`${dimension}_`, '');
      dimensionResponses[cleanKey] = value;
    }
  }
  
  return dimensionResponses;
}

/**
 * Process a BIG pipeline job (Growth Plan - $299)
 */
async function processBIGJob(job: any, questionnaire: any): Promise<{ reports: any[] }> {
  const jobId = job.id;
  
  // Convert to webhook payload format
  const webhookPayload = convertToWebhookPayload(questionnaire);

  // Create a temporary file for the webhook payload
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const payloadPath = path.join(tempDir, `${jobId}_payload.json`);
  fs.writeFileSync(payloadPath, JSON.stringify(webhookPayload, null, 2));

  logger.info({ jobId, payloadPath, pipelineType: 'BIG' }, 'Running BIG pipeline');

  // Run the full BIG pipeline
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
      else if (file.includes('owner')) reportType = 'owner';
      else if (file.includes('manager')) reportType = file.replace('.html', '');

      reports.push({
        type: reportType,
        filename: file,
        content: content,
      });
    }
  }

  // Clean up temp file
  if (fs.existsSync(payloadPath)) {
    fs.unlinkSync(payloadPath);
  }

  return { reports };
}

/**
 * Process a LIL pipeline job (Essentials Plan - $99)
 */
async function processLILJob(job: any, questionnaire: any): Promise<{ reports: any[] }> {
  const jobId = job.id;
  
  // Get the input data from the job payload or questionnaire
  const inputData = job.payload || questionnaire.responses;
  
  // Validate LIL input
  const validation = validateLILInput(inputData);
  if (!validation.valid) {
    logger.warn({ jobId, errors: validation.errors }, 'LIL input validation warnings');
  }

  logger.info({ jobId, pipelineType: 'LIL' }, 'Running LIL pipeline');

  // Create output directory
  const outputDir = path.join(process.cwd(), 'output', jobId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Run the LIL pipeline
  const result = await runLILPipeline({
    inputData: inputData,
    outputDir: outputDir,
    onProgress: (state) => {
      logger.info({
        jobId,
        phase: state.currentPhase,
        status: state.status
      }, 'LIL pipeline progress');
      
      // Update job progress in database
      supabase
        .from('pipeline_queue')
        .update({
          progress: {
            phase: state.currentPhase,
            status: state.status,
            tokensUsed: state.metrics.totalTokensUsed,
            executionTimeMs: state.metrics.executionTimeMs
          }
        })
        .eq('id', jobId)
        .then(() => {});
    }
  });

  if (!result.success) {
    throw new Error(result.error || 'LIL pipeline failed');
  }

  // Convert pipeline output to report format
  const reports: any[] = [];
  
  if (result.reports && result.reports.reports) {
    // Phase 5 returns reports as an object keyed by report type
    for (const [reportType, report] of Object.entries(result.reports.reports)) {
      reports.push({
        type: reportType.replace(/-/g, '_'), // Convert hyphens to underscores for DB
        filename: `${reportType}.html`,
        content: (report as any).htmlContent,
        title: (report as any).title,
        pageCount: (report as any).pageCount
      });
    }
  }

  return { reports };
}

/**
 * Process a single job from the queue
 */
async function processJob(job: any): Promise<void> {
  const jobId = job.id;
  const questionnaireId = job.questionnaire_id;
  const userId = job.user_id;
  const pipelineType = determinePipelineType(job);

  currentPipelineType = pipelineType;
  logger.info({ jobId, questionnaireId, userId, pipelineType }, 'Starting job processing');

  try {
    // Update job status to processing
    await supabase
      .from('pipeline_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: (job.attempts || 0) + 1,
        pipeline_type: pipelineType
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

    // Process based on pipeline type
    let result: { reports: any[] };
    
    if (pipelineType === 'LIL') {
      result = await processLILJob(job, questionnaire);
    } else {
      result = await processBIGJob(job, questionnaire);
    }

    const { reports } = result;

    // Save reports to database
    logger.info({ jobId, reportCount: reports.length }, 'Saving reports to database');
    
    for (const report of reports) {
      // Normalize report type (convert hyphens to underscores for consistency)
      const normalizedType = report.type.replace(/-/g, '_');
      
      const reportData = {
        user_id: userId,
        questionnaire_id: questionnaireId,
        report_type: normalizedType,
        title: report.title || `${report.type.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Report`,
        html_content: report.content,
        status: 'completed',
        pipeline_type: pipelineType,
        page_count: report.pageCount || null,
      };
      
      const { data, error } = await supabase.from('reports').insert(reportData).select();
      
      if (error) {
        logger.error({ 
          jobId, 
          reportType: normalizedType, 
          error: error.message,
          details: error.details,
          hint: error.hint
        }, 'Failed to save report to database');
        throw new Error(`Failed to save report ${normalizedType}: ${error.message}`);
      }
      
      logger.info({ 
        jobId, 
        reportType: normalizedType,
        reportId: data?.[0]?.id 
      }, 'Report saved to database');
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
          pipeline_type: pipelineType,
          reports_generated: reports.length,
          report_types: reports.map(r => r.type),
        },
      })
      .eq('id', jobId);

    logger.info({ 
      jobId, 
      pipelineType,
      reportsGenerated: reports.length 
    }, 'Job completed successfully');

  } catch (error) {
    logger.error({ jobId, pipelineType, error: formatError(error) }, 'Job processing failed');

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
        currentPipelineType = null;
      }
    }
  } catch (error) {
    logger.error({ error: formatError(error) }, 'Error in job polling');
    isProcessing = false;
    currentJobId = null;
    currentPipelineType = null;
  }
}

/**
 * Start the worker
 */
async function startWorker(): Promise<void> {
  logger.info({ pollInterval: POLL_INTERVAL_MS }, 'Starting BizHealth Pipeline Worker (BIG + LIL)');

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
    version: '2.0.0',
    pipelines: ['BIG (Growth $299)', 'LIL (Essentials $99)'],
    status: 'running',
    isProcessing,
    currentJobId,
    currentPipelineType,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API endpoint to manually trigger a job (for testing)
app.post('/trigger', express.json(), async (req, res) => {
  const { questionnaire_id, user_id, pipeline_type } = req.body;

  if (!questionnaire_id || !user_id) {
    return res.status(400).json({ error: 'questionnaire_id and user_id required' });
  }

  try {
    const { data, error } = await supabase
      .from('pipeline_queue')
      .insert({
        questionnaire_id,
        user_id,
        pipeline_type: pipeline_type || 'BIG',
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

// API endpoint to get pipeline status
app.get('/status/:jobId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_queue')
      .select('*')
      .eq('id', req.params.jobId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Job not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Start the server
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Worker HTTP server started');
  startWorker();
});
