/**
 * Phase 1 Orchestration Engine
 *
 * Orchestrates execution of Phase 1 analyses (10 analyses in 2 sequential batches):
 * - Batch 1 (Tier 1): 5 foundational analyses executed in parallel
 * - Batch 2 (Tier 2): 5 interconnection analyses executed in parallel (depends on Tier 1)
 *
 * Coordinates:
 * 1. Data transformation (webhook → CP + QR + benchmarks)
 * 2. Batch execution via Anthropic Batch API
 * 3. Result validation and storage
 * 4. Error handling and recovery
 *
 * Based on:
 * - "PHASE 1 - Tier1_Analysis_Execution_Framework.md"
 * - "PHASE 1 - Tier2_Interconnection_Analysis_Framework.md"
 * - "PHASE 1-2 JSON Structure_and_Analysis_Framework.md"
 */

import pino from 'pino';
import * as fs from 'fs/promises';
import * as path from 'path';
import { transformToCompanyProfile } from '../data-transformation/company-profile-transformer.js';
import { transformToQuestionnaireResponses } from '../data-transformation/questionnaire-transformer.js';
import {
  getAllBenchmarks,
  getCrossFunctionalBenchmarks,
  BenchmarkDataset,
  CategoryBenchmarks,
  CrossFunctionalBenchmarks,
} from '../data-transformation/benchmark-service.js';
import {
  AnthropicBatchClient,
  BatchRequest,
  BatchResult,
  createAnthropicBatchClient,
} from '../api/anthropic-client.js';
import { WebhookPayload } from '../types/webhook.types.js';
import { CompanyProfile } from '../types/company-profile.types.js';
import { QuestionnaireResponses } from '../types/questionnaire.types.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Analysis output types (simplified for v1)
 */
export interface AnalysisOutput {
  analysis_id: string;
  analysis_type: string;
  status: 'complete' | 'failed';
  content: string;
  metadata: {
    input_tokens: number;
    output_tokens: number;
    thinking_tokens?: number;
    model: string;
    execution_time_ms: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Tier 1 analysis results (5 foundational analyses)
 */
export interface Tier1Results {
  revenue_engine: AnalysisOutput;
  operational_excellence: AnalysisOutput;
  financial_strategic: AnalysisOutput;
  people_leadership: AnalysisOutput;
  compliance_sustainability: AnalysisOutput;
  execution_metadata: {
    batch_id: string;
    started_at: string;
    completed_at: string;
    total_duration_ms: number;
  };
}

/**
 * Tier 2 analysis results (5 interconnection analyses)
 */
export interface Tier2Results {
  growth_readiness: AnalysisOutput;
  market_position: AnalysisOutput;
  resource_optimization: AnalysisOutput;
  risk_resilience: AnalysisOutput;
  scalability_readiness: AnalysisOutput;
  execution_metadata: {
    batch_id: string;
    started_at: string;
    completed_at: string;
    total_duration_ms: number;
  };
}

/**
 * Complete Phase 1 results
 */
export interface Phase1Results {
  phase: 'phase_1';
  status: 'complete' | 'partial' | 'failed';
  company_profile_id: string;
  tier1: Tier1Results;
  tier2: Tier2Results;
  metadata: {
    started_at: string;
    completed_at: string;
    total_duration_ms: number;
    total_analyses: number;
    successful_analyses: number;
    failed_analyses: number;
  };
}

/**
 * Transformed input data for analyses
 */
interface TransformedData {
  companyProfile: CompanyProfile;
  questionnaireResponses: QuestionnaireResponses;
  categoryBenchmarks: Record<string, CategoryBenchmarks>;
  crossFunctionalBenchmarks: CrossFunctionalBenchmarks;
}

/**
 * Configuration for Phase 1 orchestrator
 */
export interface Phase1OrchestratorConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  thinkingBudgetTokens?: number;
  temperature?: number;
  pollIntervalMs?: number;
  maxWaitTimeMs?: number;
  logger?: pino.Logger;
  enableDatabaseStorage?: boolean;
  outputDir?: string; // Directory to write Phase 1 results
}

// ============================================================================
// Phase 1 Orchestrator Class
// ============================================================================

/**
 * Phase 1 Orchestrator
 * Coordinates execution of 10 analyses in 2 sequential batches
 */
export class Phase1Orchestrator {
  private batchClient: AnthropicBatchClient;
  private logger: pino.Logger;
  private config: Required<Omit<Phase1OrchestratorConfig, 'apiKey' | 'logger'>>;

  constructor(config: Phase1OrchestratorConfig = {}) {
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
      model: config.model || 'claude-opus-4-5-20251101',
      maxTokens: config.maxTokens || 64000,  // Claude Opus 4.5 max output tokens
      thinkingBudgetTokens: config.thinkingBudgetTokens || 32000,  // Budget for extended thinking
      temperature: config.temperature || 1.0,  // Must be 1.0 for extended thinking
      pollIntervalMs: config.pollIntervalMs || 30000,
      maxWaitTimeMs: config.maxWaitTimeMs || 3600000,
      enableDatabaseStorage: config.enableDatabaseStorage ?? true,
      outputDir: config.outputDir || './output/phase1',
    };

    this.batchClient = createAnthropicBatchClient({
      apiKey: config.apiKey,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      thinkingBudgetTokens: this.config.thinkingBudgetTokens,
      temperature: this.config.temperature,
      pollIntervalMs: this.config.pollIntervalMs,
      maxWaitTimeMs: this.config.maxWaitTimeMs,
      logger: this.logger,
    });

    this.logger.info({
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      thinkingBudgetTokens: this.config.thinkingBudgetTokens,
    }, 'Phase1Orchestrator initialized');
  }

  // ==========================================================================
  // Main Orchestration Method
  // ==========================================================================

  /**
   * Execute complete Phase 1 analysis pipeline
   *
   * @param webhookPayload - Raw webhook data from questionnaire submission
   * @returns Complete Phase 1 results with Tier 1 and Tier 2 analyses
   */
  async executePhase1(webhookPayload: WebhookPayload): Promise<Phase1Results> {
    const startTime = Date.now();
    const startTimestamp = new Date().toISOString();

    this.logger.info({
      submission_id: webhookPayload.submission_id,
      company: webhookPayload.business_overview.company_name,
    }, 'Starting Phase 1 execution');

    try {
      // Step 1: Transform webhook data
      const transformedData = await this.transformWebhookData(webhookPayload);
      const companyProfileId = transformedData.companyProfile.metadata.profile_id;

      // Step 2: Execute Tier 1 analyses (Batch 1 - 5 foundational analyses)
      const tier1Results = await this.executeTier1Analyses(
        transformedData.companyProfile,
        transformedData.questionnaireResponses,
        transformedData.categoryBenchmarks,
        transformedData.crossFunctionalBenchmarks
      );

      // Step 3: Execute Tier 2 analyses (Batch 2 - 5 interconnection analyses)
      const tier2Results = await this.executeTier2Analyses(
        tier1Results,
        transformedData.companyProfile,
        transformedData.questionnaireResponses,
        transformedData.categoryBenchmarks,
        transformedData.crossFunctionalBenchmarks
      );

      // Step 4: Calculate completion metrics
      const tier1SuccessCount = this.countSuccessfulAnalyses(tier1Results);
      const tier2SuccessCount = this.countSuccessfulAnalyses(tier2Results);
      const totalSuccessful = tier1SuccessCount + tier2SuccessCount;
      const totalFailed = 10 - totalSuccessful;

      const status: 'complete' | 'partial' | 'failed' =
        totalSuccessful === 10 ? 'complete' :
        totalSuccessful > 0 ? 'partial' : 'failed';

      const results: Phase1Results = {
        phase: 'phase_1',
        status,
        company_profile_id: companyProfileId,
        tier1: tier1Results,
        tier2: tier2Results,
        metadata: {
          started_at: startTimestamp,
          completed_at: new Date().toISOString(),
          total_duration_ms: Date.now() - startTime,
          total_analyses: 10,
          successful_analyses: totalSuccessful,
          failed_analyses: totalFailed,
        },
      };

      // Step 5: Store results (if enabled)
      if (this.config.enableDatabaseStorage) {
        await this.storeResults(results);
      }

      // Step 6: Write results to file for Phase 2
      await this.writeResults(results);

      this.logger.info({
        company_profile_id: companyProfileId,
        status,
        duration_ms: results.metadata.total_duration_ms,
        successful: totalSuccessful,
        failed: totalFailed,
      }, 'Phase 1 execution complete');

      return results;

    } catch (error) {
      this.logger.error({
        error,
        duration_ms: Date.now() - startTime,
      }, 'Phase 1 execution failed');

      throw error;
    }
  }

  // ==========================================================================
  // Data Transformation
  // ==========================================================================

  /**
   * Transform webhook payload into structured analysis inputs
   */
  private async transformWebhookData(webhook: WebhookPayload): Promise<TransformedData> {
    this.logger.info('Transforming webhook data');

    try {
      // Transform to Company Profile
      const companyProfile = transformToCompanyProfile(webhook);

      // Transform to Questionnaire Responses
      const questionnaireResponses = transformToQuestionnaireResponses(
        webhook,
        companyProfile.metadata.profile_id
      );

      // Retrieve benchmarks
      const categoryBenchmarks = getAllBenchmarks(companyProfile.benchmark_selectors);
      const crossFunctionalBenchmarks = getCrossFunctionalBenchmarks(
        companyProfile.benchmark_selectors
      );

      this.logger.info({
        profile_id: companyProfile.metadata.profile_id,
        response_id: questionnaireResponses.metadata.response_id,
        benchmark_count: Object.keys(categoryBenchmarks).length,
      }, 'Data transformation complete');

      return {
        companyProfile,
        questionnaireResponses,
        categoryBenchmarks,
        crossFunctionalBenchmarks,
      };

    } catch (error) {
      this.logger.error({ error }, 'Data transformation failed');
      throw error;
    }
  }

  // ==========================================================================
  // Tier 1 Execution (Batch 1 - 5 Foundational Analyses)
  // ==========================================================================

  /**
   * Execute Tier 1 analyses in parallel via Batch API
   */
  async executeTier1Analyses(
    cp: CompanyProfile,
    qr: QuestionnaireResponses,
    benchmarks: Record<string, CategoryBenchmarks>,
    crossFunctional: CrossFunctionalBenchmarks
  ): Promise<Tier1Results> {
    const startTime = Date.now();
    const startTimestamp = new Date().toISOString();

    this.logger.info('Executing Tier 1 analyses (Batch 1)');

    try {
      // Build batch requests for 5 Tier 1 analyses
      const batchRequests: BatchRequest[] = [
        this.buildTier1Request('revenue_engine', cp, qr, benchmarks, crossFunctional),
        this.buildTier1Request('operational_excellence', cp, qr, benchmarks, crossFunctional),
        this.buildTier1Request('financial_strategic', cp, qr, benchmarks, crossFunctional),
        this.buildTier1Request('people_leadership', cp, qr, benchmarks, crossFunctional),
        this.buildTier1Request('compliance_sustainability', cp, qr, benchmarks, crossFunctional),
      ];

      // Submit batch and wait for completion
      const batchJob = await this.batchClient.createBatchJob(batchRequests);
      const batchResults = await this.batchClient.pollUntilComplete(batchJob.id);

      // Parse results into typed outputs
      const tier1Results: Tier1Results = {
        revenue_engine: this.parseAnalysisResult('revenue_engine', batchResults),
        operational_excellence: this.parseAnalysisResult('operational_excellence', batchResults),
        financial_strategic: this.parseAnalysisResult('financial_strategic', batchResults),
        people_leadership: this.parseAnalysisResult('people_leadership', batchResults),
        compliance_sustainability: this.parseAnalysisResult('compliance_sustainability', batchResults),
        execution_metadata: {
          batch_id: batchJob.id,
          started_at: startTimestamp,
          completed_at: new Date().toISOString(),
          total_duration_ms: Date.now() - startTime,
        },
      };

      // Check for critical failures
      const successCount = this.countSuccessfulAnalyses(tier1Results);
      if (successCount === 0) {
        // Log individual analysis errors for debugging
        const failedAnalyses = Object.entries(tier1Results).filter(
          ([key, value]) => key !== 'execution_metadata' && value.status === 'failed'
        );

        this.logger.error('All Tier 1 analyses failed - error details:');
        failedAnalyses.forEach(([analysisType, result]) => {
          this.logger.error({
            analysis_type: analysisType,
            error_code: result.error?.code,
            error_message: result.error?.message,
          }, `Analysis failed: ${analysisType}`);
        });

        throw new Error('All Tier 1 analyses failed - aborting Phase 1 pipeline');
      }

      this.logger.info({
        batch_id: batchJob.id,
        duration_ms: tier1Results.execution_metadata.total_duration_ms,
        successful: successCount,
        failed: 5 - successCount,
      }, 'Tier 1 analyses complete');

      return tier1Results;

    } catch (error) {
      this.logger.error({ error }, 'Tier 1 execution failed');
      throw error;
    }
  }

  /**
   * Build batch request for a Tier 1 analysis
   */
  private buildTier1Request(
    analysisType: string,
    cp: CompanyProfile,
    qr: QuestionnaireResponses,
    benchmarks: Record<string, CategoryBenchmarks>,
    crossFunctional: CrossFunctionalBenchmarks
  ): BatchRequest {
    // System prompt defines the analysis framework
    const systemPrompt = this.getTier1SystemPrompt(analysisType);

    // User prompt contains the actual data
    const userPrompt = this.buildTier1UserPrompt(analysisType, cp, qr, benchmarks, crossFunctional);

    return {
      custom_id: `tier1_${analysisType}_${cp.metadata.profile_id.substring(0, 8)}`,
      params: {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        thinking: {
          type: 'enabled',
          budget_tokens: this.config.thinkingBudgetTokens,
        },
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      },
    };
  }

  // ==========================================================================
  // Tier 2 Execution (Batch 2 - 5 Interconnection Analyses)
  // ==========================================================================

  /**
   * Execute Tier 2 analyses in parallel via Batch API
   * These depend on Tier 1 outputs
   */
  async executeTier2Analyses(
    tier1Results: Tier1Results,
    cp: CompanyProfile,
    qr: QuestionnaireResponses,
    benchmarks: Record<string, CategoryBenchmarks>,
    crossFunctional: CrossFunctionalBenchmarks
  ): Promise<Tier2Results> {
    const startTime = Date.now();
    const startTimestamp = new Date().toISOString();

    this.logger.info('Executing Tier 2 analyses (Batch 2)');

    try {
      // Build batch requests for 5 Tier 2 analyses
      const batchRequests: BatchRequest[] = [
        this.buildTier2Request('growth_readiness', tier1Results, cp, qr, benchmarks, crossFunctional),
        this.buildTier2Request('market_position', tier1Results, cp, qr, benchmarks, crossFunctional),
        this.buildTier2Request('resource_optimization', tier1Results, cp, qr, benchmarks, crossFunctional),
        this.buildTier2Request('risk_resilience', tier1Results, cp, qr, benchmarks, crossFunctional),
        this.buildTier2Request('scalability_readiness', tier1Results, cp, qr, benchmarks, crossFunctional),
      ];

      // Submit batch and wait for completion
      const batchJob = await this.batchClient.createBatchJob(batchRequests);
      const batchResults = await this.batchClient.pollUntilComplete(batchJob.id);

      // Parse results into typed outputs
      const tier2Results: Tier2Results = {
        growth_readiness: this.parseAnalysisResult('growth_readiness', batchResults),
        market_position: this.parseAnalysisResult('market_position', batchResults),
        resource_optimization: this.parseAnalysisResult('resource_optimization', batchResults),
        risk_resilience: this.parseAnalysisResult('risk_resilience', batchResults),
        scalability_readiness: this.parseAnalysisResult('scalability_readiness', batchResults),
        execution_metadata: {
          batch_id: batchJob.id,
          started_at: startTimestamp,
          completed_at: new Date().toISOString(),
          total_duration_ms: Date.now() - startTime,
        },
      };

      const successCount = this.countSuccessfulAnalyses(tier2Results);

      this.logger.info({
        batch_id: batchJob.id,
        duration_ms: tier2Results.execution_metadata.total_duration_ms,
        successful: successCount,
        failed: 5 - successCount,
      }, 'Tier 2 analyses complete');

      // Tier 2 failures are logged but don't abort the pipeline
      if (successCount < 5) {
        this.logger.warn({
          failed_count: 5 - successCount,
        }, 'Some Tier 2 analyses failed - continuing with partial results');
      }

      return tier2Results;

    } catch (error) {
      this.logger.error({ error }, 'Tier 2 execution failed');
      throw error;
    }
  }

  /**
   * Build batch request for a Tier 2 analysis
   */
  private buildTier2Request(
    analysisType: string,
    tier1Results: Tier1Results,
    cp: CompanyProfile,
    qr: QuestionnaireResponses,
    benchmarks: Record<string, CategoryBenchmarks>,
    crossFunctional: CrossFunctionalBenchmarks
  ): BatchRequest {
    // System prompt defines the analysis framework
    const systemPrompt = this.getTier2SystemPrompt(analysisType);

    // User prompt contains data + Tier 1 outputs
    const userPrompt = this.buildTier2UserPrompt(
      analysisType,
      tier1Results,
      cp,
      qr,
      benchmarks,
      crossFunctional
    );

    return {
      custom_id: `tier2_${analysisType}_${cp.metadata.profile_id.substring(0, 8)}`,
      params: {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        thinking: {
          type: 'enabled',
          budget_tokens: this.config.thinkingBudgetTokens,
        },
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      },
    };
  }

  // ==========================================================================
  // Prompt Construction
  // ==========================================================================

  /**
   * Get system prompt for Tier 1 analysis
   * In production, these would be loaded from prompt files
   */
  private getTier1SystemPrompt(analysisType: string): string {
    // Simplified prompts - in production, load from /src/prompts/tier1/
    const prompts: Record<string, string> = {
      revenue_engine: `You are a business analyst specializing in revenue analysis. Analyze the company's revenue generation capabilities across Strategy, Sales, Marketing, and Customer Experience.`,
      operational_excellence: `You are an operations expert. Analyze the company's operational efficiency, workflow documentation, inventory management, and process optimization.`,
      financial_strategic: `You are a financial analyst. Analyze the company's financial health, cash flow, profitability, and strategic financial readiness.`,
      people_leadership: `You are an HR and leadership consultant. Analyze the company's people infrastructure, culture, leadership effectiveness, and talent management.`,
      compliance_sustainability: `You are a compliance and risk management expert. Analyze the company's regulatory compliance, legal documentation, and sustainability practices.`,
    };

    return prompts[analysisType] || 'You are a business analyst.';
  }

  /**
   * Build user prompt for Tier 1 analysis with data
   */
  private buildTier1UserPrompt(
    analysisType: string,
    cp: CompanyProfile,
    qr: QuestionnaireResponses,
    benchmarks: Record<string, CategoryBenchmarks>,
    crossFunctional: CrossFunctionalBenchmarks
  ): string {
    return `
# ${analysisType.toUpperCase().replace('_', ' ')} ANALYSIS

## Company Profile
${JSON.stringify(cp, null, 2)}

## Questionnaire Responses
${JSON.stringify(qr, null, 2)}

## Industry Benchmarks
${JSON.stringify(benchmarks, null, 2)}

## Cross-Functional Benchmarks
${JSON.stringify(crossFunctional, null, 2)}

---

Provide a comprehensive analysis of this company's ${analysisType.replace('_', ' ')} based on the data above.
Include:
1. Current state assessment
2. Benchmark comparison
3. Key strengths
4. Critical gaps
5. Recommendations
`.trim();
  }

  /**
   * Get system prompt for Tier 2 analysis
   */
  private getTier2SystemPrompt(analysisType: string): string {
    const prompts: Record<string, string> = {
      growth_readiness: `You are a growth strategy consultant. Analyze the company's readiness for growth by synthesizing insights from revenue, operations, finance, and people capabilities.`,
      market_position: `You are a market positioning expert. Analyze the company's competitive position by synthesizing revenue engine performance and strategic factors.`,
      resource_optimization: `You are a resource optimization consultant. Analyze how effectively the company utilizes its operational, financial, and people resources.`,
      risk_resilience: `You are a risk management consultant. Analyze the company's resilience by synthesizing compliance, operational, financial, and leadership risks.`,
      scalability_readiness: `You are a scalability expert. Analyze the company's ability to scale by evaluating operational, technological, and organizational capacity.`,
    };

    return prompts[analysisType] || 'You are a business analyst.';
  }

  /**
   * Build user prompt for Tier 2 analysis with Tier 1 outputs
   */
  private buildTier2UserPrompt(
    analysisType: string,
    tier1Results: Tier1Results,
    cp: CompanyProfile,
    qr: QuestionnaireResponses,
    benchmarks: Record<string, CategoryBenchmarks>,
    crossFunctional: CrossFunctionalBenchmarks
  ): string {
    return `
# ${analysisType.toUpperCase().replace('_', ' ')} ANALYSIS

## Tier 1 Analysis Results

### Revenue Engine Analysis
${tier1Results.revenue_engine.content}

### Operational Excellence Analysis
${tier1Results.operational_excellence.content}

### Financial & Strategic Analysis
${tier1Results.financial_strategic.content}

### People & Leadership Analysis
${tier1Results.people_leadership.content}

### Compliance & Sustainability Analysis
${tier1Results.compliance_sustainability.content}

---

## Company Profile
${JSON.stringify(cp, null, 2)}

## Questionnaire Responses (Summary)
- Total Questions: ${qr.overall_metrics.total_questions}
- Completion Rate: ${qr.overall_metrics.completion_rate}%
- Overall Score: ${qr.overall_metrics.overall_avg_scale_score}/5

## Benchmarks
${JSON.stringify(crossFunctional, null, 2)}

---

Based on the Tier 1 analyses above, provide a comprehensive ${analysisType.replace('_', ' ')} analysis.
This should synthesize insights across multiple dimensions to assess:
1. Cross-functional assessment
2. Interconnected strengths and gaps
3. Systemic issues and opportunities
4. Strategic recommendations
`.trim();
  }

  // ==========================================================================
  // Result Parsing & Validation
  // ==========================================================================

  /**
   * Parse batch result into typed AnalysisOutput
   */
  private parseAnalysisResult(
    analysisType: string,
    batchResults: BatchResult[]
  ): AnalysisOutput {
    // Find result matching this analysis type
    const result = batchResults.find(r =>
      r.custom_id.includes(analysisType)
    );

    if (!result) {
      return {
        analysis_id: `${analysisType}_missing`,
        analysis_type: analysisType,
        status: 'failed',
        content: '',
        metadata: {
          input_tokens: 0,
          output_tokens: 0,
          model: this.config.model,
          execution_time_ms: 0,
        },
        error: {
          code: 'RESULT_NOT_FOUND',
          message: 'No result found for this analysis',
        },
      };
    }

    // Handle failed results
    if (result.result.type === 'errored') {
      // Log full error details for debugging
      this.logger.error({
        analysis_type: analysisType,
        custom_id: result.custom_id,
        error_object: result.result.error,
      }, 'Batch request failed with error');

      return {
        analysis_id: result.custom_id,
        analysis_type: analysisType,
        status: 'failed',
        content: '',
        metadata: {
          input_tokens: 0,
          output_tokens: 0,
          model: this.config.model,
          execution_time_ms: 0,
        },
        error: {
          code: result.result.error?.type || 'UNKNOWN_ERROR',
          message: result.result.error?.message || 'Analysis failed',
        },
      };
    }

    // Extract successful result content
    const message = result.result.message;
    if (!message) {
      return {
        analysis_id: result.custom_id,
        analysis_type: analysisType,
        status: 'failed',
        content: '',
        metadata: {
          input_tokens: 0,
          output_tokens: 0,
          model: this.config.model,
          execution_time_ms: 0,
        },
        error: {
          code: 'NO_MESSAGE',
          message: 'Result has no message content',
        },
      };
    }

    // Extract text content (combine thinking and text blocks)
    const textBlocks = message.content.filter(c => c.type === 'text');
    const content = textBlocks.map(b => b.text).join('\n\n');

    return {
      analysis_id: result.custom_id,
      analysis_type: analysisType,
      status: 'complete',
      content,
      metadata: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        thinking_tokens: message.content.find(c => c.type === 'thinking')?.text?.length || 0,
        model: message.model,
        execution_time_ms: 0, // Not provided by batch API
      },
    };
  }

  /**
   * Count successful analyses in results
   */
  private countSuccessfulAnalyses(results: Tier1Results | Tier2Results): number {
    const analyses = Object.values(results).filter(
      v => typeof v === 'object' && 'status' in v
    ) as AnalysisOutput[];

    return analyses.filter(a => a.status === 'complete').length;
  }

  // ==========================================================================
  // Storage
  // ==========================================================================

  /**
   * Store Phase 1 results in database
   * TODO: Implement database storage
   */
  private async storeResults(results: Phase1Results): Promise<void> {
    this.logger.info({
      company_profile_id: results.company_profile_id,
      status: results.status,
    }, 'Storing Phase 1 results (TODO: implement database)');

    // TODO: Implement database storage
    // - Store to PostgreSQL/MongoDB
    // - Include all analyses
    // - Include metadata
    // - Enable retrieval by company_profile_id
  }

  /**
   * Write Phase 1 results to JSON file for Phase 2 consumption
   */
  private async writeResults(results: Phase1Results): Promise<void> {
    const outputDir = this.config.outputDir;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `phase1-results-${results.company_profile_id.substring(0, 8)}-${timestamp}.json`;
    const outputPath = path.join(outputDir, filename);

    this.logger.info({ output_path: outputPath }, 'Writing Phase 1 results to file');

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Write results to file
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      this.logger.info({ output_path: outputPath }, 'Phase 1 results written successfully');
    } catch (error) {
      this.logger.error({ error, output_path: outputPath }, 'Failed to write Phase 1 results');
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get the underlying batch client
   */
  getBatchClient(): AnthropicBatchClient {
    return this.batchClient;
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<Omit<Phase1OrchestratorConfig, 'apiKey' | 'logger'>> {
    return { ...this.config };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create Phase 1 orchestrator with environment-based configuration
 */
export function createPhase1Orchestrator(
  overrides?: Partial<Phase1OrchestratorConfig>
): Phase1Orchestrator {
  return new Phase1Orchestrator(overrides);
}
