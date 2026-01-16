import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing required environment variables:');
  if (!SUPABASE_URL) console.error('- SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  if (!ANTHROPIC_API_KEY) console.error('- ANTHROPIC_API_KEY');
  process.exit(1);
}

// Initialize clients
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Report types to generate
const REPORT_TYPES = [
  { type: 'comprehensive', title: 'Comprehensive Business Health Report' },
  { type: 'executive_brief', title: 'Executive Brief' },
  { type: 'executive_overview', title: 'Executive Overview' },
  { type: 'owner', title: "Owner's Strategic Report" },
  { type: 'deep_dive_growth_engine', title: 'Growth Engine Deep Dive' },
  { type: 'deep_dive_performance_hub', title: 'Performance Hub Deep Dive' },
  { type: 'deep_dive_people_leadership', title: 'People & Leadership Deep Dive' },
  { type: 'deep_dive_risk_systems', title: 'Risk & Systems Deep Dive' },
  { type: 'managers_strategy', title: "Manager's Strategy Report" },
  { type: 'managers_sales_marketing', title: "Manager's Sales & Marketing Report" },
  { type: 'managers_operations', title: "Manager's Operations Report" },
  { type: 'managers_financials', title: "Manager's Financials Report" },
  { type: 'managers_it_technology', title: "Manager's IT & Technology Report" },
  { type: 'employees', title: 'Employee Engagement Report' },
  { type: 'financial_analysis', title: 'Financial Analysis Report' },
  { type: 'risk_assessment', title: 'Risk Assessment Report' },
  { type: 'transformation_roadmap', title: 'Transformation Roadmap' },
];

interface PipelineJob {
  id: string;
  user_id: string;
  questionnaire_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  progress: number;
  current_report: string | null;
}

interface QuestionnaireData {
  id: string;
  user_id: string;
  company_profile: any;
  responses: any;
  status: string;
}

// Logging helper
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Update job progress
async function updateJobProgress(jobId: string, progress: number, currentReport: string | null) {
  await supabase
    .from('pipeline_queue')
    .update({
      progress,
      current_report: currentReport,
    })
    .eq('id', jobId);
}

// Mark job as failed
async function markJobFailed(jobId: string, errorMessage: string) {
  await supabase
    .from('pipeline_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

// Mark job as completed
async function markJobCompleted(jobId: string) {
  await supabase
    .from('pipeline_queue')
    .update({
      status: 'completed',
      progress: 100,
      current_report: null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

// Generate a single report using Claude
async function generateReport(
  reportType: string,
  reportTitle: string,
  questionnaireData: QuestionnaireData,
  companyName: string
): Promise<string> {
  const systemPrompt = `You are an expert business analyst creating professional HTML reports for BizHealth.ai. 
Generate a comprehensive, well-formatted HTML report based on the assessment data provided.

The report should:
1. Be fully self-contained HTML with embedded CSS styling
2. Use professional business report formatting
3. Include BizHealth branding (navy #1e3a5f and green #9ab847 colors)
4. Have clear sections with headers, charts descriptions, and actionable insights
5. Be printable and mobile-responsive
6. Include a terms and conditions acceptance modal at the start

Company Name: ${companyName}
Report Type: ${reportType}
Report Title: ${reportTitle}`;

  const userPrompt = `Generate a ${reportTitle} for ${companyName} based on this assessment data:

${JSON.stringify(questionnaireData.responses, null, 2)}

Company Profile:
${JSON.stringify(questionnaireData.company_profile, null, 2)}

Create a professional HTML report with:
1. Executive summary
2. Key findings and scores
3. Detailed analysis by section
4. Recommendations and action items
5. Visual score representations (using CSS-based charts)
6. Professional formatting suitable for business executives

Return ONLY the complete HTML document, starting with <!DOCTYPE html>.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Unexpected response format from Claude');
  } catch (error: any) {
    log(`Error generating report ${reportType}:`, error.message);
    throw error;
  }
}

// Save report to database
async function saveReport(
  userId: string,
  questionnaireId: string,
  reportType: string,
  title: string,
  htmlContent: string
) {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      questionnaire_id: questionnaireId,
      report_type: reportType,
      title: title,
      status: 'completed',
      html_content: htmlContent,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    log(`Error saving report ${reportType}:`, error);
    throw error;
  }

  return data;
}

// Process a single job
async function processJob(job: PipelineJob) {
  log(`Processing job ${job.id} for user ${job.user_id}`);

  // Mark job as processing
  await supabase
    .from('pipeline_queue')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  try {
    // Fetch questionnaire data
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', job.questionnaire_id)
      .single();

    if (qError || !questionnaire) {
      throw new Error(`Failed to fetch questionnaire: ${qError?.message || 'Not found'}`);
    }

    const companyName = questionnaire.company_profile?.company_name || 'Your Company';
    log(`Generating reports for ${companyName}`);

    // Generate each report
    for (let i = 0; i < REPORT_TYPES.length; i++) {
      const { type, title } = REPORT_TYPES[i];
      const progress = Math.round(((i + 1) / REPORT_TYPES.length) * 100);

      log(`Generating report ${i + 1}/${REPORT_TYPES.length}: ${title}`);
      await updateJobProgress(job.id, progress, title);

      try {
        // Generate the report
        const htmlContent = await generateReport(type, title, questionnaire, companyName);

        // Save to database
        await saveReport(job.user_id, job.questionnaire_id, type, title, htmlContent);

        log(`Successfully generated and saved: ${title}`);

        // Small delay between reports to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (reportError: any) {
        log(`Failed to generate ${title}: ${reportError.message}`);
        // Continue with other reports even if one fails
      }
    }

    // Mark questionnaire as completed
    await supabase
      .from('questionnaires')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', job.questionnaire_id);

    // Mark job as completed
    await markJobCompleted(job.id);
    log(`Job ${job.id} completed successfully`);
  } catch (error: any) {
    log(`Job ${job.id} failed:`, error.message);
    await markJobFailed(job.id, error.message);
  }
}

// Poll for new jobs
async function pollForJobs() {
  try {
    // Find pending jobs
    const { data: jobs, error } = await supabase
      .from('pipeline_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      log('Error polling for jobs:', error.message);
      return;
    }

    if (jobs && jobs.length > 0) {
      const job = jobs[0] as PipelineJob;
      await processJob(job);
    }
  } catch (error: any) {
    log('Error in poll cycle:', error.message);
  }
}

// Main worker loop
async function main() {
  log('BizHealth Pipeline Worker starting...');
  log(`Supabase URL: ${SUPABASE_URL}`);
  log('Polling for jobs every 30 seconds...');

  // Initial poll
  await pollForJobs();

  // Set up polling interval
  setInterval(async () => {
    await pollForJobs();
  }, 30000); // Poll every 30 seconds

  // Keep the process alive
  process.on('SIGINT', () => {
    log('Shutting down worker...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('Shutting down worker...');
    process.exit(0);
  });
}

// Start the worker
main().catch((error) => {
  log('Fatal error:', error);
  process.exit(1);
});
